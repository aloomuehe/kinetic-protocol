import { describe, it, expect } from 'vitest';
import { validateBackupSchema, serializeBackup, parseAndValidateBackup } from '../src/services/backup/backupService';
import { createStarterWorkspace } from '../src/store/starterData';

describe('Backup and Serialization Suite', () => {
  const starter = createStarterWorkspace('2026-10-17');

  it('validates a complete Kinetic workspace successfully', () => {
    expect(validateBackupSchema(starter)).toBe(true);
  });

  it('rejects malformed or incomplete backup payloads', () => {
    expect(validateBackupSchema(null)).toBe(false);
    expect(validateBackupSchema({})).toBe(false);
    expect(validateBackupSchema({ habits: 'not-an-array' })).toBe(false);
    expect(validateBackupSchema({ habits: [{ title: 'Missing ID' }] })).toBe(false);
    expect(validateBackupSchema({ habits: [{ id: 123, title: 'Numeric ID' }] })).toBe(false);
  });

  it('serializes and round-trips starter workspace losslessly', () => {
    const serialized = serializeBackup(starter);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(100);

    const result = parseAndValidateBackup(serialized);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.habits.length).toBe(starter.habits.length);
    expect(result.data?.version).toBe(starter.version);
  });

  it('gracefully handles JSON syntax errors on import parse', () => {
    const corruptJson = '{"version": "2.3", "habits": [';
    const result = parseAndValidateBackup(corruptJson);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
