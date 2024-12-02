import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from './ConfirmationModal'; // Modal reutilizado
import '../styles/AccountSettings.css'; // Usa el mismo estilo de editar cuenta

const ChangeEmail = () => {
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newEmail !== confirmEmail) {
      setError('Los correos no coinciden.');
      return;
    }

    // Mostrar el modal de confirmación
    setModalMessage('¿Estás seguro de que deseas cambiar tu correo electrónico? Esto cerrará tu sesión.');
    setConfirmAction(() => confirmChangeEmail);
    setShowModal(true);
  };

  const confirmChangeEmail = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://127.0.0.1:5000/api/user/change_email',
        { new_email: newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem('token'); // Eliminar el token de localStorage
      navigate('/'); // Redirigir a la página de inicio de sesión
    } catch (error) {
      console.error('Error al cambiar el correo:', error);
      setError('Hubo un problema al cambiar tu correo. Intenta nuevamente.');
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
        <h2 className="account-title">Cambiar Correo Electrónico</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newEmail">Correo Nuevo</label>
            <br />
            <br />
            <input
              type="email"
              id="newEmail"
              className="form-control"
              placeholder="Ingresa tu nuevo correo"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmEmail">Confirmar Correo</label>
            <br />
            <br />
            <input
              type="email"
              id="confirmEmail"
              className="form-control"
              placeholder="Confirma tu nuevo correo"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard/configuracionCuenta')}
            >
              Cancelar
            </button>
          </div>
        </form>
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

export default ChangeEmail;
