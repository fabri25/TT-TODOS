import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import axios from 'axios';
import '../styles/VisualizarMetas.css'; // Usa el mismo archivo CSS del componente original
import coinGif from '../assets/images/coin.gif';
import ConfirmationModal from './ConfirmationModal'; // Asegúrate de ajustar la ruta

const VisualizarAhorros = () => {
  const [ahorros, setAhorros] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Inicializa useNavigate
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  useEffect(() => {
    fetchAhorros();
  }, []);

  const fetchAhorros = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Actualizar ahorros antes de obtener los datos
      await axios.post('http://127.0.0.1:5000/api/ahorros/actualizar', null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Obtener los ahorros actualizados
      const response = await axios.get('http://127.0.0.1:5000/api/ahorros', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data); // Verifica que los datos contengan ID_Ahorro
      setAhorros(response.data);
    } catch (error) {
      console.error('Error al obtener los ahorros', error);
    }
    setLoading(false);
  };

  const openDeleteConfirmation = (id_ahorro) => {
    setConfirmationMessage('¿Estás seguro de que deseas eliminar este ahorro?');
    setOnConfirmAction(() => () => handleDelete(id_ahorro));
    setShowConfirmationModal(true);
  };

  const handleDelete = async (id_ahorro) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:5000/api/ahorros/${id_ahorro}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAhorros(); // Actualizar la lista de ahorros después de eliminar
    } catch (error) {
      console.error('Error al eliminar el ahorro', error);
    }
  };

  const handleViewDetails = (id_ahorro) => {
    navigate(`/dashboard/ahorros/${id_ahorro}`);
  };

  return (
    <div className="metas-container">
      <h2>Mis Ahorros</h2>
      {loading ? (
        <div className="overlay">
          <div className="loading-message">
            Cargando ahorros... <br />
            <img src={coinGif} alt="Cargando..." className="loading-image" />
          </div>
        </div>
      ) : ahorros.length === 0 ? (
        <p>No tienes ahorros registrados.</p>
      ) : (
        <table className="metas-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Monto Ahorrado</th>
              <th>Fecha de Inicio</th>
              <th>Tasa de Interés (%)</th>
              <th>Rendimiento</th>
              <th>Detalles</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {ahorros.map((ahorro) => (
              <tr key={ahorro.ID_Ahorro}>
                <td>{ahorro.Descripcion}</td>
                <td>
                  {parseFloat(ahorro.Monto_Actual).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  })}
                </td>
                <td>{new Date(ahorro.Fecha_Inicio).toLocaleDateString()}</td>
                <td>{parseFloat(ahorro.Tasa_Interes).toFixed(2)}%</td>
                <td>
                  {parseFloat(ahorro.Rendimiento || 0).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  })}
                </td>
                <td>
                  <button
                    className="action-button details-button"
                    onClick={() => handleViewDetails(ahorro.ID_Ahorro)}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                </td>
                <td>
                  <button
                    className="action-button delete-button"
                    onClick={() => openDeleteConfirmation(ahorro.ID_Ahorro)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showConfirmationModal && (
        <ConfirmationModal
          message={confirmationMessage}
          onConfirm={() => {
            setShowConfirmationModal(false);
            if (onConfirmAction) onConfirmAction();
          }}
          onCancel={() => setShowConfirmationModal(false)}
        />
      )}
    </div>
  );
};

export default VisualizarAhorros;
