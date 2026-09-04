export const CONFIRMATION_EVENT = "pms-confirmation-request";

export function confirmAction({
  title = "Konfirmasi hapus",
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
}) {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(CONFIRMATION_EVENT, {
        detail: {
          title,
          message,
          confirmLabel,
          cancelLabel,
          resolve,
        },
      })
    );
  });
}
