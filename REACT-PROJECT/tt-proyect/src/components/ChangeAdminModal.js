import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal'; // Modal de confirmación
import '../styles/FilterModal.css'; // Usa el mismo estilo que el otro modal

const ChangeAdminModal = ({ members, onChangeAdmin, onClose }) => {
  const [selectedMember, setSelectedMember] = useState(null); // Miembro seleccionado
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Mostrar modal de confirmación
  const [confirmationMessage, setConfirmationMessage] = useState(''); // Mensaje del modal de confirmación

  const handleConfirmChange = () => {
    if (!selectedMember) return;
    setConfirmationMessage(
      `¿Estás seguro de que deseas asignar como administrador a ${selectedMember.Nombre_Completo}?`
    );
    setShowConfirmationModal(true);
  };

  const confirmChangeAdmin = () => {
    if (!selectedMember) return;
    onChangeAdmin(selectedMember.ID_Usuario); // Llama a la función para cambiar el administrador
    setShowConfirmationModal(false);
    onClose(); // Cierra el modal después de confirmar
  };

  return (
    <div className="filter-modal-backdrop">
      <div className="filter-modal">
        <div className="filter-modal-header">
          <h4 className="filter-modal-title">Cambiar Administrador</h4>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="filter-modal-body">
          <p>Selecciona un miembro confirmado del grupo para asignarlo como nuevo administrador.</p>
          <ul className="member-list">
            {members.map((member) => (
              <li
                key={member.ID_Usuario}
                className={`member-item ${
                  selectedMember && selectedMember.ID_Usuario === member.ID_Usuario ? 'selected' : ''
                }`}
                onClick={() => setSelectedMember(member)}
              >
                {member.Nombre_Completo} ({member.Email})
              </li>
            ))}
          </ul>
        </div>
        <div className="filter-modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleConfirmChange}
            disabled={!selectedMember}
          >
            Cambiar Administrador
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>

      {showConfirmationModal && (
        <ConfirmationModal
          message={confirmationMessage}
          onConfirm={confirmChangeAdmin}
          onCancel={() => setShowConfirmationModal(false)}
        />
      )}
    </div>
  );
};

export default ChangeAdminModal;
