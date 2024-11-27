import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/VisualizarMetas.css'; // Reutilizamos el mismo CSS

const VisualizarMetasGrupales = () => {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { grupoId } = useParams(); // Obtener el ID del grupo desde la URL

  useEffect(() => {
    fetchMetasGrupales();
  }, []);

  const fetchMetasGrupales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:5000/api/grupo/${grupoId}/metas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Agregar el estatus basado en la comparación de Monto_Actual y Monto_Objetivo
      const metasConEstatus = response.data.map((meta) => {
        const estatus =
          parseFloat(meta.Monto_Actual) === parseFloat(meta.Monto_Objetivo)
            ? 'Completado'
            : 'En curso';

        return {
          ...meta,
          Estatus: estatus,
        };
      });

      setMetas(metasConEstatus);
    } catch (error) {
      console.error('Error al obtener las metas grupales', error);
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
    setLoading(false);
  };

  const handleViewDetails = (id_meta) => {
    navigate(`/dashboard/grupo/${grupoId}/metas/${id_meta}`);
  };

  return (
    <div className="metas-container">
      <h2>Metas de Ahorro Grupal</h2>
      {loading ? (
        <div className="loading-message">Cargando metas...</div>
      ) : metas.length === 0 ? (
        <p>No hay metas grupales registradas.</p>
      ) : (
        <table className="metas-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Monto Objetivo</th>
              <th>Monto Actual</th>
              <th>Fecha de Inicio</th>
              <th>Fecha de Término (Deseada)</th>
              <th>Estatus</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {metas.map((meta) => (
              <tr key={meta.ID_Ahorro_Grupal}>
                <td>{meta.Descripcion}</td>
                <td>
                  {parseFloat(meta.Monto_Objetivo).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  })}
                </td>
                <td>
                  {parseFloat(meta.Monto_Actual).toLocaleString('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                  })}
                </td>
                <td>{new Date(meta.Fecha_Inicio).toLocaleDateString()}</td>
                <td>{new Date(meta.Fecha_Limite).toLocaleDateString()}</td>
                <td>{meta.Estatus}</td>
                <td>
                  <button
                    className="action-button details-button"
                    onClick={() => handleViewDetails(meta.ID_Ahorro_Grupal)}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VisualizarMetasGrupales;
