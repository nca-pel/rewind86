/**
 * Endgültige Spielenden (GDD §10.3: wenige, vorher erkennbar angekündigt).
 * Der Spielstand mit gesetztem Ende wird nicht automatisch gespeichert – der Autosave bleibt auf dem
 * Stand vor der letzten Handlung, sodass „Letzten Schritt zurücknehmen“ immer möglich ist.
 */
import { GAME_CONFIG } from './config';

const N = GAME_CONFIG.secretNetwork;

export interface EndingDef {
  id: string;
  title: string;
  text: string;
}

export const ENDINGS: EndingDef[] = [
  {
    id: 'end_discovered',
    title: 'Entdeckt',
    // Entschieden (Storyworkshop): Seidel kommt persönlich – freundlich, manipulativ, ohne Gewalt.
    text: `Am nächsten Nachmittag klingelt es. Deine Mutter ruft die Treppe hinauf: »Jan, Besuch für dich – Herr Seidel, Ralfs Vater!« Er bleibt im Türrahmen stehen, freundlich, das Jackett ordentlich zugeknöpft. »Ich wollte nur kurz über Ralf reden. Er ist in letzter Zeit so … abgelenkt.« Sein Blick wandert über deinen Schreibtisch und bleibt am Akustikkoppler hängen. »${N.testHandle}«, sagt er leise, als läse er eine Telefonnummer vor. »Ein Testzugang. Die werden gelöscht, weißt du? Alle.« Dann lächelt er, wünscht deiner Mutter einen schönen Abend und geht. Am Abend ist die Nummer tot. Das Netz ist für dich verloren – und Seidel weiß, wer du bist.`,
  },
];

export const ENDING_BY_ID: Record<string, EndingDef> = Object.fromEntries(ENDINGS.map((e) => [e.id, e]));
