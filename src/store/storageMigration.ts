import type { KineticStore, Habit, HabitEntry } from './types';
import { STORAGE_KEY_V2, LEGACY_STORAGE_KEY_V1, CATEGORIES } from './constants';
import { createStarterWorkspace } from './starterData';
import { getWeekDatesISO } from '../utils/dates';

export function loadAndMigrateStore(todayISO: string): KineticStore {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.habits)) {
        return parsed as KineticStore;
      }
    }

    // Check for legacy v1 7-boolean habit array and migrate cleanly
    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (rawV1) {
      const legacyHabits = JSON.parse(rawV1);
      if (Array.isArray(legacyHabits) && legacyHabits.length > 0) {
        const base = createStarterWorkspace(todayISO);
        const weekDates = getWeekDatesISO(todayISO, true);
        const migratedHabits: Habit[] = [];
        const migratedEntries: Record<string, Record<string, HabitEntry>> = {};

        legacyHabits.forEach((lh: any, idx: number) => {
          const hid = lh.id ? String(lh.id) : `mig-hab-${idx}`;
          migratedHabits.push({
            id: hid,
            title: lh.name || 'Migrated Habit',
            description: lh.target || 'Migrated from Kinetic v1',
            category: CATEGORIES[lh.category] ? lh.category : 'General',
            trackingType: 'binary',
            targetValue: 1,
            minViableValue: 1,
            unit: 'check-in',
            schedule: { type: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: 7 },
            startDate: weekDates[0],
            archivedAt: null
          });
          migratedEntries[hid] = {};
          if (Array.isArray(lh.history)) {
            lh.history.slice(0, 7).forEach((done: boolean, dayIdx: number) => {
              const targetDate = weekDates[dayIdx];
              if (done && targetDate && targetDate <= todayISO) {
                migratedEntries[hid][targetDate] = {
                  id: `mig-${hid}-${targetDate}`,
                  habitId: hid,
                  date: targetDate,
                  value: 1,
                  status: 'completed',
                  note: 'Migrated from v1 7-day array',
                  updatedAt: new Date().toISOString()
                };
              }
            });
          }
        });

        const migratedStore: KineticStore = {
          ...base,
          isStarterWorkspace: false,
          habits: migratedHabits,
          habitEntries: migratedEntries,
          migrationLog: [
            `Migrated ${migratedHabits.length} habits from legacy v1 format on ${todayISO}. Fabricated v1 bestStreak counters were discarded in favor of verified dated entries.`
          ]
        };
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migratedStore));
        return migratedStore;
      }
    }
  } catch (err) {
    console.error('Storage initialization recovery triggered:', err);
  }

  const starter = createStarterWorkspace(todayISO);
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(starter));
  } catch {
    // Ignore storage quota errors on boot
  }
  return starter;
}
