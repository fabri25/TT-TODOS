import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmationModal from './ConfirmationModal'; // Modal reutilizado
import '../styles/AccountSettings.css'; // Usa el mismo estilo de editar cuenta

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Mostrar el modal de confirmación
    setModalMessage('¿Estás seguro de que deseas cambiar tu contraseña? Esto cerrará tu sesión.');
    setConfirmAction(() => confirmChangePassword);
    setShowModal(true);
  };

  const confirmChangePassword = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://127.0.0.1:5000/api/user/change_password',
        { new_password: newPassword }, // Este debe ser un JSON válido
        { headers: { Authorization: `Bearer ${token}` } }
    );
      localStorage.removeItem('token'); // Eliminar el token de localStorage
      navigate('/'); // Redirigir a la página de inicio de sesión
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setError('Hubo un problema al cambiar tu contraseña. Intenta nuevamente.');
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
        <h2 className="account-title">Cambiar Contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">Contraseña Nueva</label>
            <br />
            <br />
            <input
              type="password"
              id="newPassword"
              className="form-control"
              placeholder="Ingresa tu nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <br />
            <br />
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              placeholder="Confirma tu nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              onClick={() => navigate('/dashboard/configuracionCuennta')}
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

export default ChangePassword;
