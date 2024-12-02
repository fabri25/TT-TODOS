import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Asegúrate de importar esto
import axios from 'axios';
import '../styles/CreateGroup.css';
import GroupCreationModal from './GroupCreationModal';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState(['']);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No se encontró el token de autenticación.");
        return;
      }

      const response = await axios.post(
        'http://127.0.0.1:5000/api/crear_grupo',
        {
          nombre_grupo: groupName,
          descripcion: description,
          miembros: members.filter(email => email !== '')
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 201) {
        setInvitationLink(response.data.invitationLink);
        setShowSuccessModal(true);
      } else {
        console.error("Error al crear el grupo:", response.data.error);
      }
    } catch (error) {
      console.error("Error al crear el grupo:", error);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setGroupName('');
    setDescription('');
    setMembers(['']);
    navigate('/dashboard/listado_grupos');
  };

  return (
    <div className="create-group-container">
      <h2>Crear un Nuevo Grupo</h2>
      <form onSubmit={handleSubmit} className="create-group-form">
        <div className="form-group">
          <label>Nombre del Grupo:</label><br /><br />
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Descripción:</label><br /><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        
        <div className="form-group"><br /><br />
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
        <GroupCreationModal
          invitationLink={invitationLink}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CreateGroup;
