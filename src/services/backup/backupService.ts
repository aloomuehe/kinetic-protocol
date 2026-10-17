import type { KineticStore } from '../../store/types';

export function validateBackupSchema(data: any): data is KineticStore {
  if (!data || typeof data !== 'object') {
    return false;
  }
  if (!Array.isArray(data.habits)) {
    return false;
  }
  // Check that habits elements have id and title
  for (const h of data.habits) {
    if (!h || typeof h.id !== 'string' || typeof h.title !== 'string') {
      return false;
    }
  }
  return true;
}

export function serializeBackup(store: KineticStore): string {
  return JSON.stringify(store, null, 2);
}

export function parseAndValidateBackup(rawJson: string): { success: boolean; data?: KineticStore; error?: string } {
  try {
    const parsed = JSON.parse(rawJson);
    if (!validateBackupSchema(parsed)) {
      return { success: false, error: 'Invalid Kinetic backup JSON schema: missing or malformed habits.' };
    }
    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON file.' };
  }
}
