import { GAME_CONFIG } from '../content/config';
import { milestoneState } from '../engine/dev';
import { step } from '../engine/engine';
import { isSchoolDay, nextRalfHome, ralfWhere, wakeTime } from '../engine/routine';
import { createSaveFile, parseSave } from '../engine/save';
import { createInitialState } from '../engine/state';
import { Session } from './helpers';

const RALF = GAME_CONFIG.ralf.phoneNumber;

function zeit(s: Session, to: string): string {
  return s
    .do({ type: 'dev', text: `zeit ${to}` })
    .map((l) => l.text)
    .join('\n');
}

/** Ende des Ausschnitts (Fr. 16:45): Diskette 2 fehlt, Ralf war da */
function afterSlice(): Session {
  const s = new Session(false);
  s.state = milestoneState('end', step)!;
  return s;
}

const text = (s: Session) => s.log.map((l) => l.text).join('\n');

describe('Kalender (GDD §10.2)', () => {
  test('Schultage, Buß- und Bettag, Weckzeiten', () => {
    expect(isSchoolDay('1986-11-14T12:00')).toBe(true);
    expect(isSchoolDay('1986-11-15T12:00')).toBe(true); // Samstagsunterricht
    expect(isSchoolDay('1986-11-16T12:00')).toBe(false);
    expect(isSchoolDay('1986-11-17T12:00')).toBe(true);
    expect(isSchoolDay('1986-11-19T12:00')).toBe(false);
    expect(wakeTime('1986-11-14T23:00')).toBe('1986-11-15T06:45');
    expect(wakeTime('1986-11-15T01:00')).toBe('1986-11-15T06:45');
    expect(wakeTime('1986-11-15T23:00')).toBe('1986-11-16T09:30');
    expect(wakeTime('1986-11-16T22:00')).toBe('1986-11-17T06:45');
    expect(wakeTime('1986-11-18T22:00')).toBe('1986-11-19T09:30');
  });

  test('Ralfs Wochenplan', () => {
    expect(ralfWhere('1986-11-17T10:00')).toBe('school');
    expect(ralfWhere('1986-11-18T17:30')).toBe('training');
    expect(ralfWhere('1986-11-18T20:00')).toBe('home');
    expect(ralfWhere('1986-11-15T10:00')).toBe('school');
    expect(ralfWhere('1986-11-15T13:00')).toBe('home');
    expect(ralfWhere('1986-11-15T15:00')).toBe('match');
    expect(ralfWhere('1986-11-16T13:00')).toBe('out');
    expect(ralfWhere('1986-11-15T22:00')).toBe('late');
    expect(ralfWhere('1986-11-19T10:30')).toBe('home'); // schulfrei
    expect(nextRalfHome('1986-11-18T17:30')).toBe('1986-11-18T18:45');
  });
});

describe('Tagesablauf im Spiel (Ausbauplan Punkt 5)', () => {
  test('SCHLAFE erst abends; der nächste Morgen beginnt je nach Tag', () => {
    const s = afterSlice();
    expect(s.a('schlafe')).toMatch(/Niemals/);
    zeit(s, '22:00');
    const out = s.a('schlafe');
    expect(out).toMatch(/Licht aus/);
    expect(out).toMatch(/Samstag, 15\.11\.1986, 06:45/);
    expect(out).toMatch(/Schule/);
    expect(s.state.gameClock).toBe('1986-11-15T06:45');
    expect(s.state.flags.away).toBeUndefined();
  });

  test('Wer nicht schlafen geht, schläft um 01:30 am Schreibtisch ein', () => {
    const s = afterSlice();
    zeit(s, '23:50');
    s.a('warte 120');
    expect(text(s)).toMatch(/Dir fallen die Augen zu/);
    expect(s.state.gameClock).toBe('1986-11-15T06:45');
  });

  test('Samstag: Schule bis mittags, Post vom Computerclub, Taschengeld, Ralf ruft an', () => {
    const s = afterSlice();
    zeit(s, '22:00');
    s.a('schlafe');
    const money = s.state.moneyDm;
    const school = s.a('warte 60');
    expect(school).toMatch(/Samstag – und trotzdem Schule/);
    expect(school).toMatch(/Brief auf deinen Schreibtisch/); // Post kam während der Schule
    expect(s.state.gameClock).toBe('1986-11-15T12:00');
    expect(s.state.itemLocations.club_letter).toBe('desk');
    expect(s.a('lies rundbrief')).toMatch(/Clubabend am Donnerstag/);
    expect(s.has('club_evening')).toBe(true);
    s.a('warte 30');
    expect(s.state.moneyDm).toBe(money + GAME_CONFIG.household.pocketMoneyDm);

    expect(s.a('warte 60')).toMatch(/Telefon .* klingelt/);
    expect(s.state.gameClock).toBe('1986-11-15T13:00');
    expect(s.a('nimm hörer')).toMatch(/Was ist auf der Diskette/);
    expect(s.a('frage ralf nach dem spiel')).toMatch(/Wirtschaftssimulation/);

    // Vom versteckten Modus erzählen: Vertrauen steigt – aber auch das Risiko
    const trust = s.state.relationships.ralfTrust;
    const susp = s.state.relationships.seidelSuspicion;
    expect(s.a('frage ralf nach dem versteckten modus')).toMatch(/Echt jetzt/);
    expect(s.state.relationships.ralfTrust).toBe(trust + 5);
    expect(s.state.relationships.seidelSuspicion).toBe(susp + 8);
    expect(s.has('ralf_knows_module')).toBe(true);
    expect(s.a('lege auf')).toMatch(/Bis dann/);
  });

  test('Ralf nicht zu Hause → Rückruf, sobald er wieder da ist', () => {
    const s = afterSlice();
    zeit(s, '1986-11-18T17:00');
    expect(s.state.gameClock).toBe('1986-11-18T17:00');
    expect(s.a(`wähle ${RALF}`)).toMatch(/beim Training/);
    s.a('lege auf');
    expect(s.state.flags.ralfCallbackPending).toBe(true);
    s.a('warte 120'); // Abendbrot 18:50 unterbricht
    s.a('warte 60');
    expect(s.state.telecom.ringing).toBe('ralf');
    expect(s.a('nimm hörer')).toMatch(/du hättest angerufen/);
    s.a('lege auf');
    // Abends geht Seidel ans Telefon
    expect(s.a(`wähle ${RALF}`)).toMatch(/Seidel\.« Eine ruhige Männerstimme/);
    s.a('lege auf');
    zeit(s, '21:45');
    expect(s.a(`wähle ${RALF}`)).toMatch(/wie spät es ist/);
  });

  test('Schultag: Zeitblock bis mittags, Post wartet auf dem Tisch', () => {
    const s = afterSlice();
    zeit(s, '1986-11-16T22:00');
    expect(s.a('schlafe')).toMatch(/Montag, 17\.11\.1986, 06:45/);
    const out = s.a('warte 60');
    expect(out).toMatch(/Montag\. Ab ins Ratsgymnasium/);
    expect(out).toMatch(/wieder zu Hause/);
    expect(s.state.gameClock).toBe('1986-11-17T13:30');
  });

  test('Abendbrot: Zeitblock – oder ausgelassen, wenn Jan online ist', () => {
    const s = afterSlice();
    zeit(s, '18:45');
    s.a('warte 10');
    expect(text(s)).toMatch(/Abendbrot/);
    expect(s.state.gameClock).toBe('1986-11-14T19:15');
    expect(s.state.flags.missedDinner).toBeUndefined();
  });

  test('Sonntag: Der Vater liest den Gebührenzähler ab', () => {
    const s = afterSlice();
    zeit(s, '1986-11-16T18:00');
    s.state.phoneCostsDm = s.state.telecom.costsAtLastReading + 12;
    s.state.moneyDm = 5;
    s.a('warte 60');
    expect(text(s)).toMatch(/Das ist kein Spaß mehr/);
    expect(s.state.moneyDm).toBe(0);
    expect(s.state.flags.phoneDebtDm).toBe(4); // 12 − 3 frei − 5 bezahlt
    expect(s.state.flags.fatherAngryPhone).toBe(true);
    // Nächster Samstag: Schulden werden vom Taschengeld abgezogen
    zeit(s, '1986-11-22T13:00');
    expect(s.state.moneyDm).toBe(GAME_CONFIG.household.pocketMoneyDm - 4);
    expect(s.state.flags.phoneDebtDm).toBeUndefined();
  });

  test('Clubabend am Donnerstag als Zeitblock', () => {
    const s = afterSlice();
    s.do({ type: 'dev', text: 'fakt club_evening' });
    expect(s.a('gehe zum club')).toMatch(/Donnerstag um 19 Uhr/);
    zeit(s, '1986-11-20T18:20');
    expect(s.a('warte 15')).toMatch(/Computerclub/);
    const out = s.a('gehe zum club');
    expect(out).toMatch(/Jugendzentrum/);
    expect(s.state.gameClock).toBe('1986-11-20T21:45');
  });

  test('Meilenstein »Samstagmorgen« aus echten Spielbefehlen', () => {
    const s = milestoneState('saturday', step)!;
    expect(s.gameClock).toBe('1986-11-15T06:45');
    expect(s.flags.sliceEnded).toBe(true);
  });

  test('Spielstände aus Schema 4 bekommen den Tagesablauf', () => {
    const st = createInitialState();
    const old = structuredClone(st) as unknown as Record<string, unknown>;
    delete (old.telecom as Record<string, unknown>).costsAtLastReading;
    delete (old.itemLocations as Record<string, unknown>).club_letter;
    old.scheduledEvents = (old.scheduledEvents as Array<{ id: string }>).filter(
      (e) => !['ev_school', 'ev_dinner'].includes(e.id),
    );
    const r = parseSave(
      JSON.stringify({
        ...createSaveFile(st, 't', '2026-01-01T00:00'),
        schemaVersion: 4,
        state: { ...old, schemaVersion: 4 },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.file.state.telecom.costsAtLastReading).toBe(0);
      expect(r.file.state.itemLocations.club_letter).toBe('nowhere');
      const ids = r.file.state.scheduledEvents.filter((e) => e.status === 'pending').map((e) => e.id);
      expect(ids).toEqual(expect.arrayContaining(['ev_school', 'ev_dinner', 'ev_forced_sleep']));
    }
  });
});
