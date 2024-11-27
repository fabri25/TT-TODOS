import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/CreateGroup.css';
import ConfirmationModal from './ConfirmationModal';

const AddMembers = () => {
  const [members, setMembers] = useState(['']);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { grupoId } = useParams(); // ID del grupo desde la URL

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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('No se encontró el token de autenticación.');
        return;
      }

      const response = await axios.post(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/agregar-miembros`,
        {
          miembros: members.filter(email => email !== ''),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        navigate(`/dashboard/grupo/configurar/${grupoId}`);
      } else {
        setErrorMessage(response.data.error || 'Error al agregar miembros.');
      }
    } catch (error) {
      console.error('Error al agregar miembros:', error);
      setErrorMessage('Hubo un error al procesar tu solicitud.');
    }
  };

  const handleShowModal = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleCancelModal = () => {
    setShowModal(false);
  };

  const confirmSubmit = () => {
    setShowModal(false);
    handleSubmit();
  };

  return (
    <div className="create-group-container">
      <h2>Agregar Miembros al Grupo</h2>
      <form onSubmit={handleShowModal} className="create-group-form">
        <div className="form-group">
          <label>Miembros (Emails):</label>
          <br></br><br></br>
          {members.map((member, index) => (
            <div key={index} className="member-input">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={member}
                onChange={(e) => handleMemberChange(index, e.target.value)}
                required
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

        <button type="submit" className="create-group-btn">Guardar Miembros</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {showModal && (
        <ConfirmationModal
          message="¿Estás seguro de que deseas agregar estos miembros al grupo?"
          onConfirm={confirmSubmit}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default AddMembers;
