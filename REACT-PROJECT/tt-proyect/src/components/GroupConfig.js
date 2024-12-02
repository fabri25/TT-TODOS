import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/GroupConfig.css';
import ConfirmationModal from './ConfirmationModal'; // Modal de confirmación
import ChangeAdminModal from './ChangeAdminModal'; // Nuevo modal para cambiar administrador

const GroupConfig = () => {
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Modal de confirmación para eliminar grupo
  const [modalMessage, setModalMessage] = useState(''); // Mensaje del modal de confirmación
  const [showChangeAdminModal, setShowChangeAdminModal] = useState(false); // Modal para cambiar administrador
  const navigate = useNavigate();
  const { grupoId } = useParams();

  useEffect(() => {
    fetchGroupInfo();
  }, []);

  const fetchGroupInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:5000/api/grupo/${grupoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGroupInfo(response.data);

      const updatedMembers = response.data.Miembros.map((member) => ({
        ...member,
        Rol: member.ID_Usuario === response.data.ID_Admin ? 'Administrador (Tú)' : 'Miembro',
      }));

      setGroupMembers(updatedMembers.filter((m) => m.Confirmado === 1));
    } catch (error) {
      console.error('Error al obtener información del grupo:', error);
      if (error.response && error.response.status === 403) {
        navigate(`/dashboard/grupo/${grupoId}`);
      }
    }
    setLoading(false);
  };

  const handleDeleteMember = async (memberId) => {
    if (
      window.confirm(
        '¿Estás seguro de que deseas eliminar a este miembro del grupo?'
      )
    ) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(
          `http://127.0.0.1:5000/api/grupo/${grupoId}/miembro/${memberId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setGroupMembers((prevMembers) =>
          prevMembers.filter((member) => member.ID_Usuario !== memberId)
        );
      } catch (error) {
        console.error('Error al eliminar miembro:', error);
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(groupInfo.Codigo_Invitacion);
    alert('Código de invitación copiado al portapapeles.');
  };

  const handleRegisterGoal = () => {
    navigate(`/dashboard/grupo/${grupoId}/registrar-meta-grupo`);
  };

  const handleAddMember = () => {
    navigate(`/dashboard/grupo/${grupoId}/agregar-miembro`);
  };

  const handleDeleteGroup = () => {
    setModalMessage('¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer.');
    setShowModal(true);
  };

  const confirmDeleteGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:5000/api/grupo/${grupoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      navigate('/dashboard/listado_grupos');
    } catch (error) {
      console.error('Error al eliminar el grupo:', error);
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setModalMessage('');
  };

  const handleOpenChangeAdminModal = () => {
    setShowChangeAdminModal(true);
  };

  const handleCloseChangeAdminModal = () => {
    setShowChangeAdminModal(false);
  };

  const handleChangeAdmin = async (newAdminId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/cambiar-admin`,
        { new_admin_id: newAdminId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchGroupInfo(); // Actualiza la información del grupo
      navigate('/dashboard/listado_grupos');
    } catch (error) {
      console.error('Error al cambiar el administrador:', error);
    }
  };

  return (
    <div className="group-config-container">
      {loading ? (
        <div className="loading-message">Cargando configuración del grupo...</div>
      ) : (
        <>
          <h2>Configuración del Grupo: {groupInfo.Nombre_Grupo}</h2>
          <div className="group-config-buttons">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRegisterGoal}
            >
              Registrar Meta
            </button>
            <div className="invite-code-container">
              <input
                type="text"
                value={groupInfo.Codigo_Invitacion}
                readOnly
                className="invite-code"
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyCode}
              >
                Copiar Código
              </button>
            </div>
            <button
              className="btn btn-success btn-sm"
              onClick={handleAddMember}
            >
              Agregar Miembros
            </button>
          </div>
          <h3>Miembros del Grupo</h3>
          <table className="members-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groupMembers.map((member) => (
                <tr key={member.ID_Usuario}>
                  <td>{member.Nombre_Completo}</td>
                  <td>{member.Email}</td>
                  <td>{member.Contacto || 'No disponible'}</td>
                  <td>{member.Rol}</td>
                  <td>
                    {member.ID_Usuario !== groupInfo.ID_Admin && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMember(member.ID_Usuario)}
                      >
                        <i className="bi bi-trash"></i> Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Botones adicionales */}
          <div className="group-config-actions">
            <button
              className="btn btn-danger"
              onClick={handleDeleteGroup}
            >
              Eliminar Grupo
            </button>
            <button
              className="btn btn-warning"
              onClick={handleOpenChangeAdminModal}
            >
              Cambiar Administrador
            </button>
          </div>
        </>
      )}
      {showModal && (
        <ConfirmationModal
          message={modalMessage}
          onConfirm={confirmDeleteGroup}
          onCancel={handleCancel}
        />
      )}
      {showChangeAdminModal && (
        <ChangeAdminModal
          members={groupMembers}
          onChangeAdmin={handleChangeAdmin}
          onClose={handleCloseChangeAdminModal}
        />
      )}
    </div>
  );
};

export default GroupConfig;
