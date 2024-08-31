import React from 'react';
import '../styles/RegistrationModal.css';

const RegistrationModal = ({ email, onClose }) => {
    return (
        <div className="filter-modal-backdrop">
            <div className="filter-modal">
                <div className="filter-modal-header">
                    <h4 className="filter-modal-title">Verifica tu correo electrónico</h4>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="filter-modal-body">
                    <p>Hemos enviado un correo electrónico a {email}. Por favor, revisa tu bandeja de entrada para verificar tu cuenta.</p>
                </div>
                <div className="filter-modal-footer">
                    <button onClick={onClose} className="btn btn-primary">Aceptar</button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationModal;
