import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ConfirmationDialog from "./components/ConfirmationDialog";
import NotificationCenter from "./components/NotificationCenter";
import "./index.css";

// Pastikan pengguna PWA segera berpindah ke bundle terbaru setelah deployment.
// Tanpa reload saat controller berganti, tab yang sudah terbuka dapat terus
// menampilkan UI versi lama sampai pengguna melakukan hard refresh manual.
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController && !reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.ready
      .then(registration => registration.update())
      .catch(() => {});
  });
}


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfirmationDialog />
    <NotificationCenter />
    <App />
  </React.StrictMode>
);
