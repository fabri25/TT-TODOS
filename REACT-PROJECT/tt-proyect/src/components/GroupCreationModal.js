import React from 'react';
import '../styles/GroupCreationModal.css';

const GroupCreationModal = ({ codigoInvitacion, onClose }) => {
  const handleCopyCode = () => {
    navigator.clipboard
      .writeText(codigoInvitacion)
      .catch((error) => console.error('Error al copiar el código:', error));
  };

  return (
    <div className="group-creation-modal-backdrop">
      <div className="group-creation-modal">
        <div className="group-creation-modal-header">
          <h4 className="modal-title">¡Grupo Creado Exitosamente!</h4>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="group-creation-modal-body">
          <p>Comparte este código para invitar a otros a unirse:</p>
          <div className="invitation-code-container">
            <input
              type="text"
              value={codigoInvitacion}
              readOnly
              className="invitation-code-input"
            />
            <button
              className="copy-button"
              onClick={handleCopyCode}
              title="Copiar"
            >
              <i className="bi bi-clipboard"></i>
            </button>
          </div>
        </div>
        <div className="group-creation-modal-footer">
          <button className="btn btn-success" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCreationModal;
