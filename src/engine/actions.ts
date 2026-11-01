/**
 * Ausführung aufgelöster Adventure-Intents über die zentrale Engine.
 * Keine Aktion behauptet etwas, das physisch (noch) nicht möglich ist (GDD §5.4).
 */
import { GAME_CONFIG } from '../content/config';
import { FACT_BY_ID, FACT_CATEGORIES, factText } from '../content/facts';
import { isHard } from './difficulty';
import { OBJECT_BY_ID } from '../content/objects';
import { PUZZLES } from '../content/puzzles';
import { STATIONS } from '../content/radio';
import { TOPIC_BY_ID } from '../content/dialogue';
import type { GameEffect } from './types';
import type { Intent, Segment } from '../parser/adventure';
import { normalize } from '../parser/normalize';
import { c64Key, c64Line, powerOff, powerOn } from '../sim/c64';
import { formatClock, formatDm } from './clock';
import { evalCondition } from './conditions';
import type { Ctx } from './context';
import { applyEffects, discoverFact } from './effects';
import { describe, inventoryText, itemsAt, listNames, lookAround } from './describe';
import { dial, dropCarrier, handsetIntoCoupler, hangUp, pickUp, talkAbout } from './phone';
import { capitalize, isReachable, resolveObject, resolveTopic, type ResolveOptions } from './resolve';
import { canSleepNow, requestAbsence, sleep } from './routine';
import { advanceTime } from './time';

const DEFAULT_MINUTES = 1;

const HELP_TEXT = `So spielst du (Beispiele – Groß-/Kleinschreibung und Umlaute egal):
• Umsehen: SCHAU DICH UM · UNTERSUCHE DISKETTE · SIEH AUF DEN MONITOR
• Gegenstände: NIMM … · LEGE DISKETTE INS LAUFWERK · ÖFFNE SCHUBLADE · NIMM DISKETTE AUS DEM LAUFWERK
• Geräte: SCHALTE COMPUTER EIN · SCHALTE RADIO EIN · STELLE RADIO AUF BFBS
• Telefon: NIMM HÖRER · WÄHLE 12345 · RUFE RALF AN · LEGE HÖRER IN DEN KOPPLER · LEGE AUF
• Gespräche: FRAGE RALF NACH DEM SPIEL · REDE MIT RALF ÜBER DAS TRAINING · THEMEN
• C64: Eigene Eingabezeile unter dem Monitor (z. B. LOAD"$",8 zeigt das Diskettenverzeichnis). Vom Adventure aus: TIPPE LOAD"$",8 · DRÜCKE LEERTASTE · Alle C64-Befehle: HILFE C64
• Notizen: NOTIZEN · NOTIERE <Text> · VERKNÜPFE <A> MIT <B> · DENKE NACH (Hilfe in 3 Stufen)
• Zeit & Spiel: ZEIT · WARTE (15 Min.) · WARTE 30 · SCHLAFE (ab 21 Uhr) · INVENTAR · SPEICHERN 1 · LADEN 1 · SPIELSTÄNDE`;

/** Ausführliche C64-Hilfe (HILFE C64). Im Schwierigkeitsgrad »Schwer« ohne Speicheradressen. */
function c64HelpText(hard: boolean): string {
  return `C64 – die wichtigsten Befehle (in die Eingabezeile unter dem Monitor tippen, jede Zeile mit RETURN):
Disketten (Laufwerk = Gerät 8)
• LOAD"$",8 und dann LIST – Inhaltsverzeichnis der Diskette (überschreibt ein geladenes Programm!)
• LOAD"NAME",8 – Programm laden · LOAD"*",8 – das erste Programm der Diskette laden
• RUN – geladenes Programm starten · LIST – BASIC-Programm anzeigen (LIST 10-50: nur diese Zeilen)
• SAVE"NAME",8 – eigenes Programm speichern (nicht auf schreibgeschützten Disketten)
Kassette (Datasette = Gerät 1, erst anschließen und Kassette einlegen)
• LOAD – lädt das nächste Programm vom Band · LOAD"NAME",1 – sucht ein bestimmtes
Rechnen und Ausgeben
• PRINT 2*3 · PRINT "HALLO" · PRINT CHR$(65) – Zeichen zum Code · PRINT ASC("A") – Code zum Zeichen (? = Kurzform für PRINT)
• ${hard ? 'POKE Adresse,Wert – schreibt einen Wert in den Speicher, z. B. für Farben. Welche Adressen? Schau dir an, was andere Programme tun.' : 'POKE Adresse,Wert – schreibt in den Speicher. POKE 53280,x = Rahmenfarbe, POKE 53281,x = Hintergrund (0 schwarz, 1 weiß, 6 blau, 14 hellblau)'}
Eigene Programme
• Zeilen mit Nummer werden gespeichert, ohne Nummer sofort ausgeführt: 10 PRINT "HALLO" · 20 GOTO 10 · RUN
• FOR I=1 TO 5 … NEXT · IF … THEN · READ A mit DATA 1,2,3 · INPUT A$ · NEW (Programm löschen)
• Dateien: OPEN 2,8,2,"NAME,S,R" · INPUT#2,A$ · GET#2,A$ · CLOSE 2 (ST = Status, 64 = Dateiende)
Tasten (Leiste unter dem Monitor)
• RUN/STOP (Esc) bricht ab · RETURN · LEERTASTE · ← (auf PC-Tastaturen ^ oder \`) · CLR/HOME · F1–F7
• Läuft ein Programm im Tastenmodus, geht jede Taste direkt an das Programm.
Abkürzungen im Adventure: ZEIGE DATEIEN · LADE SPIEL · TIPPE <Zeile> · DRÜCKE <Taste>`;
}

interface Verb {
  kind: 'verb';
  verb: string;
  verbWord: string;
  segments: Segment[];
}

const QUESTION: Record<string, string> = {
  examine: 'untersuchen',
  take: 'nehmen',
  drop: 'ablegen',
  insert: 'einlegen',
  place: 'hinlegen',
  open: 'öffnen',
  close: 'schließen',
  turnOn: 'einschalten',
  turnOff: 'ausschalten',
  read: 'lesen',
  use: 'benutzen',
  listen: 'hören',
};

function seg(intent: Verb, ...preps: string[]): { words: string[]; index: number } | null {
  const i = intent.segments.findIndex((s) => s.prep !== null && preps.includes(s.prep));
  return i < 0 ? null : { words: intent.segments[i].words, index: i };
}

/** Objekt auflösen und bei Problemen eine passende Meldung ausgeben. */
function obj(ctx: Ctx, intent: Verb, index: number, opts: ResolveOptions = {}): string | null {
  const words = intent.segments[index]?.words ?? [];
  const r = resolveObject(ctx.state, words, opts);
  switch (r.status) {
    case 'ok':
      if (!OBJECT_BY_ID[r.id]?.npc) ctx.state.parser.lastObjectId = r.id;
      return r.id;
    case 'empty':
      ctx.say(`Was möchtest du ${QUESTION[intent.verb] ?? 'damit tun'}?`);
      return null;
    case 'pronoun':
      ctx.say('Worauf beziehst du dich? Nenne den Gegenstand bitte direkt.');
      return null;
    case 'unknown':
      ctx.miss('unknownWord', r.word);
      ctx.say(`Das Wort »${r.word}« kenne ich hier nicht. (HILFE zeigt Beispiele.)`);
      return null;
    case 'unreachable': {
      const o = OBJECT_BY_ID[r.id];
      ctx.miss('unreachable', r.id);
      if (r.id === 'disk_key') ctx.say('Eine Diskette 2 hast du nicht – genau das ist ja das Problem.');
      else if (o.npc) ctx.say(`${capitalize(o.name)} ist nicht hier.`);
      else if (ctx.state.itemLocations[r.id] === 'nowhere')
        ctx.say(`${capitalize(o.acc)} hast du (noch) nicht.`);
      else if (ctx.state.itemLocations[o.partOf ?? r.id] === 'drawer')
        ctx.say(`${capitalize(o.name)} liegt in der Schublade – und die ist zu. (ÖFFNE SCHUBLADE)`);
      else ctx.say(`Davon ist hier gerade nichts zu sehen.`);
      return null;
    }
    case 'ambiguous': {
      const names = r.ids.map((id) => OBJECT_BY_ID[id].short);
      const list =
        names.length === 2
          ? names.join(' oder ')
          : `${names.slice(0, -1).join(', ')} oder ${names[names.length - 1]}`;
      const noun = OBJECT_BY_ID[r.ids[0]].nouns[0];
      ctx.say(`Welche ${capitalize(noun)} meinst du: ${list}?`);
      ctx.state.parser.pending = { intent: JSON.stringify(intent), segIndex: index, candidates: r.ids };
      return null;
    }
  }
}

function preferInventory(ctx: Ctx) {
  return (id: string) => ctx.state.itemLocations[id] === 'inventory';
}

// ---------------------------------------------------------------------------- Gegenstände

function moveDiskIntoDrive(ctx: Ctx, id: string): number {
  const s = ctx.state;
  if (!id.startsWith('disk_')) {
    ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} passt nicht in die 1541.`);
    return 0;
  }
  const current = itemsAt(s, 'drive')[0];
  if (current === id) {
    ctx.say('Die Diskette steckt schon im Laufwerk.');
    return 0;
  }
  if (current) {
    ctx.say(`In der 1541 steckt schon ${OBJECT_BY_ID[current].name}. Nimm sie zuerst heraus.`);
    return 0;
  }
  s.itemLocations[id] = 'drive';
  ctx.cue('drive');
  ctx.say(`Du schiebst ${OBJECT_BY_ID[id].acc} in die 1541 und legst den Verriegelungshebel um. *Klack.*`);
  if (id === 'disk_game' && !s.computer.powerOn) ctx.say('Jetzt noch den Computer einschalten …', 'thought');
  return DEFAULT_MINUTES;
}

function eject(ctx: Ctx, id?: string): number {
  const inDrive = itemsAt(ctx.state, 'drive')[0];
  if (!inDrive || (id && id !== inDrive)) {
    ctx.say(
      id
        ? `${capitalize(OBJECT_BY_ID[id].name)} steckt nicht im Laufwerk.`
        : 'Im Laufwerk steckt keine Diskette.',
    );
    return 0;
  }
  ctx.state.itemLocations[inDrive] = 'inventory';
  ctx.say(`Du klappst den Hebel hoch und ziehst ${OBJECT_BY_ID[inDrive].acc} aus der 1541.`);
  return DEFAULT_MINUTES;
}

function take(ctx: Ctx, id: string): number {
  const o = OBJECT_BY_ID[id];
  const s = ctx.state;
  if (id === 'handset') return pickUp(ctx) || DEFAULT_MINUTES;
  if (id === 'phone') return pickUp(ctx) || DEFAULT_MINUTES;
  if (o.npc) {
    ctx.say(`${capitalize(o.name)} lässt sich nicht einstecken.`);
    return 0;
  }
  if (o.partOf) {
    ctx.say(`Das gehört zu ${OBJECT_BY_ID[o.partOf].dat}. Du kannst es einfach lesen.`);
    return 0;
  }
  if (!o.portable) {
    ctx.say(
      `${capitalize(o.name)} bleibt, wo ${o.gender === 'f' ? 'sie' : o.gender === 'm' ? 'er' : 'es'} ist.`,
    );
    return 0;
  }
  const loc = s.itemLocations[id];
  if (loc === 'inventory') {
    ctx.say(`Du hast ${o.acc} schon.`);
    return 0;
  }
  if (loc === 'drive') return eject(ctx, id);
  if (loc === 'port') return kitOutOfPort(ctx);
  s.itemLocations[id] = 'inventory';
  const from = loc === 'drawer' ? ' aus der Schublade' : loc === 'datasette' ? ' aus der Datasette' : '';
  ctx.say(`Du nimmst ${o.acc}${from}.`);
  return DEFAULT_MINUTES;
}

function drop(ctx: Ctx, id: string): number {
  const o = OBJECT_BY_ID[id];
  if (id === 'handset') return hangUp(ctx);
  if (ctx.state.itemLocations[id] !== 'inventory') {
    ctx.say(`Du hast ${o.acc} gar nicht in der Hand.`);
    return 0;
  }
  ctx.state.itemLocations[id] = 'desk';
  ctx.say(`Du legst ${o.acc} auf den Schreibtisch.`);
  return DEFAULT_MINUTES;
}

/** Datasette an den Kassettenport stecken (passiert beim ersten Einlegen der Kassette automatisch) */
function connectDatasette(ctx: Ctx): boolean {
  if (ctx.state.flags.datasetteConnected) return false;
  ctx.state.flags.datasetteConnected = true;
  ctx.say(
    'Du ziehst die alte Datasette hinter dem Monitor hervor und steckst ihren Stecker in den Kassettenport hinten am C64.',
  );
  return true;
}

function cassetteInto(ctx: Ctx, tgt: string): number {
  const s = ctx.state;
  if (tgt === 'tape') {
    ctx.say(
      'Du schiebst die Kassette probehalber in den Kassettenrekorder und drückst PLAY: nur Kreischen und Pfeifen. Daten – das Band gehört in die Datasette. Du nimmst es wieder heraus.',
    );
    return DEFAULT_MINUTES;
  }
  if (s.itemLocations.cassette === 'datasette') {
    ctx.say('Die Kassette steckt schon in der Datasette.');
    return 0;
  }
  connectDatasette(ctx);
  s.itemLocations.cassette = 'datasette';
  ctx.say(
    'Du drückst EJECT, legst die Kassette ein und klappst das Fach zu. (Am C64: LOAD – Gerät 1 ist der Standard.)',
  );
  return DEFAULT_MINUTES;
}

/** BTX-Set in den Modulschacht stecken bzw. herausziehen – nur bei ausgeschaltetem C64 */
function kitIntoPort(ctx: Ctx): number {
  const s = ctx.state;
  if (s.itemLocations.btx_kit === 'port') {
    ctx.say('Das BTX-Modul steckt schon im Modulschacht.');
    return 0;
  }
  if (s.computer.powerOn) {
    ctx.say(
      'Ein Steckmodul bei laufendem Computer einzustecken, ist der sicherste Weg, den C64 oder das Modul zu beschädigen. Schalte ihn vorher aus.',
    );
    return 0;
  }
  s.itemLocations.btx_kit = 'port';
  ctx.say(
    'Du steckst das Modul vorsichtig in den Modulschacht hinten am C64 und das Postmodem in die Telefondose. Beim nächsten Einschalten meldet sich der Decoder von selbst.',
  );
  discoverFact(ctx, 'btx_howto');
  return DEFAULT_MINUTES;
}

function kitOutOfPort(ctx: Ctx): number {
  const s = ctx.state;
  if (s.itemLocations.btx_kit !== 'port') {
    ctx.say('Im Modulschacht steckt nichts.');
    return 0;
  }
  if (s.computer.powerOn) {
    ctx.say('Nicht bei laufendem Computer! Schalte ihn erst aus.');
    return 0;
  }
  s.itemLocations.btx_kit = 'inventory';
  ctx.say('Du ziehst das BTX-Modul aus dem Modulschacht.');
  return DEFAULT_MINUTES;
}

function insertInto(ctx: Ctx, id: string, target: string | null): number {
  if (id === 'btx_kit' && (target === null || target === 'c64' || target === 'drive1541')) {
    if (target === 'drive1541') {
      ctx.say('In die 1541 passen nur Disketten.');
      return 0;
    }
    return kitIntoPort(ctx);
  }
  if (id === 'handset' || id === 'phone') {
    if (target === null || target === 'coupler') return handsetIntoCoupler(ctx);
    if (target === 'phone') return hangUp(ctx);
  }
  if (id === 'datasette' && (target === null || target === 'c64')) {
    if (!connectDatasette(ctx)) ctx.say('Die Datasette hängt schon am C64.');
    return DEFAULT_MINUTES;
  }
  if (
    id === 'cassette' &&
    (target === null || target === 'datasette' || target === 'tape' || target === 'c64')
  )
    return cassetteInto(ctx, target ?? 'datasette');
  if ((target === 'datasette' || target === 'tape') && id !== 'cassette') {
    ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} passt nicht in ${OBJECT_BY_ID[target].acc}.`);
    return 0;
  }
  const tgt = target ?? (id.startsWith('disk_') ? 'drive1541' : null);
  if (!tgt) {
    ctx.say(`Wohin möchtest du ${OBJECT_BY_ID[id].acc} legen?`);
    return 0;
  }
  if (tgt === 'drive1541' || tgt === 'c64') return moveDiskIntoDrive(ctx, id);
  if (tgt === 'drawer') {
    if (!ctx.state.objectStates.drawer.open) {
      ctx.say('Die Schublade ist zu.');
      return 0;
    }
    if (!OBJECT_BY_ID[id].portable) {
      ctx.say('Das passt nicht in die Schublade.');
      return 0;
    }
    if (ctx.state.itemLocations[id] === 'drive') eject(ctx, id);
    ctx.state.itemLocations[id] = 'drawer';
    ctx.say(`Du legst ${OBJECT_BY_ID[id].acc} in die Schublade.`);
    return DEFAULT_MINUTES;
  }
  if (tgt === 'desk') return drop(ctx, id);
  if (tgt === 'coupler') {
    ctx.say('In die Gummimuffen gehört nur der Telefonhörer.');
    return 0;
  }
  ctx.say('Das passt da nicht hinein.');
  return 0;
}

function open(ctx: Ctx, id: string): number {
  const s = ctx.state;
  switch (id) {
    case 'drawer':
      if (s.objectStates.drawer.open) ctx.say('Die Schublade ist schon offen.');
      else {
        s.objectStates.drawer.open = true;
        const items = itemsAt(s, 'drawer');
        ctx.say(
          `Du ziehst die klemmende Schublade auf.${items.length ? ` Darin: ${listNames(items)}.` : ''}`,
        );
      }
      return DEFAULT_MINUTES;
    case 'door':
      ctx.say(
        'Du öffnest die Tür und schaust in den Flur. Unten läuft der Fernseher, aus der Küche riecht es nach Bratkartoffeln. Du machst die Tür wieder zu – dein Platz ist am Schreibtisch.',
      );
      return DEFAULT_MINUTES;
    case 'magazine':
      return read(ctx, 'magazine');
    case 'c64':
    case 'drive1541':
    case 'monitor':
      ctx.say('Du schraubst deine Geräte nicht auf. Die Garantie ist zwar längst abgelaufen, aber trotzdem.');
      return 0;
    default:
      ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} lässt sich nicht öffnen.`);
      return 0;
  }
}

function close(ctx: Ctx, id: string): number {
  if (id === 'drawer') {
    if (!ctx.state.objectStates.drawer.open) ctx.say('Die Schublade ist schon zu.');
    else {
      ctx.state.objectStates.drawer.open = false;
      ctx.say('Du schiebst die Schublade zu.');
    }
    return DEFAULT_MINUTES;
  }
  if (id === 'door') ctx.say('Die Tür ist zu.');
  else ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} lässt sich nicht schließen.`);
  return 0;
}

function radioProgram(ctx: Ctx): void {
  const st = STATIONS.find((x) => x.id === ctx.state.objectStates.radio.station)!;
  const hour = parseInt(ctx.state.gameClock.slice(11, 13), 10);
  const date = ctx.state.gameClock.slice(0, 10);
  const p = st.program.find((x) => hour >= x.fromHour && hour <= x.toHour && (!x.date || x.date === date));
  ctx.say(`[Radio, ${st.label}] ${p?.text ?? 'Rauschen.'}`, 'caption');
}

function turnOn(ctx: Ctx, id: string): number {
  const s = ctx.state;
  switch (id) {
    case 'c64':
    case 'monitor':
    case 'drive1541':
      if (s.computer.powerOn) {
        ctx.say('Der Computer läuft bereits.');
        return 0;
      }
      powerOn(ctx);
      ctx.cue('drive');
      ctx.say(
        'Du knipst die Steckerleiste an. Der Monitor brummt, das vertraute Blau erscheint, und die 1541 rattert einmal kurz. READY.',
      );
      ctx.say('(Der C64 hat eine eigene Eingabezeile direkt unter dem Monitor.)', 'system');
      ctx.ui.push({ type: 'focus', target: 'c64' });
      return DEFAULT_MINUTES;
    case 'radio':
      if (s.objectStates.radio.on) ctx.say('Das Radio läuft schon.');
      else {
        s.objectStates.radio.on = true;
        ctx.say('Du drehst das Radio an.');
        radioProgram(ctx);
      }
      return DEFAULT_MINUTES;
    case 'tape':
      ctx.say('Ohne Kassette passiert nichts außer einem leisen Surren. Du drückst wieder auf STOP.');
      return 0;
    case 'datasette':
      ctx.say(
        s.flags.datasetteConnected
          ? 'Die Datasette hat keinen Schalter. Tippe am C64 LOAD – dann drückst du PLAY.'
          : 'Die Datasette ist nicht angeschlossen. (STECKE DATASETTE AN oder lege gleich eine Kassette ein.)',
      );
      return 0;
    case 'coupler':
      ctx.say('Der Koppler hat keinen eigenen Schalter; er bekommt Strom über den Userport des C64.');
      return 0;
    default:
      ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} lässt sich nicht einschalten.`);
      return 0;
  }
}

function turnOff(ctx: Ctx, id: string): number {
  const s = ctx.state;
  switch (id) {
    case 'c64':
    case 'monitor':
    case 'drive1541':
      if (!s.computer.powerOn) {
        ctx.say('Der Computer ist schon aus.');
        return 0;
      }
      if (s.telecom.connectedSystemId) dropCarrier(ctx);
      powerOff(ctx);
      ctx.say(
        'Du schaltest die Steckerleiste aus. Der Bildschirm fällt in sich zusammen. (Alles im Speicher ist weg – die Disketten natürlich nicht.)',
      );
      return DEFAULT_MINUTES;
    case 'radio':
      if (!s.objectStates.radio.on) ctx.say('Das Radio ist schon aus.');
      else {
        s.objectStates.radio.on = false;
        ctx.say('Du schaltest das Radio aus.');
      }
      return DEFAULT_MINUTES;
    default:
      ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} lässt sich nicht ausschalten.`);
      return 0;
  }
}

function read(ctx: Ctx, id: string): number {
  const s = ctx.state;
  switch (id) {
    case 'magazine':
      ctx.say(describe(s, 'magazine') + ' (z. B. LIES TABELLE, LIES ARTIKEL, LIES KLEINANZEIGEN)');
      return DEFAULT_MINUTES;
    case 'mag_table':
      ctx.say(describe(s, id));
      discoverFact(ctx, 'chr_table');
      return 2;
    case 'mag_article':
      ctx.say(describe(s, id));
      discoverFact(ctx, 'coupler_howto');
      return 3;
    case 'mag_ads':
      ctx.say(describe(s, id));
      discoverFact(ctx, 'bbs_bitschuppen');
      return 2;
    case 'notebook':
      ctx.ui.push({ type: 'openNotebook' });
      notesSummary(ctx);
      return 0;
    default:
      ctx.say(describe(s, id));
      applyEffects(ctx, OBJECT_BY_ID[id]?.readEffects);
      return DEFAULT_MINUTES;
  }
}

function tune(ctx: Ctx, words: string[]): number {
  const st = STATIONS.find((x) => words.some((w) => x.aliases.includes(w)));
  if (!st) {
    ctx.say(`Welchen Sender? ${STATIONS.map((x) => x.label).join(' · ')}`);
    return 0;
  }
  ctx.state.objectStates.radio.station = st.id;
  if (!ctx.state.objectStates.radio.on) ctx.say('Du schaltest das Radio ein.');
  ctx.state.objectStates.radio.on = true;
  ctx.say(`Du stellst ${st.label} ein.`);
  radioProgram(ctx);
  return DEFAULT_MINUTES;
}

// ---------------------------------------------------------------------------- Personen

const NPC_WORDS: Record<string, string> = {
  ralf: 'ralf',
  seidel: 'seidel',
  mutter: 'mother',
  mama: 'mother',
  mutti: 'mother',
  vater: 'father',
  papa: 'father',
  paps: 'father',
  vati: 'father',
};

function npcNotHere(ctx: Ctx, npc: string): void {
  if (npc === 'ralf') {
    ctx.say(
      ctx.state.flags.ralfDelivered
        ? 'Ralf ist nicht hier. Anrufen könntest du ihn aber (RUFE RALF AN).'
        : 'Ralf ist nicht hier. (Telefonieren könntest du mit ihm.)',
    );
  } else if (npc === 'seidel') ctx.say('Seidel ist nicht hier – und das ist auch besser so.');
  else if (npc === 'mother') ctx.say('Deine Mutter ist unten. Du könntest nach ihr rufen (RUFE MUTTER).');
  else ctx.say(ctx.state.flags.fatherHome ? 'Dein Vater ist unten.' : 'Dein Vater ist noch bei der Arbeit.');
}

function talk(ctx: Ctx, intent: Verb): number {
  // Angesprochene Person steht direkt hinter dem Verb oder hinter "mit"; der Rest ist das Thema.
  const mit = seg(intent, 'mit');
  const addressWords = [...(intent.segments[0]?.words ?? []), ...(mit?.words ?? [])];
  const topicSegments = intent.segments
    .filter((sg, i) => i !== 0 && sg.prep !== 'mit')
    .flatMap((sg) => sg.words);
  let npc = addressWords.map((w) => NPC_WORDS[w]).find(Boolean) ?? null;
  const leftover = addressWords.filter((w) => !npc || NPC_WORDS[w] !== npc);
  if (!npc) npc = ctx.state.conversation?.npc ?? null;
  if (!npc) {
    ctx.say('Mit wem möchtest du sprechen? Gerade ist niemand bei dir.');
    return 0;
  }
  if (ctx.state.conversation?.npc !== npc) {
    npcNotHere(ctx, npc);
    return 0;
  }
  const topicWords = [...leftover, ...topicSegments];
  if (topicWords.length === 0) {
    ctx.say(
      intent.verb === 'ask'
        ? 'Wonach möchtest du fragen? (z. B. FRAGE RALF NACH DEM SPIEL)'
        : 'Worüber möchtest du reden? (THEMEN zeigt bekannte Themen.)',
    );
    return 0;
  }
  return talkAbout(ctx, npc, resolveTopic(topicWords), topicWords.join(' '));
}

function shout(ctx: Ctx, words: string[]): number {
  const npc = words.map((w) => NPC_WORDS[w]).find(Boolean);
  if (npc === 'mother') {
    ctx.say('Du rufst nach unten: »Mama?«');
    ctx.say('(von unten) »Ja? Was ist denn?« – »Ach, nichts!«', 'dialog', 'MUTTER');
    return DEFAULT_MINUTES;
  }
  if (npc === 'father') {
    if (!ctx.state.flags.fatherHome) ctx.say('Dein Vater ist noch gar nicht zu Hause.');
    else ctx.say('(von unten) »Jan? Ich les gerade Zeitung!«', 'dialog', 'VATER');
    return DEFAULT_MINUTES;
  }
  if (npc === 'ralf') {
    if (ctx.state.conversation?.npc === 'ralf')
      ctx.say('Ralf hält den Hörer ein Stück vom Ohr weg. »Schrei doch nicht so!«');
    else npcNotHere(ctx, 'ralf');
    return 0;
  }
  ctx.say('Wen möchtest du rufen? (RUFE MUTTER, RUFE RALF AN)');
  return 0;
}

// ---------------------------------------------------------------------------- Meta

export function notesSummary(ctx: Ctx): void {
  const s = ctx.state;
  if (s.knownFacts.length === 0 && s.deskNotes.length === 0) {
    ctx.say('Dein Notizblock ist noch leer.');
    return;
  }
  const lines: string[] = ['Dein Notizblock:'];
  for (const [cat, label] of Object.entries(FACT_CATEGORIES)) {
    const facts = s.knownFacts.map((f) => FACT_BY_ID[f]).filter((f) => f?.category === cat);
    if (facts.length) lines.push(`${label}:`, ...facts.map((f) => `  – ${factText(s, f.id)}`));
  }
  if (s.deskNotes.length) lines.push('Eigene Notizen:', ...s.deskNotes.map((n) => `  – ${n.text}`));
  if (s.hypotheses.length)
    lines.push('Vermutungen (unbestätigt):', ...s.hypotheses.map((h) => `  – ${h.subject} ↔ ${h.target}`));
  ctx.say(lines.join('\n'), 'system');
}

export function giveHint(ctx: Ctx, puzzleId?: string): void {
  const s = ctx.state;
  const active = puzzleId
    ? PUZZLES.find((p) => p.id === puzzleId)
    : [...PUZZLES]
        .sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent) || a.order - b.order)
        .find((p) => s.puzzles[p.id] === 'discovered' || s.puzzles[p.id] === 'solving');
  if (!active) {
    ctx.say(
      'Dir fällt gerade nichts ein, was du dringend lösen müsstest. Schau dich am Schreibtisch um (SCHAU DICH UM).',
      'thought',
    );
    return;
  }
  const stageIndex = active.stages.findIndex((st) => evalCondition(s, st.when));
  const stage = active.stages[stageIndex < 0 ? active.stages.length - 1 : stageIndex];
  const key = `${active.id}:${stageIndex}`;
  const level = Math.min(3, (s.hintLevels[key] ?? 0) + 1);
  s.hintLevels[key] = level;
  const label = ['Denkanstoß', 'Konkreter Hinweis', 'Hilfestellung'][level - 1];
  ctx.say(`${label} (${level}/3): ${stage.hints[level - 1]}`, 'thought');
  if (level < 3) ctx.say('(Noch einmal DENKE NACH für eine deutlichere Hilfe.)', 'system');
}

function meta(ctx: Ctx, intent: Extract<Intent, { kind: 'meta' }>): number {
  const s = ctx.state;
  switch (intent.meta) {
    case 'help':
      ctx.say(intent.arg === 'c64' ? c64HelpText(isHard(s)) : HELP_TEXT, 'system');
      return 0;
    case 'inventory':
      ctx.say(inventoryText(s));
      return 0;
    case 'notes':
      ctx.ui.push({ type: 'openNotebook' });
      notesSummary(ctx);
      return 0;
    case 'think':
      giveHint(ctx);
      return 0;
    case 'time':
      ctx.say(
        `${formatClock(s.gameClock)}. Du hast ${formatDm(s.moneyDm)}; Telefonkosten bisher: ${formatDm(s.phoneCostsDm)}.`,
        'system',
      );
      return 0;
    case 'save':
      ctx.ui.push({ type: 'save', slot: intent.arg ?? '1' });
      return 0;
    case 'load':
      ctx.ui.push({ type: 'load', slot: intent.arg ?? 'auto' });
      return 0;
    case 'saves':
      ctx.ui.push({ type: 'listSaves' });
      return 0;
    case 'look':
      ctx.say(lookAround(s));
      return DEFAULT_MINUTES;
    case 'topics': {
      const npc = s.conversation?.npc;
      const labels = s.knownTopics.map((t) => TOPIC_BY_ID[t]?.label).filter(Boolean);
      if (!labels.length) ctx.say('Du kennst noch keine besonderen Gesprächsthemen.');
      else if (npc)
        ctx.say(
          `Themen für das Gespräch mit Ralf: ${labels.join(', ')}. (Andere Themen kannst du trotzdem ansprechen.)`,
          'system',
        );
      else ctx.say(`Gerade sprichst du mit niemandem. Bekannte Themen: ${labels.join(', ')}.`, 'system');
      return 0;
    }
    case 'wait': {
      const elapsed = advanceTime(ctx, intent.minutes ?? 15, true);
      ctx.say(`(${elapsed} ${elapsed === 1 ? 'Minute vergeht' : 'Minuten vergehen'}.)`, 'system');
      return 0;
    }
    case 'sleep': {
      if (!canSleepNow(s.gameClock)) {
        ctx.say(
          `Schlafen? Um diese Uhrzeit? Mit dieser Diskette auf dem Tisch? Niemals. (Ab ${GAME_CONFIG.calendar.sleepFrom} Uhr.)`,
        );
        return 0;
      }
      sleep(ctx);
      advanceTime(ctx, 0);
      return 0;
    }
    case 'c64hint':
      ctx.say(
        `Das gibst du am besten direkt am C64 ein (Eingabezeile unter dem Monitor), z. B. LOAD"*",8 und dann RUN. Von hier aus geht auch: TIPPE LOAD"*",8`,
        'system',
      );
      ctx.ui.push({ type: 'focus', target: 'c64' });
      return 0;
  }
}

/** Clubabend als erzählter Zeitblock (GDD: Jan erkundet keine weiteren Orte). */
function goToClub(ctx: Ctx): number {
  const s = ctx.state;
  const c = GAME_CONFIG.club;
  const now = s.gameClock.slice(11, 16);
  if (!s.knownFacts.includes('club_evening')) {
    ctx.say('Zum Computerclub? Wann der sich das nächste Mal trifft, weißt du gerade gar nicht.');
    return 0;
  }
  if (s.gameClock.slice(0, 10) !== c.eveningDate || now < c.leaveFrom || now > c.leaveUntil) {
    ctx.say(
      `Der Clubabend ist am Donnerstag um 19 Uhr. Losgehen solltest du zwischen ${c.leaveFrom} und ${c.leaveUntil} Uhr.`,
    );
    return 0;
  }
  s.flags.clubAttended = true;
  // Ausleihe des BTX-Sets (Annahme: Mitglieder dürfen es probieren, siehe config.btx)
  if (s.itemLocations.btx_kit === 'nowhere') s.itemLocations.btx_kit = 'inventory';
  const G = GAME_CONFIG.ghost;
  const hadGhostWord = s.knownFacts.includes('ghost_word');
  const scene = [
    'Du schnappst dir deine Diskettenbox und radelst durch den Nieselregen zum Jugendzentrum. Drinnen riecht es nach Kaffee und warmen Netzteilen. Ein paar Leute tauschen Disketten, an einem Tisch wird eine Datasette justiert, und jemand schwärmt vom neuen Amiga, den sich keiner leisten kann.',
    `${G.civilName}, der Betreuer des Clubs, Strickjacke, Brille, eine Thermoskanne in der Hand, winkt dich heran. »Jan! Fürwahr, du hast es doch noch geschafft. Setz dich. Schwarzer Kaffee? Nein? Dann eben nicht.« Er stellt dir das BTX-Leihset des Clubs hin: Postmodem, Decoder-Modul, Vereinskennung. »Nimm’s ruhig ein paar Tage mit und schau dir an, was die Post da aufgebaut hat. Aber keine Dummheiten. Wer zu oft ›WarGames‹ geguckt hat, wählt sich irgendwann in die falschen Leitungen. Weiter so.«`,
  ];
  const notes: GameEffect[] = [{ type: 'discoverFact', id: 'brandt_word' }];
  if (hadGhostWord) {
    scene.push(
      'Du hörst genau hin. »Fürwahr.« »Weiter so.« Dieselben Worte, mit denen GHOST seine Beiträge im BIT-SCHUPPEN beendet. Du sagst nichts und trinkst Tee aus einem Pappbecher.',
    );
    notes.push({ type: 'discoverFact', id: 'brandt_is_ghost' });
  }
  requestAbsence(
    ctx,
    'club',
    `${c.eveningDate}T${c.backAt}`,
    scene.join('\n\n'),
    hadGhostWord
      ? 'Kurz vor zehn bist du wieder zu Hause, die Jacke klamm vom Regen, den Kopf voller Fragen – mit dem BTX-Leihset unter dem Arm. Der Betreuer des Clubs und GHOST: Du bist fast sicher, dass es derselbe Mann ist. Ob du ihm trauen kannst, weißt du nicht.'
      : 'Kurz vor zehn bist du wieder zu Hause, die Jacke klamm vom Regen, den Kopf voller neuer Ideen – und mit dem BTX-Leihset des Clubs unter dem Arm, das du dir für ein paar Tage ausleihen durftest. Beim Abschied hat Herr Brandt noch gesagt: »Schau mal in die Club-Mailbox, da steht öfter was Nützliches.«',
  );
  applyEffects(ctx, notes);
  advanceTime(ctx, 0);
  return 0;
}

// ---------------------------------------------------------------------------- Dispatcher

export function runIntent(ctx: Ctx, intent: Intent): number {
  const s = ctx.state;
  switch (intent.kind) {
    case 'empty':
      return 0;
    case 'meta':
      return meta(ctx, intent);
    case 'modern':
      ctx.say(
        `»${intent.word}«? Damit kannst du im Herbst 1986 nichts anfangen. Deine Recherchewerkzeuge sind Zeitschriften, das Telefon, das Radio – und mit Glück eine Mailbox.`,
      );
      return 0;
    case 'unknownVerb':
      ctx.miss('unknownVerb', intent.word);
      ctx.say(
        `Das Verb »${intent.word}« verstehe ich nicht eindeutig.${intent.suggestion ? ` Meintest du: ${intent.suggestion}?` : ''}`,
      );
      return 0;
    case 'bare': {
      if (s.conversation) {
        const topic = resolveTopic(intent.words);
        return talkAbout(ctx, s.conversation.npc, topic, intent.words.join(' '));
      }
      const r = resolveObject(s, intent.words);
      if (
        intent.words.length === 1 &&
        ['ja', 'nein', 'ok', 'okay', 'genau', 'stimmt', 'vielleicht'].includes(intent.words[0])
      )
        ctx.say('Niemand hat dich gerade etwas gefragt. Was möchtest du tun? (HILFE zeigt Beispiele.)');
      else if (r.status === 'ok') ctx.say(`Was möchtest du mit ${OBJECT_BY_ID[r.id].dat} machen?`);
      else {
        ctx.miss('bare', intent.words.join(' '));
        ctx.say(
          `Ich verstehe »${intent.words.join(' ')}« nicht. Beginne mit einem Verb, z. B. UNTERSUCHE DISKETTE oder NIMM HÖRER. (HILFE zeigt Beispiele.)`,
        );
      }
      return 0;
    }
    case 'dial':
      if (!intent.number && intent.words.includes('ralf')) return dial(ctx, GAME_CONFIG.ralf.phoneNumber);
      return dial(ctx, intent.number);
    case 'type':
      if (!s.computer.powerOn) {
        ctx.say('Der C64 ist aus. (SCHALTE COMPUTER EIN)');
        return 0;
      }
      ctx.say(`Du tippst am C64: ${intent.text}`, 'system');
      return c64Line(ctx, intent.text);
    case 'press':
      if (!intent.key) {
        ctx.say('Welche Taste? (z. B. DRÜCKE LEERTASTE, DRÜCKE RETURN, DRÜCKE PFEILTASTE, DRÜCKE RUN/STOP)');
        return 0;
      }
      if (!s.computer.powerOn) {
        ctx.say('Der C64 ist aus.');
        return 0;
      }
      ctx.say(`Du drückst am C64 ${intent.key === 'ARROW_LEFT' ? '←' : intent.key}.`, 'system');
      return c64Key(ctx, intent.key);
    case 'note': {
      if (!intent.text.trim()) {
        ctx.say('Was möchtest du notieren? (z. B. NOTIERE Ralf fragen, ob es eine Diskette 2 gibt)');
        return 0;
      }
      s.deskNotes.push({
        id: `n${s.commandCount}_${s.deskNotes.length}`,
        text: intent.text.trim().slice(0, 500),
        createdAtGameTime: s.gameClock,
      });
      ctx.say('Du kritzelst die Notiz in deinen Block.');
      return 0;
    }
    case 'link': {
      if (!intent.subject || !intent.target) {
        ctx.say('Was möchtest du womit verknüpfen? (z. B. VERKNÜPFE RALF MIT DISKETTE)');
        return 0;
      }
      s.hypotheses.push({
        id: `h${s.hypotheses.length + 1}`,
        subject: intent.subject.toUpperCase(),
        target: intent.target.toUpperCase(),
        status: 'vermutung',
      });
      ctx.say(
        `Du ziehst im Notizblock einen Pfeil: ${intent.subject.toUpperCase()} ↔ ${intent.target.toUpperCase()}. (Nur eine Vermutung – bewiesen ist damit nichts.)`,
      );
      return 0;
    }
    case 'verb':
      return verb(ctx, intent as Verb);
  }
}

function verb(ctx: Ctx, intent: Verb): number {
  const s = ctx.state;
  const direct = intent.segments[0]?.words ?? [];
  switch (intent.verb) {
    case 'lookat':
    case 'examine': {
      let index = 0;
      if (direct.length === 0) {
        const other = seg(intent, 'auf', 'in', 'ins', 'an', 'am', 'aus', 'unter', 'hinter');
        if (!other) {
          if (intent.verb === 'lookat') return meta(ctx, { kind: 'meta', meta: 'look' });
          ctx.say('Was möchtest du untersuchen?');
          return 0;
        }
        index = other.index;
      }
      const id = obj(ctx, intent, index);
      if (!id) return 0;
      if (id === 'disk_game') discoverFact(ctx, 'disk_label');
      if (id === 'ralf' && s.conversation?.npc === 'ralf' && !s.flags.ralfPresent) {
        ctx.say('Ralf ist am Telefon – sehen kannst du ihn nicht.');
        return 0;
      }
      ctx.say(describe(s, id));
      return DEFAULT_MINUTES;
    }
    case 'take': {
      const from = seg(intent, 'aus');
      if (from) {
        if (direct.length === 0) return eject(ctx);
        const src = obj(ctx, intent, from.index);
        if (!src) return 0;
        // Im Laufwerk kann nur eine Diskette stecken – keine Rückfrage, welche gemeint ist.
        if (src === 'drive1541' || src === 'c64') {
          const inDrive = itemsAt(s, 'drive')[0];
          if (!inDrive) return eject(ctx);
          const id = obj(ctx, intent, 0, { prefer: (i) => i === inDrive });
          if (!id) return 0;
          return id === 'drive1541' || id === 'c64' ? eject(ctx) : eject(ctx, id);
        }
      }
      const id = obj(ctx, intent, 0, { prefer: (i) => s.itemLocations[i] !== 'inventory' });
      return id ? take(ctx, id) : 0;
    }
    case 'drop': {
      const id = obj(ctx, intent, 0, { prefer: preferInventory(ctx) });
      return id ? drop(ctx, id) : 0;
    }
    case 'eject': {
      if (direct.length === 0) return eject(ctx);
      const id = obj(ctx, intent, 0, { prefer: (i) => s.itemLocations[i] === 'drive' });
      if (!id) return 0;
      if (id === 'handset') return pickUp(ctx);
      if (id === 'drive1541') return eject(ctx);
      if (id === 'btx_kit') return kitOutOfPort(ctx);
      if (id === 'cassette' || id === 'datasette') {
        if (s.itemLocations.cassette !== 'datasette') {
          ctx.say('In der Datasette steckt keine Kassette.');
          return 0;
        }
        return take(ctx, 'cassette');
      }
      return eject(ctx, id);
    }
    case 'insert':
    case 'place': {
      const into = seg(intent, 'in', 'ins', 'im');
      const onto = seg(intent, 'auf', 'aufs');
      const id = obj(ctx, intent, 0, { prefer: preferInventory(ctx) });
      if (!id) return 0;
      if (id === 'radio' && onto) return tune(ctx, onto.words);
      if (into) {
        const t = obj(ctx, intent, into.index);
        return t ? insertInto(ctx, id, t) : 0;
      }
      if (onto) {
        const t = obj(ctx, intent, onto.index);
        if (!t) return 0;
        if ((id === 'handset' || id === 'phone') && t === 'phone') return hangUp(ctx);
        if (t === 'desk') return drop(ctx, id);
        ctx.say(`Du legst ${OBJECT_BY_ID[id].acc} lieber nicht auf ${OBJECT_BY_ID[t].acc}.`);
        return 0;
      }
      if (intent.verb === 'place' && !id.startsWith('disk_') && id !== 'handset') return drop(ctx, id);
      return insertInto(ctx, id, null);
    }
    case 'open': {
      const id = obj(ctx, intent, 0);
      return id ? open(ctx, id) : 0;
    }
    case 'close': {
      const id = obj(ctx, intent, 0);
      return id ? close(ctx, id) : 0;
    }
    case 'turnOn':
    case 'turnOff': {
      const id = obj(ctx, intent, 0);
      if (!id) return 0;
      return intent.verb === 'turnOn' ? turnOn(ctx, id) : turnOff(ctx, id);
    }
    case 'start': {
      const words = direct.concat(intent.segments.slice(1).flatMap((x) => x.words));
      if (words.some((w) => ['spiel', 'programm', 'demo', 'intro', 'archiv', 'intruder'].includes(w))) {
        return meta(ctx, { kind: 'meta', meta: 'c64hint' });
      }
      const id = obj(ctx, intent, 0);
      if (!id) return 0;
      if (['c64', 'monitor', 'drive1541'].includes(id)) return turnOn(ctx, id);
      if (id === 'radio') return turnOn(ctx, id);
      if (id.startsWith('disk_')) return meta(ctx, { kind: 'meta', meta: 'c64hint' });
      ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} lässt sich nicht starten.`);
      return 0;
    }
    case 'read': {
      if (direct.length === 0 && !seg(intent, 'in', 'im')) {
        ctx.say('Was möchtest du lesen?');
        return 0;
      }
      const id = obj(ctx, intent, direct.length ? 0 : seg(intent, 'in', 'im')!.index);
      if (!id) return 0;
      if (id === 'disk_game') discoverFact(ctx, 'disk_label');
      return read(ctx, id);
    }
    case 'use': {
      const id = obj(ctx, intent, 0);
      if (!id) return 0;
      switch (id) {
        case 'c64':
        case 'monitor':
          if (!s.computer.powerOn) return turnOn(ctx, id);
          ctx.say(
            'Du rückst die Tastatur zurecht. (Eingaben für den C64 gehören in die C64-Eingabezeile unter dem Monitor.)',
          );
          ctx.ui.push({ type: 'focus', target: 'c64' });
          return 0;
        case 'phone':
        case 'handset':
          return pickUp(ctx);
        case 'coupler':
          ctx.say('Für den Koppler: Nummer wählen, auf den Pfeifton warten, dann LEGE HÖRER IN DEN KOPPLER.');
          return 0;
        case 'radio':
          return s.objectStates.radio.on ? turnOff(ctx, id) : turnOn(ctx, id);
        case 'notebook':
          return read(ctx, 'notebook');
        case 'magazine':
          return read(ctx, id);
        case 'drawer':
          return s.objectStates.drawer.open ? close(ctx, id) : open(ctx, id);
        default:
          if (id.startsWith('disk_')) return insertInto(ctx, id, null);
          ctx.say(`Wie möchtest du ${OBJECT_BY_ID[id].acc} benutzen? Versuch es genauer.`);
          return 0;
      }
    }
    case 'pickup':
      if (direct.length) {
        const id = obj(ctx, intent, 0);
        if (!id) return 0;
        if (id !== 'handset' && id !== 'phone') {
          ctx.say(`${capitalize(OBJECT_BY_ID[id].name)} hebst du nicht ab.`);
          return 0;
        }
      }
      return pickUp(ctx) || DEFAULT_MINUTES;
    case 'hangup':
      return hangUp(ctx);
    case 'call': {
      const words = intent.segments.flatMap((x) => x.words);
      const digits = words.filter((w) => /^\d+$/.test(w)).join('');
      if (digits) return dial(ctx, digits);
      const npc = words.map((w) => NPC_WORDS[w]).find(Boolean);
      if (npc === 'ralf') return dial(ctx, GAME_CONFIG.ralf.phoneNumber);
      if (npc) return shout(ctx, words);
      ctx.say('Wen möchtest du anrufen? (z. B. RUFE RALF AN oder WÄHLE 12345)');
      return 0;
    }
    case 'shout':
      return shout(
        ctx,
        intent.segments.flatMap((x) => x.words),
      );
    case 'tune': {
      const words = intent.segments.flatMap((x) => x.words).filter((w) => w !== 'radio');
      if (!isReachable(s, 'radio')) return 0;
      return tune(ctx, words);
    }
    case 'listen': {
      const words = intent.segments.flatMap((x) => x.words);
      if (words.length === 0 || words.includes('radio')) {
        if (words.length === 0 && !s.objectStates.radio.on) {
          ctx.say('Du lauschst: Unten läuft der Fernseher, draußen zischt ein Auto über die nasse Straße.');
          return DEFAULT_MINUTES;
        }
        if (!s.objectStates.radio.on) ctx.say('Das Radio ist aus.');
        else radioProgram(ctx);
        return DEFAULT_MINUTES;
      }
      const id = obj(ctx, { ...intent, segments: [{ prep: null, words }] }, 0);
      if (!id) return 0;
      if (id === 'radio')
        return s.objectStates.radio.on ? (radioProgram(ctx), 1) : (ctx.say('Das Radio ist aus.'), 0);
      if (id === 'handset' || id === 'phone') {
        const c = s.telecom.call;
        if (s.telecom.handset === 'cradle') ctx.say('Der Hörer liegt auf der Gabel.');
        else if (!c || c.kind === 'dialtone') ctx.say('Das Freizeichen tutet.');
        else if (c.kind === 'carrier') ctx.say('Der schrille Pfeifton eines Modems.');
        else if (c.kind === 'dead') ctx.say('Nur noch das Besetztzeichen. Zeit aufzulegen.');
        else ctx.say('Du hörst zu.');
        return 0;
      }
      ctx.say(`Von ${OBJECT_BY_ID[id].dat} hörst du nichts Besonderes.`);
      return 0;
    }
    case 'ask':
    case 'tell':
    case 'talk':
      return talk(ctx, intent);
    case 'bye':
      if (s.conversation) return hangUp(ctx);
      ctx.say('Es ist niemand da, von dem du dich verabschieden könntest.');
      return 0;
    case 'greet':
      if (s.conversation?.npc === 'ralf') ctx.say('»Ja, hallo! Hör zu …«', 'dialog', 'RALF');
      else ctx.say('Niemand antwortet. Unten läuft der Fernseher.');
      return 0;
    case 'go': {
      const words = intent.segments.flatMap((x) => x.words);
      if (words.some((w) => ['tuer', 'flur', 'zimmertuer', 'haustuer', 'treppe'].includes(w)))
        return open(ctx, 'door');
      if (words.some((w) => ['club', 'computerclub', 'clubabend', 'jugendzentrum'].includes(w)))
        return goToClub(ctx);
      ctx.say('Du bleibst an deinem Schreibtisch. Die Welt kommt zu dir – per Telefon, Post und Modem.');
      return 0;
    }
    case 'search': {
      const id = obj(ctx, intent, direct.length ? 0 : (seg(intent, 'in', 'im')?.index ?? 0));
      if (!id) return 0;
      if (id === 'drawer') return s.objectStates[id].open ? (ctx.say(describe(s, id)), 1) : open(ctx, id);
      if (id === 'desk') return meta(ctx, { kind: 'meta', meta: 'look' });
      ctx.say(describe(s, id));
      return DEFAULT_MINUTES;
    }
    case 'violence':
      ctx.say('Gewalt hilft dem Brotkasten auch nicht. Du atmest einmal tief durch.');
      return 0;
    case 'eat':
      ctx.say('Abendessen gibt es später. Bis dahin hältst du durch.');
      return 0;
    case 'play': {
      const words = intent.segments.flatMap((x) => x.words);
      if (words.some((w) => ['demo', '1001', 'intruder'].includes(w))) {
        ctx.say(
          'Die Demo liegt auf der Diskette »1001«: Diskette einlegen, am C64 LOAD"*",8 und RUN.',
          'system',
        );
        return 0;
      }
      return meta(ctx, { kind: 'meta', meta: 'c64hint' });
    }
  }
  ctx.say(`Das kann ich so nicht ausführen: »${normalize(intent.verbWord)}«.`);
  return 0;
}
