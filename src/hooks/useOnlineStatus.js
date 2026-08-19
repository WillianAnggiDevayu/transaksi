import { useCallback, useEffect, useState } from "react";
import ApiClient from "../services/ApiClient";
import OfflineQueue from "../services/OfflineQueue";

export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await OfflineQueue.getPendingCount());
  }, []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;

    setSyncing(true);

    try {
      await ApiClient.syncPendingQueue();
    } catch (err) {
      console.error("Gagal menyinkronkan perubahan offline:", err);
    } finally {
      setSyncing(false);
      refreshPendingCount();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };

    const handleOffline = () => setIsOnline(false);
    const handleQueueChanged = () => refreshPendingCount();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pms-queue-changed", handleQueueChanged);
    window.addEventListener("pms-sync-complete", handleQueueChanged);

    // Coba sinkron sekali saat pertama kali dimuat, jika kebetulan online
    // dan ada sisa antrian dari sesi sebelumnya.
    if (navigator.onLine) sync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pms-queue-changed", handleQueueChanged);
      window.removeEventListener("pms-sync-complete", handleQueueChanged);
    };
  }, [refreshPendingCount, sync]);

  return { isOnline, pendingCount, syncing, syncNow: sync };
}
