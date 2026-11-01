/**
 * Das versteckte Kommunikationsmodul auf Diskette 1 ("MODUL K", Name = Platzhalter).
 * Ohne Diskette 2 nur eingeschränkter Betrieb – aber der erste Netzkontakt ist möglich (GDD §7.5).
 * Mit der echten Diskette 2 (Seidels Original) läuft es voll: Schlüssel geladen, Senden frei.
 */
import { GAME_CONFIG } from '../../content/config';
import { MAILBOXES, SECRET_SENDS, type MailboxMessage, type SecretSend } from '../../content/networks';
import { FULL_KEY, K01_CIPHERTEXT, decrypt, groups, readable } from '../../engine/cipher';
import { evalCondition } from '../../engine/conditions';
import type { Ctx } from '../../engine/context';
import { applyEffects, discoverFact, scheduleEvent, setPuzzle } from '../../engine/effects';
import { changeRelationship, lockNote, lockedUntil } from '../../engine/pressure';
import type { AppState, GameState } from '../../engine/types';
import { diskInDrive } from '../drive';
import { centered } from '../screen';
import { pad, type AppDef } from './types';

type Screen =
  | 'insert'
  | 'nokey'
  | 'menu'
  | 'status'
  | 'dial'
  | 'key'
  | 'online'
  | 'list'
  | 'read'
  | 'sys'
  | 'send';

export interface ModkState extends AppState {
  id: 'modk';
  screen: Screen;
  note: string | null;
  msg: number;
  /** Sendeversuch in dieser Verbindung schon als Risiko verbucht */
  sendTried?: boolean;
  /** Von Hand eingegebener Ersatzschlüssel (gilt, solange das Modul läuft) */
  key?: string;
  /** Eingabe im Schlüsseldialog */
  keyInput?: string;
  /** Echte Schlüsseldiskette beim Start erkannt (Vollbetrieb) */
  full?: boolean;
}

const KEY_LENGTH = GAME_CONFIG.keyStrand.parts.join('').length;
const K01 = 'msg_k01_all';

const N = GAME_CONFIG.secretNetwork;
const ONLINE_SCREENS: Screen[] = ['online', 'list', 'read', 'sys', 'send'];

/** Kurzmeldungen, die jetzt gesendet werden können (jede nur einmal) */
export function availableSends(state: GameState): SecretSend[] {
  return SECRET_SENDS.filter((x) => !state.flags[`sent_${x.id}`] && evalCondition(state, x.when));
}

/** Nachrichten, die beim aktuellen Stand sichtbar sind (Tonfall je nach Verdachtsstufe) */
export function visibleMessages(state: GameState): MailboxMessage[] {
  return MAILBOXES.secret.boards[0].messages.filter((m) => evalCondition(state, m.when));
}

export function modkDropCarrier(ctx: Ctx): void {
  const app = ctx.state.computer.app;
  if (app && app.id === 'modk') {
    const m = app as ModkState;
    m.screen = 'menu';
    m.note = 'NO CARRIER';
  }
}

function tryConnect(ctx: Ctx, app: ModkState): number {
  const t = ctx.state.telecom;
  if (t.handset === 'coupler' && t.call?.kind === 'carrier' && t.call.with && t.call.with !== 'secret') {
    app.note = 'GEGENSTELLE UNBEKANNT';
    return 1;
  }
  if (t.handset === 'coupler' && t.call?.kind === 'carrier' && t.call.with) {
    const box = MAILBOXES[t.call.with];
    const until = lockedUntil(ctx.state, box.id);
    if (until) {
      t.call.kind = 'dead';
      ctx.state.objectStates.coupler.carrier = false;
      app.note = lockNote(until);
      ctx.say('Das Netz nimmt die Kennung nicht an und legt sofort wieder auf.');
      return 1;
    }
    t.connectedSystemId = box.id;
    app.sendTried = false;
    changeRelationship(ctx, 'seidelSuspicion', GAME_CONFIG.risk.secretLogin, 'Anmeldung');
    t.currentUserHandle = box.autoHandle ?? null;
    app.screen = 'online';
    app.note = null;
    ctx.cue('modem');
    ctx.say('[Modemton – dann Stille. Zeichen für Zeichen tröpfeln über den Bildschirm.]', 'caption');
    if (!ctx.state.flags.firstOnline) {
      ctx.state.flags.firstOnline = true;
      ctx.say(
        'Du bist drin. Dein Herz klopft bis zum Hals – mit 300 Baud in einem fremden System.',
        'thought',
      );
      discoverFact(ctx, 'secret_mailbox');
      setPuzzle(ctx, 'P05', 'solved');
      setPuzzle(ctx, 'P06', 'discovered');
      scheduleEvent(ctx, 'ev_mother_modem', 4);
      ctx.state.relationships.networkCredibility = Math.min(
        100,
        ctx.state.relationships.networkCredibility + 1,
      );
    }
    return 1;
  }
  app.note = t.handset !== 'coupler' ? 'KEIN TRAEGER - KOPPLER?' : 'KEIN TRAEGER (NO CARRIER)';
  return 0;
}

function logoff(ctx: Ctx, app: ModkState): void {
  const t = ctx.state.telecom;
  t.connectedSystemId = null;
  t.currentUserHandle = null;
  if (t.call?.kind === 'carrier') t.call.kind = 'dead';
  app.screen = 'menu';
  app.note = 'VERBINDUNG BEENDET';
  ctx.say(
    'Die Gegenstelle legt auf. Aus dem Koppler tutet nur noch das Besetztzeichen – du solltest auflegen.',
  );
  const read = ctx.state.telecom.messageReadIds;
  const story = MAILBOXES.secret.boards[0].messages.filter((m) => !m.when);
  if (story.every((m) => read.includes(m.id))) setPuzzle(ctx, 'P06', 'solved');
}

/** Rundschreiben mit dem eingegebenen Schlüssel gelesen: Klartext erkannt oder weiter Salat */
function readWithKey(ctx: Ctx, app: ModkState): void {
  if (!app.key) return;
  const s = ctx.state;
  if (app.key === FULL_KEY) {
    if (s.knownFacts.includes('k01_decrypted')) return;
    ctx.say(
      'Die Buchstaben ordnen sich. Zwischen den X stehen Wörter – echte Wörter. »OPERATION REWIND BEGINNT FREITAG.« Freitag, das ist in ein paar Tagen. REWIND, zurückspulen. Klingt nach ›Zurück in die Zukunft‹, nur dass hier keiner lacht.',
      'thought',
    );
    discoverFact(ctx, 'k01_decrypted');
    discoverFact(ctx, 'cipher_method');
    setPuzzle(ctx, 'P09', 'solved');
    return;
  }
  const plain = decrypt(K01_CIPHERTEXT, app.key);
  const right = [...plain].filter((c, i) => c === decrypt(K01_CIPHERTEXT, FULL_KEY)[i]).length;
  ctx.say(
    right > plain.length / 3
      ? 'Stellenweise sieht das fast nach Wörtern aus – aber nur stellenweise. Irgendwelche Ziffern stimmen noch nicht.'
      : 'Immer noch Buchstabensalat. Der Schlüssel stimmt so nicht.',
    'thought',
  );
}

/** Rohdaten des Rundschreibens als sequenzielle Datei auf die Diskette im Laufwerk schreiben */
function saveRaw(ctx: Ctx, app: ModkState): number {
  const disk = diskInDrive(ctx.state);
  const name = GAME_CONFIG.keyStrand.rawFileName;
  ctx.cue('drive');
  if (!disk) {
    app.note = 'KEINE DISKETTE IN LAUFWERK 8';
    return 0;
  }
  if (disk.writeProtected) {
    app.note = 'SCHREIBSCHUTZ - ANDERE DISK!';
    return 0;
  }
  if (disk.files.some((f) => f.name === name)) {
    app.note = `${name} EXISTIERT BEREITS`;
    return 0;
  }
  const data = groups(K01_CIPHERTEXT).join('\r') + '\r';
  disk.files.push({ name, type: 'SEQ', blocks: 1, textContent: data });
  app.note = `GESPEICHERT: ${name} (SEQ)`;
  if (!ctx.state.flags.rawSaved) {
    ctx.state.flags.rawSaved = true;
    ctx.say(
      `Die Rohdaten liegen jetzt als Datei ${name} auf der Diskette. Ein eigenes BASIC-Programm könnte sie mit OPEN und INPUT# lesen – und rechnen.`,
      'thought',
    );
  }
  return 1;
}

export const modkApp: AppDef<ModkState> = {
  id: 'modk',
  tickMs: null,
  start() {
    return { id: 'modk', screen: 'insert', note: null, msg: 0 };
  },
  key(ctx, app, key) {
    const k = key.toUpperCase();
    const online = ctx.state.telecom.connectedSystemId !== null;
    if (!online && ONLINE_SCREENS.includes(app.screen)) {
      // Gegenstelle hat getrennt (z. B. Sperre); der Bildschirm zeigt bereits das Menü –
      // die Taste gilt also schon dem Menü.
      app.screen = 'menu';
    }
    switch (app.screen) {
      case 'insert':
        if (k === 'RETURN') {
          const inDrive = Object.entries(ctx.state.itemLocations).find(([, l]) => l === 'drive')?.[0];
          if (inDrive === 'disk_key') {
            // Seidels Original: Schlüssel und Wahldaten kommen von der Diskette.
            ctx.cue('drive');
            app.full = true;
            app.key = FULL_KEY;
            app.screen = 'menu';
            app.note = 'SCHLUESSEL GELADEN - VOLLBETRIEB';
            return { minutes: 1 };
          }
          app.screen = 'nokey';
          if (!ctx.state.knownFacts.includes('needs_disk2')) {
            ctx.say(
              'Diskette 2? Ralf hat dir nur eine gegeben. Auf dem Etikett stand ja »DISK 1« …',
              'thought',
            );
            discoverFact(ctx, 'needs_disk2');
          }
        } else if (k === 'RUNSTOP') return { exit: true };
        return {};
      case 'nokey':
        if (k === 'J') app.screen = 'menu';
        else if (k === 'N') app.screen = 'insert';
        else if (k === 'RUNSTOP') return { exit: true };
        return {};
      case 'menu':
        app.note = null;
        if (k === '1') {
          app.screen = 'dial';
          if (!ctx.state.knownFacts.includes('loader_hint')) {
            discoverFact(ctx, 'loader_hint');
            setPuzzle(ctx, 'P04', 'discovered');
            setPuzzle(ctx, 'P05', 'discovered');
          }
        } else if (k === '2') {
          app.screen = 'status';
          discoverFact(ctx, 'test_handle');
        } else if (k === '3' && app.full) {
          app.note = 'SCHLUESSEL VON DISK 2';
        } else if (k === '3') {
          app.screen = 'key';
          app.keyInput = '';
        } else if (k === '4' || k === 'RUNSTOP') return { exit: true };
        return {};
      case 'key': {
        const input = app.keyInput ?? '';
        if (/^\d$/.test(k) && input.length < KEY_LENGTH) app.keyInput = input + k;
        else if (k === 'DEL') app.keyInput = input.slice(0, -1);
        else if (k === 'RUNSTOP') {
          app.screen = 'menu';
          app.note = null;
        } else if (k === 'RETURN') {
          if (input.length === 0) {
            app.key = undefined;
            app.note = 'SCHLUESSEL GELOESCHT';
            app.screen = 'menu';
          } else if (input.length < KEY_LENGTH) app.note = `${KEY_LENGTH} ZIFFERN NOETIG`;
          else {
            app.key = input;
            app.note = 'ERSATZSCHLUESSEL GESETZT (UNGEPRUEFT)';
            app.screen = 'menu';
          }
        }
        return {};
      }
      case 'status':
        app.screen = 'menu';
        return {};
      case 'dial':
        if (k === 'RETURN') return { minutes: tryConnect(ctx, app) };
        if (k === 'RUNSTOP') {
          app.screen = 'menu';
          app.note = null;
        }
        return {};
      case 'online':
        if (k === '1') app.screen = 'list';
        else if (k === '2' && app.key === FULL_KEY) {
          app.screen = 'send';
          app.note = null;
        } else if (k === '2') {
          app.note = 'GESPERRT: SCHLUESSEL FEHLT';
          if (!app.sendTried) {
            app.sendTried = true;
            changeRelationship(ctx, 'seidelSuspicion', GAME_CONFIG.risk.secretSendAttempt, 'Sendeversuch');
          }
        } else if (k === '3') {
          app.screen = 'sys';
          applyEffects(ctx, MAILBOXES.secret.sysinfoEffects);
        } else if (k === '4') logoff(ctx, app);
        else if (k === 'RUNSTOP') app.note = 'ERST ABMELDEN (4)';
        else return {};
        return { minutes: 1 };
      case 'list': {
        const msgs = visibleMessages(ctx.state);
        const n = parseInt(k, 10);
        if (n >= 1 && n <= msgs.length) {
          app.msg = n - 1;
          app.screen = 'read';
          const m = msgs[n - 1];
          if (!ctx.state.telecom.messageReadIds.includes(m.id)) {
            ctx.state.telecom.messageReadIds.push(m.id);
            applyEffects(ctx, m.effects);
          }
          if (m.id === K01) readWithKey(ctx, app);
          return { minutes: 1 };
        }
        if (k === 'RETURN' || k === 'RUNSTOP') app.screen = 'online';
        return {};
      }
      case 'read': {
        const m = visibleMessages(ctx.state)[app.msg];
        if (m?.id === K01 && k === 'S') return { minutes: saveRaw(ctx, app) };
        app.note = null;
        app.screen = 'list';
        return {};
      }
      case 'sys':
        app.screen = 'online';
        return {};
      case 'send': {
        const sends = availableSends(ctx.state);
        const n = parseInt(k, 10);
        if (n >= 1 && n <= sends.length) {
          const x = sends[n - 1];
          ctx.state.flags[`sent_${x.id}`] = true;
          changeRelationship(ctx, 'seidelSuspicion', GAME_CONFIG.risk.secretSend, 'Senden');
          applyEffects(ctx, x.effects);
          app.screen = 'online';
          app.note = `GESENDET AN ${x.to}`;
          ctx.say(`Du schickst als ${N.testHandle}: »${x.body}« Jetzt gibt es kein Zurück.`, 'thought');
          return { minutes: 2 };
        }
        if (k === 'RETURN' || k === 'RUNSTOP') app.screen = 'online';
        return {};
      }
    }
    return {};
  },
  inputMode: () => 'keys',
  render(state, app) {
    const L: string[] = [];
    const head = `** ${N.moduleName} ** V0.7`;
    const colors: Record<number, number> = { 0: 1 };
    // Hat die Gegenstelle getrennt, zeigt das Modul sofort wieder sein Menü.
    const dropped = !state.telecom.connectedSystemId && ONLINE_SCREENS.includes(app.screen);
    const screen = dropped ? 'menu' : app.screen;
    const note = dropped ? 'NO CARRIER' : app.note;
    switch (screen) {
      case 'insert':
        L.push(head, '', 'SCHLUESSELDISKETTE (2)', 'IN LAUFWERK 8 EINLEGEN.', '', 'WEITER: RETURN');
        break;
      case 'nokey':
        L.push(head, '', '?SCHLUESSEL NICHT GEFUNDEN', '', 'EINGESCHRAENKTER BETRIEB?', '', '(J/N)');
        colors[2] = 2;
        break;
      case 'menu':
        L.push(
          head,
          app.full ? 'VOLLBETRIEB' : 'EINGESCHRAENKTER BETRIEB',
          `KENNUNG: ${N.testHandle}`,
          '',
          ' 1  VERBINDUNG HERSTELLEN',
          ' 2  KENNUNG / STATUS',
          app.full ? ' 3  SCHLUESSEL: DISK 2' : ' 3  ERSATZSCHLUESSEL EINGEBEN',
          ' 4  ENDE',
        );
        if (app.key && !app.full) L.splice(3, 0, 'ERSATZSCHLUESSEL: GESETZT');
        break;
      case 'key': {
        const input = app.keyInput ?? '';
        L.push(
          head,
          '',
          'OHNE DISK 2: ERSATZSCHLUESSEL',
          `(${KEY_LENGTH} ZIFFERN, WIRD NICHT GEPRUEFT)`,
          '',
          `> ${input}${'.'.repeat(KEY_LENGTH - input.length)}`,
          '',
          'DEL = LOESCHEN   RETURN = UEBERNEHMEN',
          'RUN/STOP = ZURUECK',
        );
        break;
      }
      case 'status':
        L.push(
          head,
          '',
          `KENNUNG  : ${N.testHandle}`,
          'TYP      : TESTZUGANG',
          app.full ? 'SCHLUESS.: DISK 2 (OK)' : 'SCHLUESS.: FEHLT (DISK 2)',
          app.full ? 'RECHTE   : LESEN/SENDEN' : 'RECHTE   : NUR LESEN',
          '',
          'TASTE = ZURUECK',
        );
        break;
      case 'dial':
        L.push(
          head,
          '',
          app.full ? 'WAHLDATEN: DISK 2 (GELADEN)' : 'WAHLDATEN: AUF DISK 2',
          app.full ? `NUMMER: ${N.phoneNumber}` : 'ERSATZWAHL: SIEHE LADER',
          '',
          'NUMMER AM TELEFON WAEHLEN,',
          'HOERER IN DEN KOPPLER,',
          'DANN: RETURN',
          '',
          'RUN/STOP = ZURUECK',
        );
        break;
      case 'online':
        L.push(
          `VERBUNDEN - ${MAILBOXES.secret.baud} BAUD`,
          '========================================',
          centered(`${MAILBOXES.secret.name}`),
          '========================================',
          `ANMELDUNG ${N.testHandle} ... OK`,
          app.full ? 'ZUGANG: VOLL' : 'ZUGANG: EINGESCHRAENKT',
          '',
          ' 1  NACHRICHTEN',
          ' 2  NACHRICHT SENDEN',
          ' 3  SYSTEM',
          ' 4  ABMELDEN',
        );
        colors[2] = 7;
        break;
      case 'list':
        L.push('NACHRICHTEN', '----------------------------------------');
        visibleMessages(state).forEach((m, i) => {
          const read = state.telecom.messageReadIds.includes(m.id) ? ' ' : '*';
          L.push(`${read}${i + 1} ${pad(m.from, 6)}> ${pad(m.to, 6)} ${m.subject}`.slice(0, 40));
        });
        L.push('', 'NUMMER = LESEN   RETURN = ZURUECK');
        break;
      case 'read': {
        const m = visibleMessages(state)[app.msg] ?? visibleMessages(state)[0];
        const head3 = [`VON: ${m.from}   AN: ${m.to}`, `BETR: ${m.subject}`, '-'.repeat(40)];
        if (m.id === K01 && app.key) {
          const plain = decrypt(K01_CIPHERTEXT, app.key);
          L.push(
            ...head3,
            app.full ? 'MIT SCHLUESSEL VON DISK 2:' : 'MIT ERSATZSCHLUESSEL:',
            '',
            ...groups(plain),
          );
          if (app.key === FULL_KEY) L.push('', 'KLARTEXT:', ...readable(plain));
          L.push('', 'S = ROHDATEN SPEICHERN  TASTE = ZURUECK');
        } else if (m.id === K01) L.push(...head3, ...m.body, '', 'S = ROHDATEN SPEICHERN  TASTE = ZURUECK');
        else L.push(...head3, ...m.body, '', 'TASTE = ZURUECK');
        break;
      }
      case 'send': {
        const sends = availableSends(state);
        L.push(
          'NACHRICHT SENDEN',
          '----------------------------------------',
          `ABSENDER: ${N.testHandle}`,
          '',
        );
        if (!sends.length) L.push('KEINE KURZMELDUNG VERFUEGBAR.');
        sends.forEach((x, i) => L.push(` ${i + 1}  ${x.label}`.slice(0, 40)));
        L.push('', 'NUMMER = SENDEN   RETURN = ZURUECK');
        break;
      }
      case 'sys':
        L.push('SYSTEMINFORMATION', '', ...MAILBOXES.secret.sysinfo, '', 'TASTE = ZURUECK');
        break;
    }
    if (note) {
      L.push('', note);
      colors[L.length - 1] = 2;
    }
    return { lines: L, border: 0, background: 0, text: 5, lineColors: colors, cursor: true };
  },
};
