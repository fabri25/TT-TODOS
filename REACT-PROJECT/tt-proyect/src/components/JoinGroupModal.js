import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal'; // Importar el modal de confirmación
import '../styles/FilterModal.css'; // Usa el mismo estilo que los otros modales

const JoinGroupModal = ({ onJoinGroup, onClose }) => {
  const [groupCode, setGroupCode] = useState(''); // Estado para almacenar el código del grupo
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Estado para mostrar el modal de confirmación
  const [confirmationMessage, setConfirmationMessage] = useState(''); // Mensaje del modal de confirmación

  const handleConfirmJoin = () => {
    if (!groupCode.trim()) return; // Validar que el código no esté vacío
    setConfirmationMessage(`¿Estás seguro de que deseas unirte al grupo con el código ${groupCode}?`);
    setShowConfirmationModal(true);
  };

  const confirmJoinGroup = () => {
    onJoinGroup(groupCode); // Llama a la función para unirse al grupo
    setShowConfirmationModal(false);
    onClose(); // Cierra el modal después de confirmar
  };

  return (
    <div className="filter-modal-backdrop">
      <div className="filter-modal">
        <div className="filter-modal-header">
          <h4 className="filter-modal-title">Unirse a un Grupo</h4>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="filter-modal-body">
          <p>Introduce el código del grupo al que deseas unirte.</p>
          <input
            type="text"
            className="form-control"
            placeholder="Código del grupo"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
          />
        </div>
        <div className="filter-modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleConfirmJoin}
            disabled={!groupCode.trim()} // Deshabilita el botón si el campo está vacío
          >
            Unirse
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>

      {showConfirmationModal && (
        <ConfirmationModal
          message={confirmationMessage}
          onConfirm={confirmJoinGroup}
          onCancel={() => setShowConfirmationModal(false)}
        />
      )}
    </div>
  );
};

export default JoinGroupModal;
