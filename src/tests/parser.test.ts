import { parseAdventure, splitCommands } from '../parser/adventure';
import { normalize } from '../parser/normalize';
import { Session } from './helpers';

/** Sitzung, in der Ralf die Diskette bereits gebracht hat */
function afterDelivery(): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('lege auf');
  s.a('warte 20');
  expect(s.state.itemLocations.disk_game).toBe('inventory');
  return s;
}

describe('Normalisierung', () => {
  test('Umlaute, Großschreibung, Satzzeichen', () => {
    expect(normalize('ÖFFNE die Schublade!')).toBe('oeffne die schublade');
    expect(normalize('Hebe den Hörer ab.')).toBe('hebe den hoerer ab');
    expect(normalize('Straße')).toBe('strasse');
  });
  test('Mehrere Befehle in einer Zeile', () => {
    expect(splitCommands('öffne schublade. nimm diskette dann schau dich um')).toEqual([
      'öffne schublade',
      'nimm diskette',
      'schau dich um',
    ]);
    expect(splitCommands('TIPPE PRINT 1.5')).toEqual(['TIPPE PRINT 1.5']);
  });
});

describe('Intent-Erkennung', () => {
  test('Verb-Synonyme und abtrennbare Partikel', () => {
    expect(parseAdventure('UNTERSUCHE RADIO')).toMatchObject({ kind: 'verb', verb: 'examine' });
    expect(parseAdventure('SCHAU DIR DAS RADIO AN')).toMatchObject({
      kind: 'verb',
      verb: 'examine',
      segments: [{ words: ['radio'] }],
    });
    expect(parseAdventure('SCHALTE RADIO EIN')).toMatchObject({ verb: 'turnOn' });
    expect(parseAdventure('schalte das radio aus')).toMatchObject({ verb: 'turnOff' });
    expect(parseAdventure('HEB DIE DISKETTE AUF')).toMatchObject({
      verb: 'take',
      segments: [{ words: ['diskette'] }],
    });
    expect(parseAdventure('HEBE HÖRER AB')).toMatchObject({ verb: 'pickup' });
    expect(parseAdventure('LEGE AUF')).toMatchObject({ verb: 'hangup' });
    expect(parseAdventure('LEGE DISKETTE INS LAUFWERK')).toMatchObject({
      verb: 'place',
      segments: [
        { prep: null, words: ['diskette'] },
        { prep: 'ins', words: ['laufwerk'] },
      ],
    });
    expect(parseAdventure('RUFE RALF AN')).toMatchObject({ verb: 'call' });
    expect(parseAdventure('WÄHLE 4 19 73')).toMatchObject({ kind: 'dial', number: '41973' });
  });
  test('Dialogbefehle', () => {
    expect(parseAdventure('FRAGE RALF NACH SEIDEL')).toMatchObject({
      verb: 'ask',
      segments: [{ words: ['ralf'] }, { prep: 'nach', words: ['seidel'] }],
    });
    expect(parseAdventure('REDE MIT RALF ÜBER SEIDEL')).toMatchObject({ verb: 'talk' });
    expect(parseAdventure('ERZÄHLE RALF VON DER MAILBOX')).toMatchObject({ verb: 'tell' });
  });
  test('Meta-Befehle', () => {
    expect(parseAdventure('HILFE')).toMatchObject({ kind: 'meta', meta: 'help' });
    expect(parseAdventure('i')).toMatchObject({ meta: 'inventory' });
    expect(parseAdventure('DENKE NACH')).toMatchObject({ meta: 'think' });
    expect(parseAdventure('WARTE 2 STUNDEN')).toMatchObject({ meta: 'wait', minutes: 120 });
    expect(parseAdventure('warte zehn minuten')).toMatchObject({ meta: 'wait', minutes: 10 });
    expect(parseAdventure('SPEICHERN 2')).toMatchObject({ meta: 'save', arg: '2' });
    expect(parseAdventure('LADEN')).toMatchObject({ meta: 'load' });
    expect(parseAdventure('LADE SPIEL')).toMatchObject({ meta: 'c64hint' });
  });
  test('Tippfehler im Verb werden nur bei eindeutigem Treffer korrigiert', () => {
    expect(parseAdventure('untersuhce radio')).toMatchObject({ kind: 'verb', verb: 'examine' });
    expect(parseAdventure('xyzzy')).toMatchObject({ kind: 'bare' });
  });
});

describe('Parser-Szenarien (GDD §19.1)', () => {
  test('NIMM DISKETTE legt die Diskette ins Inventar', () => {
    const s = afterDelivery();
    s.a('lege diskette auf den tisch');
    expect(s.state.itemLocations.disk_game).toBe('desk');
    s.a('NIMM DISKETTE');
    expect(s.state.itemLocations.disk_game).toBe('inventory');
  });

  test('HEB DIE DISKETTE AUF verhält sich gleich', () => {
    const s = afterDelivery();
    s.a('lege diskette auf den tisch');
    s.a('HEB DIE DISKETTE AUF');
    expect(s.state.itemLocations.disk_game).toBe('inventory');
  });

  test('Mehrere erreichbare Disketten → eindeutige Rückfrage, Antwort löst auf', () => {
    const s = new Session();
    s.a('öffne schublade');
    const out = s.a('NIMM DISKETTE');
    expect(out).toMatch(/Welche Diskette meinst du: .*1001.* oder .*Archivdiskette/);
    expect(s.state.itemLocations.disk_1001).toBe('drawer');
    s.a('die 1001');
    expect(s.state.itemLocations.disk_1001).toBe('inventory');
    expect(s.state.itemLocations.disk_archive).toBe('drawer');
  });

  test('UNTERSUCHE PAKET, dann ÖFFNE ES öffnet das Paket (Pronomen)', () => {
    const s = new Session();
    s.state.objectStates.package.open = false; // Spielstand von vor der Änderung: noch zugeklebt
    s.a('UNTERSUCHE PAKET');
    const out = s.a('ÖFFNE ES');
    expect(s.state.objectStates.package.open).toBe(true);
    expect(out).toMatch(/Päckchen/);
  });

  test('Unerreichbare oder unbekannte Dinge: keine erfundene Aktion', () => {
    const s = new Session();
    const before = structuredClone(s.state.itemLocations);
    expect(s.a('NIMM DISKETTE 1001')).toMatch(/Schublade – und die ist zu/);
    expect(s.a('NIMM DISKETTE 2')).toMatch(/Diskette 2 hast du nicht/);
    expect(s.a('NIMM DEN TOASTER')).toMatch(/kenne ich hier nicht/);
    expect(s.state.itemLocations).toEqual(before);
  });

  test('Tippfehler im Objekt werden toleriert', () => {
    const s = new Session();
    s.a('öffne schubalde');
    expect(s.state.objectStates.drawer.open).toBe(true);
  });

  test('THEMEN zeigt nur bekannte Themen, versteckte sind trotzdem eingebbar', () => {
    const s = new Session();
    s.a('nimm hörer');
    const themes = s.a('THEMEN');
    expect(themes).not.toMatch(/Seidels Arbeit/);
    expect(s.a('frage ralf nach seiner arbeit')).toMatch(/Gütersloh/);
    expect(s.a('THEMEN')).toMatch(/Seidels Arbeit/);
  });

  test('„Vater" im Gespräch mit Ralf meint Ralfs Stiefvater, nicht Jans Vater', () => {
    const s = new Session();
    s.a('nimm hörer');
    expect(s.a('frage ralf nach seinem vater')).toMatch(/kein Wort zu ihm/);
  });
});

describe('Historische Schranken (GDD §19.3)', () => {
  test('GOOGLE SUCHEN öffnet keinen modernen Dienst', () => {
    const s = new Session();
    const out = s.a('GOOGLE SUCHEN');
    expect(out).toMatch(/1986/);
    expect(s.state.flags).toEqual(new Session().state.flags);
  });
  test('Smartphone gibt es nicht', () => {
    expect(new Session().a('nimm handy')).toMatch(/1986/);
  });
});
