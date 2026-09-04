import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { CONFIRMATION_EVENT } from "../services/ConfirmationService";

function ConfirmationDialog() {
  const [request, setRequest] = useState(null);
  const requestRef = useRef(null);

  const finish = (confirmed) => {
    const currentRequest = requestRef.current;
    if (!currentRequest) return;

    requestRef.current = null;
    currentRequest.resolve(confirmed);
    setRequest(null);
  };

  useEffect(() => {
    const handleRequest = (event) => {
      if (requestRef.current) {
        requestRef.current.resolve(false);
      }

      requestRef.current = event.detail;
      setRequest(event.detail);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && requestRef.current) {
        finish(false);
      }
    };

    window.addEventListener(CONFIRMATION_EVENT, handleRequest);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(CONFIRMATION_EVENT, handleRequest);
      window.removeEventListener("keydown", handleKeyDown);

      if (requestRef.current) {
        requestRef.current.resolve(false);
        requestRef.current = null;
      }
    };
  }, []);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) finish(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="confirmation-title" className="text-lg font-bold text-slate-900">
              {request.title}
            </h2>
            <p id="confirmation-message" className="mt-2 text-sm leading-6 text-slate-600">
              {request.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => finish(false)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => finish(false)}
            autoFocus
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {request.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => finish(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            <Trash2 size={16} />
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
