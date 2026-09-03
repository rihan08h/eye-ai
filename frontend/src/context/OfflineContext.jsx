import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getOfflinePatients,
  removeOfflinePatient,
  getOfflineScreenings,
  removeOfflineScreening,
  saveOfflinePatient,
  saveOfflineScreening,
} from '../utils/offlineDB';
import { patientService, screeningService } from '../services/entities.service';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('Synced'); // 'Online' | 'Offline' | 'Syncing' | 'Synced' | 'Pending Sync'
  const [pendingCount, setPendingCount] = useState(0);

  // Check pending offline count
  const refreshPendingCount = useCallback(async () => {
    try {
      const [patients, screenings] = await Promise.all([
        getOfflinePatients(),
        getOfflineScreenings(),
      ]);
      const total = (patients?.length || 0) + (screenings?.length || 0);
      setPendingCount(total);
      if (total > 0 && isOnline) {
        setSyncStatus('Pending Sync');
      } else if (total === 0) {
        setSyncStatus('Synced');
      }
    } catch {
      // Ignore DB errors
    }
  }, [isOnline]);

  // Synchronize all pending records to backend
  const syncPendingRecords = useCallback(async () => {
    if (!navigator.onLine) return;

    setSyncStatus('Syncing');
    let syncedSuccess = 0;

    try {
      // 1. Sync pending patients
      const offlinePatients = await getOfflinePatients();
      const patientIdMap = {}; // Maps tempId -> real DB _id

      for (const p of offlinePatients) {
        try {
          const { tempId, synced, queuedAt, ...dataToPost } = p;
          const res = await patientService.create(dataToPost);
          patientIdMap[tempId] = res.data.patient._id;
          await removeOfflinePatient(tempId);
          syncedSuccess++;
        } catch (err) {
          console.error('Failed syncing patient:', err);
        }
      }

      // 2. Sync pending screenings
      const offlineScreenings = await getOfflineScreenings();
      for (const s of offlineScreenings) {
        try {
          const { tempId, synced, queuedAt, imageBlob, patientId, ...fields } = s;
          const actualPatientId = patientIdMap[patientId] || patientId;

          const formData = new FormData();
          formData.append('patientId', actualPatientId);
          if (imageBlob) {
            formData.append('image', imageBlob, 'offline_retina.jpg');
          }
          if (fields.eyeSide) formData.append('eyeSide', fields.eyeSide);
          if (fields.notes) formData.append('notes', fields.notes);

          await screeningService.create(formData);
          await removeOfflineScreening(tempId);
          syncedSuccess++;
        } catch (err) {
          console.error('Failed syncing screening:', err);
        }
      }

      if (syncedSuccess > 0) {
        toast.success(`Successfully synced ${syncedSuccess} offline record(s) to cloud!`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Sync encountered errors. Will retry.');
    } finally {
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored!');
      syncPendingRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('Offline');
      toast.error('You are offline. Screenings will be queued locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingRecords, refreshPendingCount]);

  const queuePatientOffline = async (patientData) => {
    const record = await saveOfflinePatient(patientData);
    await refreshPendingCount();
    toast.success('Patient saved locally (Offline mode)');
    return record;
  };

  const queueScreeningOffline = async (screeningData) => {
    const record = await saveOfflineScreening(screeningData);
    await refreshPendingCount();
    toast.success('Screening queued for cloud sync (Offline mode)');
    return record;
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncStatus,
        pendingCount,
        syncPendingRecords,
        queuePatientOffline,
        queueScreeningOffline,
        refreshPendingCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
