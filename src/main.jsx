import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ConfirmationDialog from "./components/ConfirmationDialog";
import NotificationCenter from "./components/NotificationCenter";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfirmationDialog />
    <NotificationCenter />
    <App />
  </React.StrictMode>
);
