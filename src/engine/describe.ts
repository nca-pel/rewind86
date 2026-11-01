import { videoLines } from '../c64/video';
import { OBJECTS, OBJECT_BY_ID } from '../content/objects';
import { STATIONS } from '../content/radio';
import { diskInDrive } from '../sim/c64';
import { evalCondition, houseLineBusy } from './conditions';
import { capitalize, isReachable } from './resolve';
import type { GameState } from './types';

export function itemsAt(state: GameState, loc: string): string[] {
  return OBJECTS.filter((o) => o.portable && state.itemLocations[o.id] === loc).map((o) => o.id);
}

export function listNames(ids: string[]): string {
  const names = ids.map((id) => OBJECT_BY_ID[id].name);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
}

function monitorText(state: GameState): string {
  const c = state.computer;
  if (!c.powerOn) return 'Der Monitor ist dunkel.';
  if (c.app?.id === 'wt07') return 'Auf dem Monitor läuft das Intro der Arbeitsversion in Endlosschleife.';
  if (c.app?.id === 'modk') return 'Auf dem Monitor: die nüchterne Textseite des versteckten Moduls.';
  if (c.app?.id === 'archive') return 'Auf dem Monitor: dein Archivprogramm.';
  if (c.app?.id === 'intruder')
    return 'Auf dem Monitor tobt die INTRUDER-Demo: Rasterbalken, Sprites, Laufschrift.';
  const last = videoLines(c.screen)
    .filter((l) => l.trim())
    .slice(-3)
    .join(' / ');
  return `Auf dem Monitor der C64-Bildschirm. Zuletzt: ${last || 'READY.'}`;
}

/** Zustandsabhängiger Zusatz zur statischen Objektbeschreibung */
export function dynamicDescription(state: GameState, id: string): string {
  const t = state.telecom;
  switch (id) {
    case 'c64': {
      const slot = state.itemLocations.btx_kit === 'port' ? ' Im Modulschacht steckt das BTX-Modul.' : '';
      return (
        (state.computer.powerOn
          ? 'Er ist eingeschaltet; die rote Betriebs-LED leuchtet.'
          : 'Er ist ausgeschaltet. (SCHALTE COMPUTER EIN – Monitor und 1541 hängen an derselben Steckerleiste.)') +
        slot
      );
    }
    case 'monitor':
      return monitorText(state);
    case 'drive1541': {
      const item = itemsAt(state, 'drive')[0];
      const led = state.computer.driveOn ? 'Die grüne Betriebs-LED leuchtet.' : 'Das Laufwerk ist aus.';
      return `${led} ${item ? `Im Schacht steckt ${OBJECT_BY_ID[item].name}.` : 'Der Schacht ist leer.'}`;
    }
    case 'phone':
    case 'handset': {
      const where =
        t.handset === 'cradle'
          ? 'Der Hörer liegt auf der Gabel.'
          : t.handset === 'hand'
            ? 'Du hältst den Hörer in der Hand.'
            : 'Der Hörer steckt im Akustikkoppler.';
      const ring = t.ringing ? ' Es klingelt!' : '';
      const busy = houseLineBusy(state) ? ' Unten telefoniert gerade jemand – die Leitung ist belegt.' : '';
      return where + ring + busy;
    }
    case 'coupler':
      return state.objectStates.coupler.carrier
        ? 'Die Träger-LED leuchtet: Eine Verbindung steht.'
        : t.handset === 'coupler'
          ? 'Der Hörer steckt in den Muffen, die Träger-LED ist aus.'
          : 'Die Träger-LED ist aus.';
    case 'datasette':
      return state.itemLocations.cassette === 'datasette' ? 'Im Fach steckt Ralfs Prüfband-Kassette.' : '';
    case 'radio': {
      const st = STATIONS.find((s) => s.id === state.objectStates.radio.station);
      return state.objectStates.radio.on ? `Es läuft: ${st?.label}.` : 'Es ist ausgeschaltet.';
    }
    case 'drawer': {
      if (!state.objectStates.drawer.open) return 'Sie ist geschlossen.';
      const items = itemsAt(state, 'drawer');
      return items.length
        ? `Sie ist offen. Darin: ${listNames(items)}.`
        : 'Sie ist offen und – bis auf Kabelbinder und einen Kuli – leer.';
    }
    default:
      return '';
  }
}

export function describe(state: GameState, id: string): string {
  const o = OBJECT_BY_ID[id];
  const base = o.description.find((d) => evalCondition(state, d.when))?.text ?? '';
  const dyn = dynamicDescription(state, id);
  return [base, dyn].filter(Boolean).join(' ');
}

export function lookAround(state: GameState): string {
  const parts = [describe(state, 'desk')];
  const onDesk = itemsAt(state, 'desk');
  if (onDesk.length)
    parts.push(`Auf dem Tisch ${onDesk.length > 1 ? 'liegen' : 'liegt'} außerdem ${listNames(onDesk)}.`);
  const inDrive = itemsAt(state, 'drive');
  if (inDrive.length) parts.push(`In der 1541 steckt ${OBJECT_BY_ID[inDrive[0]].name}.`);
  if (state.objectStates.drawer.open)
    parts.push(
      capitalize(dynamicDescription(state, 'drawer')).replace(/^Sie ist offen\./, 'Die Schublade ist offen.'),
    );
  parts.push(monitorText(state));
  if (state.telecom.ringing) parts.push('Das Telefon klingelt!');
  return parts.join(' ');
}

export function inventoryText(state: GameState): string {
  const inv = itemsAt(state, 'inventory');
  if (inv.length === 0) return 'Du hast nichts in der Hand.';
  return `Du hast: ${listNames(inv)}.`;
}

export function visibleObjectIds(state: GameState): string[] {
  return OBJECTS.filter((o) => !o.npc && isReachable(state, o.id)).map((o) => o.id);
}

export function diskLabelInDrive(state: GameState): string | null {
  return diskInDrive(state)?.header ?? null;
}
