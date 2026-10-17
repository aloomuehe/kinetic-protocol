import { IDB_DB_NAME, IDB_STORE_NAME } from '../store/constants';

export interface PdfBinaryRecord {
  storageKey: string;
  bytes: ArrayBuffer;
  mimeType: string;
  savedAt: string;
}

export function openAttachmentDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'storageKey' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB.'));
  });
}

export async function idbSavePdfBlob(
  storageKey: string,
  blob: Blob,
  mimeType: string = 'application/pdf'
): Promise<boolean> {
  const db = await openAttachmentDB();
  const arrayBuffer = await blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const record: PdfBinaryRecord = {
      storageKey,
      bytes: arrayBuffer,
      mimeType,
      savedAt: new Date().toISOString()
    };
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('IndexedDB write failed (storage quota may be exceeded).'));
    };
  });
}

export async function idbGetPdfBlob(storageKey: string): Promise<Blob | null> {
  const db = await openAttachmentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.get(storageKey);
    req.onsuccess = () => {
      db.close();
      const res = req.result as PdfBinaryRecord | undefined;
      if (!res || !res.bytes) {
        resolve(null);
        return;
      }
      resolve(new Blob([res.bytes], { type: res.mimeType || 'application/pdf' }));
    };
    req.onerror = () => {
      db.close();
      reject(req.error || new Error('Failed to read PDF from IndexedDB.'));
    };
  });
}

export async function idbDeletePdfBlob(storageKey: string): Promise<boolean> {
  const db = await openAttachmentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    store.delete(storageKey);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function idbListAllKeys(): Promise<string[]> {
  try {
    const db = await openAttachmentDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        db.close();
        const keys = (req.result || []) as IDBValidKey[];
        resolve(keys.map((k) => String(k)));
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}
