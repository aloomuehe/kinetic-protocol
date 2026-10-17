import { describe, it, expect } from 'vitest';
import { computeTelemetryAnalytics } from '../src/features/statistics/analytics';
import { createStarterWorkspace } from '../src/store/starterData';

describe('Telemetry & Analytics Suite', () => {
  const today = '2026-10-17';
  const starter = createStarterWorkspace(today);

  it('computes daily telemetry breakdown correctly (7 trailing days)', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'daily');
    expect(result).toBeDefined();
    expect(result.points.length).toBe(7);
    expect(result.points[6].isCurrent).toBe(true);
    expect(result.allocationRows.length).toBeGreaterThan(0);
  });

  it('computes weekly telemetry points correctly (6 trailing weeks)', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'weekly');
    expect(result.points.length).toBe(6);
    const currentWeekPoint = result.points.find((p) => p.isCurrent);
    expect(currentWeekPoint).toBeDefined();
  });

  it('computes monthly telemetry points correctly (6 trailing months)', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'monthly');
    expect(result.points.length).toBe(6);
    const currentMonthPoint = result.points.find((p) => p.isCurrent);
    expect(currentMonthPoint).toBeDefined();
  });

  it('derives category allocation breakdown with non-negative percentages', () => {
    const result = computeTelemetryAnalytics(starter, today, today, 'weekly');
    expect(Array.isArray(result.allocationRows)).toBe(true);
    let sumPct = 0;
    for (const cat of result.allocationRows) {
      expect(cat.pct).toBeGreaterThanOrEqual(0);
      expect(cat.pct).toBeLessThanOrEqual(100);
      sumPct += cat.pct;
    }
    if (result.allocationRows.length > 0) {
      expect(Math.round(sumPct)).toBe(100);
    }
  });
});
