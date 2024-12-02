import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import Notification from './Notification';
import '../styles/EditIncome.css'; // Reutilizamos estilos existentes

const EditUserModal = ({ onClose }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    Nombre: '',
    Apellido_P: '',
    Apellido_M: '',
    Fecha_Cumple: '',
    Contacto: '',
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://127.0.0.1:5000/api/user/info', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { Nombre, Apellido_P, Apellido_M, Fecha_Cumple, Contacto } = response.data;

        setUserData({
          Nombre: Nombre || '',
          Apellido_P: Apellido_P || '',
          Apellido_M: Apellido_M || '',
          Fecha_Cumple: Fecha_Cumple ? new Date(Fecha_Cumple).toISOString().split('T')[0] : '',
          Contacto: Contacto || '',
        });
      } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
        setNotification({
          show: true,
          type: 'error',
          message: 'Error al obtener los datos del usuario.',
        });
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://127.0.0.1:5000/api/user/edit',
        {
          Nombre: userData.Nombre,
          Apellido_P: userData.Apellido_P,
          Apellido_M: userData.Apellido_M,
          Fecha_Cumple: userData.Fecha_Cumple,
          Contacto: userData.Contacto,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotification({
        show: true,
        type: 'success',
        message: 'Información actualizada con éxito.',
      });

      navigate('/dashboard/configuracionCuennta');
    } catch (error) {
      console.error('Error al actualizar la información:', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Error al actualizar la información.',
      });
    } finally {
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="edit-user-container">
      <div className="card">
        <h2>Editar Información</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="Nombre">Nombre</label>
            <br></br><br></br>
            <input
              type="text"
              id="Nombre"
              name="Nombre"
              value={userData.Nombre}
              onChange={handleInputChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="Apellido_P">Apellido Paterno</label>
            <br></br><br></br>
            <input
              type="text"
              id="Apellido_P"
              name="Apellido_P"
              value={userData.Apellido_P}
              onChange={handleInputChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="Apellido_M">Apellido Materno</label>
            <br></br><br></br>
            <input
              type="text"
              id="Apellido_M"
              name="Apellido_M"
              value={userData.Apellido_M}
              onChange={handleInputChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="Fecha_Cumple">Fecha de Nacimiento</label>
            <br></br><br></br>
            <input
              type="date"
              id="Fecha_Cumple"
              name="Fecha_Cumple"
              value={userData.Fecha_Cumple}
              onChange={handleInputChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="Contacto">Teléfono</label>
            <br></br><br></br>
            <input
              type="tel"
              id="Contacto"
              name="Contacto"
              value={userData.Contacto}
              onChange={handleInputChange}
              className="form-control"
            />
          </div>
          <div className="modal-buttons">
            <button type="button" className="btn btn-primary" onClick={handleSaveClick}>
              Guardar Cambios
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {showConfirmModal && (
        <ConfirmationModal
          message="¿Está seguro de que desea guardar los cambios?"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ show: false, type: '', message: '' })}
        />
      )}
    </div>
  );
};

export default EditUserModal;
