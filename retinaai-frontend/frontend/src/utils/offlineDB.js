import { openDB } from 'idb';

const DB_NAME = 'RetinaAI_Offline_DB';
const DB_VERSION = 1;

/**
 * Initializes IndexedDB stores for offline operation
 */
export const initOfflineDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for offline-registered patients
      if (!db.objectStoreNames.contains('offline_patients')) {
        db.createObjectStore('offline_patients', { keyPath: 'tempId' });
      }
      // Store for offline screenings pending sync
      if (!db.objectStoreNames.contains('offline_screenings')) {
        db.createObjectStore('offline_screenings', { keyPath: 'tempId' });
      }
    },
  });
};

export const saveOfflinePatient = async (patientData) => {
  const db = await initOfflineDB();
  const tempId = 'offline_' + Date.now();
  const record = {
    ...patientData,
    tempId,
    synced: false,
    queuedAt: new Date().toISOString(),
  };
  await db.put('offline_patients', record);
  return record;
};

export const getOfflinePatients = async () => {
  const db = await initOfflineDB();
  return db.getAll('offline_patients');
};

export const removeOfflinePatient = async (tempId) => {
  const db = await initOfflineDB();
  await db.delete('offline_patients', tempId);
};

export const saveOfflineScreening = async (screeningData) => {
  const db = await initOfflineDB();
  const tempId = 'offline_screen_' + Date.now();
  const record = {
    ...screeningData,
    tempId,
    synced: false,
    queuedAt: new Date().toISOString(),
  };
  await db.put('offline_screenings', record);
  return record;
};

export const getOfflineScreenings = async () => {
  const db = await initOfflineDB();
  return db.getAll('offline_screenings');
};

export const removeOfflineScreening = async (tempId) => {
  const db = await initOfflineDB();
  await db.delete('offline_screenings', tempId);
};
