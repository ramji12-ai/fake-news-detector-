import React from "react";
import { useAppData } from "../context/AppDataContext";

export default function ConfirmModal() {
  const { confirmModalState, closeConfirmModal } = useAppData();

  if (!confirmModalState.open) return null;

  const handleConfirm = () => {
    if (typeof confirmModalState.onConfirm === "function") {
      confirmModalState.onConfirm();
    }
    closeConfirmModal();
  };

  return (
    <div
      className="modal-backdrop"
      id="confirmModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmModalTitle"
      onClick={(e) => {
        if (e.target.id === "confirmModal") closeConfirmModal();
      }}
    >
      <div className="modal-dialog modal-dialog-sm">
        <div className="modal-header">
          <h3 className="modal-title" id="confirmModalTitle">
            {confirmModalState.title || "Confirm Action"}
          </h3>
          <button
            type="button"
            className="btn-icon-close"
            onClick={closeConfirmModal}
            aria-label="Close confirmation dialog"
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{confirmModalState.message}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={closeConfirmModal}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
