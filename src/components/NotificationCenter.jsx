import { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { NOTIFICATION_EVENT } from "../services/NotificationService";

const DISPLAY_DURATION = 4000;
let nextNotificationId = 0;

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Set());

  const dismiss = (id) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  useEffect(() => {
    const timers = timersRef.current;

    const handleNotification = (event) => {
      const message = event.detail?.message;
      if (!message) return;

      const id = ++nextNotificationId;
      const notification = {
        id,
        type: event.detail?.type || "success",
        message,
      };

      setNotifications((current) => [...current.slice(-3), notification]);

      const timer = window.setTimeout(() => {
        dismiss(id);
        timers.delete(timer);
      }, DISPLAY_DURATION);

      timers.add(timer);
    };

    window.addEventListener(NOTIFICATION_EVENT, handleNotification);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleNotification);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-atomic="false"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-emerald-800 shadow-lg shadow-slate-900/10"
        >
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={19} />
          <p className="min-w-0 flex-1 text-sm font-medium leading-5">
            {notification.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(notification.id)}
            className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup notifikasi"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationCenter;
