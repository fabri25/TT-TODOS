// ConfirmationModal.js
import React from 'react';
import '../styles/ConfirmationModal.css';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="confirmation-modal-backdrop">
            <div className="confirmation-modal">
                <p>{message}</p>
                <div className="confirmation-modal-buttons">
                    <button className="btn-confirm" onClick={onConfirm}>Confirmar</button>
                    <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
