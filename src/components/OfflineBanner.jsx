import { WifiOff, RefreshCw } from "lucide-react";
import useOnlineStatus from "../hooks/useOnlineStatus";

function OfflineBanner() {
  const { isOnline, pendingCount, syncing, syncNow } = useOnlineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-5 py-2 text-[12px] font-medium text-white ${
        isOnline ? "bg-amber-500" : "bg-slate-700"
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline && <WifiOff size={14} />}

        <span>
          {!isOnline
            ? "Anda sedang offline. Data yang ditampilkan mungkin tidak terbaru."
            : `${pendingCount} perubahan menunggu sinkronisasi.`}
        </span>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 transition hover:bg-white/30 disabled:opacity-60"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Menyinkronkan..." : "Sinkronkan sekarang"}
        </button>
      )}
    </div>
  );
}

export default OfflineBanner;
