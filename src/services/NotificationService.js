export const NOTIFICATION_EVENT = "pms-notification";

const fallbackMessages = {
  POST: "Data berhasil disimpan.",
  PUT: "Data berhasil diedit.",
  PATCH: "Data berhasil diedit.",
  DELETE: "Data berhasil dihapus.",
};

export function notifyMutationSuccess(method, response) {
  if (typeof window === "undefined") return;

  const normalizedMethod = method.toUpperCase();
  const fallbackMessage = fallbackMessages[normalizedMethod];

  if (!fallbackMessage) return;

  const responseMessage =
    response && typeof response === "object" && typeof response.message === "string"
      ? response.message.trim()
      : "";

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: {
        type: "success",
        message: responseMessage || fallbackMessage,
      },
    })
  );
}
