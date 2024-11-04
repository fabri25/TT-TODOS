import React, { useState } from 'react';
import '../styles/CreateGroup.css';
import GroupCreationModal from './GroupCreationModal'; // Importar el nuevo modal

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState(['']);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');

  const handleAddMember = () => {
    setMembers([...members, '']);
  };

  const handleMemberChange = (index, value) => {
    const updatedMembers = [...members];
    updatedMembers[index] = value;
    setMembers(updatedMembers);
  };

  const handleRemoveMember = (index) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Genera un enlace de invitación simulado (reemplazar por lógica de API en producción)
    const generatedLink = `https://tuapp.com/invite/${Math.random().toString(36).substring(2, 8)}`;
    setInvitationLink(generatedLink);
    setShowSuccessModal(true);
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setGroupName('');
    setDescription('');
    setMembers(['']);
  };

  return (
    <div className="create-group-container">
      <h2>Crear un Nuevo Grupo</h2>
      <form onSubmit={handleSubmit} className="create-group-form">
        <div className="form-group">
          <label>Nombre del Grupo:</label><br></br><br></br>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Descripción:</label><br></br><br></br>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        
        <div className="form-group"><br></br><br></br>
          <label>Miembros (Emails):</label>
          {members.map((member, index) => (
            <div key={index} className="member-input">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={member}
                onChange={(e) => handleMemberChange(index, e.target.value)}
              />
              {members.length > 1 && (
                <button
                  type="button"
                  className="remove-member-btn"
                  onClick={() => handleRemoveMember(index)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-member-btn" onClick={handleAddMember}>
            + Agregar Miembro
          </button>
        </div>

        <button type="submit" className="create-group-btn">Crear Grupo</button>
      </form>

      {showSuccessModal && (
        <GroupCreationModal // Usar el componente GroupCreationModal
          invitationLink={invitationLink}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CreateGroup;
