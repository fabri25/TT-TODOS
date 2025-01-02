import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/VisualizarMetas.css'; // Usa el mismo archivo CSS
import coinGif from '../assets/images/coin.gif';
import ConfirmationModal from './ConfirmationModal'; // Ajusta la ruta si es necesario


const VisualizarDeudas = () => {
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(null);


  useEffect(() => {
    fetchDeudas();
  }, []);

  const fetchDeudas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:5000/api/deudas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data); // Verifica los datos
      setDeudas(response.data);
    } catch (error) {
      console.error('Error al obtener las deudas', error);
    }
    setLoading(false);
  };

  const openDeleteConfirmation = (id_deuda) => {
    setConfirmationMessage('¿Estás seguro de que deseas eliminar esta deuda?');
    setOnConfirmAction(() => () => handleDelete(id_deuda));
    setShowConfirmationModal(true);
  };
  

  const handleDelete = async (id_deuda) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:5000/api/deudas/${id_deuda}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDeudas(); // Actualizar la lista después de eliminar
    } catch (error) {
      console.error('Error al eliminar la deuda', error);
    }
  };
  

  const handleViewDetails = (id_deuda) => {
    navigate(`/dashboard/deudas/${id_deuda}`);
  };

  return (
    <div className="metas-container">
      <h2>Mis Deudas</h2>
      {loading ? (
        <div className="overlay">
          <div className="loading-message">
            Cargando deudas... <br />
            <img src={coinGif} alt="Cargando..." className="loading-image" />
          </div>
        </div>
      ) : deudas.length === 0 ? (
        <p>No tienes deudas registradas.</p>
      ) : (
        <table className="metas-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Monto de la Deuda</th>
              <th>Monto Total con Interés</th>
              <th>Tasa de Interés (%)</th>
              <th>Plazo (meses)</th>
              <th>Fecha de Inicio</th>
              <th>Detalles</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {deudas.map((deuda) => (
              <tr key={deuda.ID_Deuda}>
                <td>{deuda.Descripcion}</td>
                <td>
                  {parseFloat(deuda.Monto_Deuda).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  })}
                </td>
                <td>
                  {deuda.Monto_Total
                    ? parseFloat(deuda.Monto_Total).toLocaleString('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      })
                    : 'N/A'}
                </td>
                <td>
                  {parseFloat(deuda.Tasa_Interes) === 0
                    ? "MSI"
                    : `${parseFloat(deuda.Tasa_Interes).toFixed(2)}%`}
                </td>
                <td>{deuda.Plazo}</td>
                <td>{new Date(deuda.Fecha_Inicio).toLocaleDateString()}</td>
                <td>
                  <button
                    className="action-button details-button"
                    onClick={() => handleViewDetails(deuda.ID_Deuda)}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                </td>
                <td>
                  <button
                    className="action-button delete-button"
                    onClick={() => openDeleteConfirmation(deuda.ID_Deuda)}
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

export default VisualizarDeudas;
