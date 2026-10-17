import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAndMigrateStore } from '../src/store/storageMigration';
import { STORAGE_KEY_V2, LEGACY_STORAGE_KEY_V1 } from '../src/store/constants';

describe('Storage and Migration Suite', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const localStorageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = String(val);
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      }
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  it('initializes starter workspace when no storage exists', () => {
    const today = '2026-10-17';
    const store = loadAndMigrateStore(today);

    expect(store).toBeDefined();
    expect(store.version).toBe(2);
    expect(store.isStarterWorkspace).toBe(true);
    expect(store.habits.length).toBeGreaterThan(0);
    expect(store.tasks.length).toBeGreaterThan(0);
    expect(store.goals.length).toBeGreaterThan(0);
    expect(store.schedules.length).toBeGreaterThan(0);
    expect(store.notes.length).toBeGreaterThan(0);
    expect(Object.keys(store.journals).length).toBeGreaterThan(0);
    expect(mockStorage[STORAGE_KEY_V2]).toBeDefined();
  });

  it('loads valid existing v2 workspace intact', () => {
    const today = '2026-10-17';
    const existingStore = {
      version: 2,
      isStarterWorkspace: false,
      habits: [{ id: 'test-h1', title: 'Deep Work' }],
      habitEntries: {},
      tasks: [],
      schedules: [],
      goals: [],
      notes: [],
      journals: {},
      migrationLog: []
    };
    mockStorage[STORAGE_KEY_V2] = JSON.stringify(existingStore);

    const store = loadAndMigrateStore(today);
    expect(store.habits.length).toBe(1);
    expect(store.habits[0].title).toBe('Deep Work');
    expect(store.isStarterWorkspace).toBe(false);
  });

  it('migrates legacy v1 7-boolean array habits accurately', () => {
    const today = '2026-10-17';
    const legacyV1Habits = [
      {
        id: 101,
        name: 'Morning Hydration',
        target: '1L water upon waking',
        category: 'Fitness',
        history: [true, true, false, true, false, false, false]
      },
      {
        id: 102,
        name: 'Legacy Unknown',
        category: 'UnrecognizedCat',
        history: [false]
      }
    ];
    mockStorage[LEGACY_STORAGE_KEY_V1] = JSON.stringify(legacyV1Habits);

    const store = loadAndMigrateStore(today);
    expect(store.habits.length).toBe(2);
    expect(store.habits[0].id).toBe('101');
    expect(store.habits[0].title).toBe('Morning Hydration');
    expect(store.habits[0].category).toBe('Fitness');
    expect(store.habits[1].category).toBe('General'); // Fallback to General
    expect(store.isStarterWorkspace).toBe(false);
    expect(store.migrationLog.length).toBeGreaterThan(0);

    // Verify entries were converted to real date ISO keys
    const entries = store.habitEntries['101'];
    expect(entries).toBeDefined();
    expect(Object.keys(entries).length).toBe(3); // 3 true values
  });
});
