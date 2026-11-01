import { createInitialState } from '../engine/state';
import { createSaveFile, serializeSave } from '../engine/save';
import type { SlotBackend } from '../app/slotBackend';
import {
  deleteSlot,
  initStorage,
  listSlots,
  readSlot,
  resetStorage,
  storageKind,
  writeSlot,
} from '../app/storage';

/** Einfaches Speicher-Backend für Tests (mit abschaltbaren Fehlern) */
function fake(name: SlotBackend['name'], data: Record<string, string> = {}) {
  const b = {
    name,
    data,
    failGet: false,
    failPut: false,
    puts: [] as string[],
    async getAll() {
      if (b.failGet) throw new Error('kaputt');
      return { ...b.data };
    },
    async put(slot: string, value: string) {
      if (b.failPut) throw new Error('voll');
      b.puts.push(slot);
      b.data[slot] = value;
    },
    async remove(slot: string) {
      delete b.data[slot];
    },
  };
  return b;
}

const saved = (label: string, mutate?: (s: ReturnType<typeof createInitialState>) => void) => {
  const st = createInitialState();
  mutate?.(st);
  return serializeSave(createSaveFile(st, label, '2026-01-01T00:00:00Z'));
};
const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => resetStorage());

describe('Speicherung: IndexedDB mit localStorage-Rückfall', () => {
  test('Start mit IndexedDB: Slots werden gelesen, Schreiben und Löschen laufen durch', async () => {
    const idb = fake('indexeddb', { '1': saved('Alt') });
    expect(await initStorage({ idb, local: null })).toBe('indexeddb');
    expect(storageKind()).toBe('indexeddb');
    expect(readSlot('1')).toMatchObject({ ok: true });
    expect(readSlot('2')).toBeNull();
    expect(writeSlot('2', createInitialState())).toBe(true);
    // sofort synchron lesbar, im Hintergrund gespeichert
    expect(readSlot('2')).toMatchObject({ ok: true });
    await flush();
    expect(Object.keys(idb.data).sort()).toEqual(['1', '2']);
    deleteSlot('1');
    await flush();
    expect(Object.keys(idb.data)).toEqual(['2']);
    expect(listSlots().find((x) => x.slot === '1')?.file).toBeNull();
  });

  test('Alte localStorage-Spielstände werden einmalig übernommen, ohne Neueres zu überschreiben', async () => {
    const idb = fake('indexeddb', { '2': saved('Neu in IDB') });
    const local = fake('localstorage', { '1': saved('Alt 1'), '2': saved('Alt 2'), auto: saved('Auto') });
    await initStorage({ idb, local });
    expect(Object.keys(idb.data).sort()).toEqual(['1', '2', 'auto']);
    expect(JSON.parse(idb.data['2']).label).toBe('Neu in IDB');
    expect(JSON.parse(idb.data['1']).label).toBe('Alt 1');
    expect(local.data).toEqual({});
    // zweiter Start: nichts mehr zu übernehmen
    idb.puts.length = 0;
    await initStorage({ idb, local });
    expect(idb.puts).toEqual([]);
  });

  test('Ohne oder bei kaputter IndexedDB: localStorage bleibt der Speicherort', async () => {
    const local = fake('localstorage', { '3': saved('Dreier') });
    expect(await initStorage({ idb: null, local })).toBe('localstorage');
    expect(readSlot('3')).toMatchObject({ ok: true });
    writeSlot('1', createInitialState());
    await flush();
    expect(Object.keys(local.data).sort()).toEqual(['1', '3']);

    resetStorage();
    const broken = fake('indexeddb');
    broken.failGet = true;
    expect(await initStorage({ idb: broken, local })).toBe('localstorage');
  });

  test('Schreibfehler in IndexedDB: der Stand landet im Rückfall, nichts geht verloren', async () => {
    const idb = fake('indexeddb');
    const local = fake('localstorage');
    await initStorage({ idb, local });
    idb.failPut = true;
    expect(writeSlot('auto', createInitialState())).toBe(true);
    await flush();
    expect(idb.data.auto).toBeUndefined();
    expect(local.data.auto).toBeDefined();
  });

  test('Ohne jedes Backend: nur Arbeitsspeicher; Hängen der Datenbank blockiert den Start nicht', async () => {
    expect(await initStorage({ idb: null, local: null })).toBe('none');
    writeSlot('1', createInitialState());
    expect(readSlot('1')).toMatchObject({ ok: true });
    resetStorage();
    const hang: SlotBackend = {
      name: 'indexeddb',
      getAll: () => new Promise(() => undefined),
      put: async () => undefined,
      remove: async () => undefined,
    };
    const local = fake('localstorage', { '2': saved('Rückfall') });
    expect(await initStorage({ idb: hang, local, timeoutMs: 20 })).toBe('localstorage');
    expect(readSlot('2')).toMatchObject({ ok: true });
  });

  test('Defekte Daten werden als Fehler gemeldet, ohne zu stürzen', async () => {
    const idb = fake('indexeddb', { '1': '{kaputt' });
    await initStorage({ idb, local: null });
    const r = readSlot('1');
    expect(r && r.ok).toBe(false);
    expect(listSlots().find((x) => x.slot === '1')?.error).toBeTruthy();
  });
});

describe('Spielstand-Migration über alle Versionen', () => {
  test('ein Spielstand der Version 1 wird bis zur aktuellen Version gebracht und bleibt spielbar', async () => {
    const { parseSave } = await import('../engine/save');
    const { SCHEMA_VERSION } = await import('../engine/state');
    const st = structuredClone(createInitialState()) as unknown as Record<string, unknown> & {
      telecom: Record<string, unknown>;
      itemLocations: Record<string, unknown>;
    };
    // Felder entfernen, die erst spätere Versionen eingeführt haben
    delete st.telecom.bbs;
    delete st.telecom.locks;
    delete st.telecom.riskMinutes;
    delete st.telecom.costsAtLastReading;
    for (const k of ['club_letter', 'cassette', 'btx_kit']) delete st.itemLocations[k];
    st.schemaVersion = 1;
    const text = JSON.stringify({
      format: 'rewind1986-save',
      schemaVersion: 1,
      savedAt: '2026-01-01T00:00:00Z',
      label: 'alt',
      gameClock: st.gameClock,
      state: st,
    });
    const r = parseSave(text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.file.state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(r.file.state.itemLocations.btx_kit).toBe('nowhere');
    expect(r.file.state.itemLocations.cassette).toBe('nowhere');
    expect(r.file.state.telecom.locks).toEqual({});
    // eine Version aus der Zukunft wird abgelehnt statt falsch gelesen
    const future = parseSave(text.replace(/"schemaVersion":1/g, `"schemaVersion":${SCHEMA_VERSION + 5}`));
    expect(future.ok).toBe(false);
  });
});
