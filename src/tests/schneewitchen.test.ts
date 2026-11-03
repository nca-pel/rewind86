import { Session } from './helpers';

function start(): Session {
  const s = new Session();
  s.a('nimm hörer');
  s.a('lege auf');
  return s;
}

function withDisk(): Session {
  const s = start();
  s.a('hebe das magazin hoch');
  s.a('nimm schneewitchen');
  s.a('lege schneewitchen ins laufwerk');
  s.a('schalte computer ein');
  return s;
}

describe('Gimmick: Diskette Schneewitchen', () => {
  test('Verstecktes Hochheben des Magazins lässt die Diskette auf den Tisch fallen (nur einmal)', () => {
    const s = start();
    expect(s.state.itemLocations.disk_sw).toBe('nowhere');
    const out = s.a('hebe das magazin hoch');
    expect(out).toMatch(/Schneewitchen/);
    expect(s.state.itemLocations.disk_sw).toBe('desk');
    expect(s.has('disk_sw')).toBe(true);
    expect(s.a('hebe die zeitschrift an')).toMatch(/nichts mehr/);
    expect(s.state.itemLocations.disk_sw).toBe('desk');
  });

  test('Der Befehl steht in keiner Hilfe oder Erklärung', () => {
    const s = start();
    expect(s.a('hilfe')).not.toMatch(/hochheb|hebe/i);
  });

  test('Directory zeigt vier Bilddateien mit Koala-Endung', () => {
    const s = withDisk();
    s.c('LOAD"$",8');
    s.c('LIST');
    const scr = s.screen();
    // Der C64 zeigt das Unterstrich-Zeichen (PETSCII 95) als Pfeil nach links
    for (const n of ['SW←ZW1.KOA', 'SW←ZW2.KOA', 'SW←ZW3.KOA', 'GRUPPE.KOA']) expect(scr).toContain(n);
    expect(scr).toContain('SCHNEEWITCHEN');
  });

  test.each(['SW_ZW1.KOA', 'SW_ZW2.KOA', 'SW_ZW3.KOA', 'GRUPPE.KOA'])(
    '%s lässt sich nie laden: Absturz, Reset, jedes Mal',
    (name) => {
      const s = withDisk();
      for (let round = 1; round <= 2; round++) {
        s.c('10 PRINT "NOCH DA"');
        s.c(`LOAD"${name}",8,1`);
        expect(s.state.computer.app?.id).toBe('crash');
        s.key('RUNSTOP');
        expect(s.state.computer.app?.id).toBe('crash');
        s.tick(40);
        expect(s.state.computer.app).toBeNull();
        expect(s.screen()).toMatch(/COMMODORE 64/);
        expect(s.state.computer.program).toHaveLength(0);
        expect(s.state.flags.swCrashes).toBe(round);
      }
    },
  );

  test('Auch LOAD mit Platzhalter und ohne ,1 stürzt ab', () => {
    const s = withDisk();
    s.c('LOAD"SW_ZW*",8');
    expect(s.state.computer.app?.id).toBe('crash');
    s.tick(40);
    s.c('LOAD"GRUPPE.KOA",8');
    expect(s.state.computer.app?.id).toBe('crash');
  });
});
