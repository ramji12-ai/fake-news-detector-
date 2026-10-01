import React from "react";
import { useAppData } from "../context/AppDataContext";

export default function ToastContainer() {
  const { toasts } = useAppData();

  return (
    <div
      className="toast-container"
      id="toastContainer"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || "info"}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
