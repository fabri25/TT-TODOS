import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from './ConfirmationModal'; // Modal reutilizado
import '../styles/AccountSettings.css'; // Crea este archivo CSS para personalizar estilos

const AccountSettings = () => {
  const [userData, setUserData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://127.0.0.1:5000/api/user/info', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Transformar la fecha de nacimiento al formato día/mes/año
        const formattedData = {
          ...response.data,
          Fecha_Cumple: response.data.Fecha_Cumple
            ? new Date(response.data.Fecha_Cumple).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : 'N/A',
        };
        setUserData(formattedData);
      } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = () => {
    navigate('/dashboard/configuracion/editar');
  };

  const handleChangePassword = () => {
    navigate('/dashboard/configuracion/cambiar-contrasena');
  };

  const handleChangeEmail = () => {
    navigate('/dashboard/configuracion/cambiar-correo');
  };

  const handleDeleteAccount = () => {
    setModalMessage('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    setConfirmAction(() => confirmDeactivateAccount);
    setShowModal(true);
  };

  const confirmDeactivateAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://127.0.0.1:5000/api/user/deactivate',
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      console.error('Error al desactivar la cuenta:', error);
      //alert('Hubo un problema al desactivar tu cuenta. Intenta nuevamente.');
    }
  };
  

  const handleCancel = () => {
    setShowModal(false);
    setModalMessage('');
    setConfirmAction(null);
  };

  return (
    <div className="account-settings-container">
      <div className="account-card">
        <h2 className="account-title">Configuración de Cuenta</h2>
        <div className="account-info">
          <p><strong>Nombre:</strong> {userData.Nombre || 'N/A'} {userData.Apellido_P || ''} {userData.Apellido_M || ''}</p>
          <p><strong>Email:</strong> {userData.Email || 'N/A'}</p>
          <p><strong>Fecha de Nacimiento:</strong> {userData.Fecha_Cumple || 'N/A'}</p>
          <p><strong>Contacto:</strong> {userData.Contacto || 'N/A'}</p>
        </div>
        <div className="account-actions">
          <button className="btn btn-primary" onClick={handleEdit}>
            <i className="bi bi-pencil-square"></i> Editar Información
          </button>
          <button className="btn btn-secondary" onClick={handleChangePassword}>
            <i className="bi bi-shield-lock"></i> Cambiar Contraseña
          </button>
          <button className="btn btn-info" onClick={handleChangeEmail}>
            <i className="bi bi-envelope"></i> Cambiar Correo
          </button>
          <button className="btn btn-danger" onClick={handleDeleteAccount}>
            <i className="bi bi-trash"></i> Eliminar Cuenta
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showModal && (
        <ConfirmationModal
          message={modalMessage}
          onConfirm={confirmAction}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default AccountSettings;
