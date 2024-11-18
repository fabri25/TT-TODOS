import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/VisualizarMetas.css'; // Asegúrate de importar el archivo CSS

const VisualizarMetas = () => {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetas();
  }, []);

  const fetchMetas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:5000/api/metas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetas(response.data);
    } catch (error) {
      console.error('Error al obtener las metas', error);
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id_meta) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta meta?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://127.0.0.1:5000/api/metas/${id_meta}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchMetas(); // Actualizar la lista de metas después de eliminar
      } catch (error) {
        console.error('Error al eliminar la meta', error);
      }
    }
  };

  const handleViewDetails = (id_meta) => {
    navigate(`/dashboard/metas/${id_meta}`);
  };

  return (
    <div className="metas-container">
      <h2>Mis Metas Financieras</h2>
      {loading ? (
        <div className="loading-message">Cargando metas...</div>
      ) : metas.length === 0 ? (
        <p>No tienes metas registradas.</p>
      ) : (
        <table className="metas-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Monto Objetivo</th>
              <th>Fecha de Inicio</th>
              <th>Fecha de Término (Estimada)</th>
              <th>Ahorro Mensual (Estimada)</th>
              <th>Meses para Alcanzar</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {metas.map((meta) => (
              <tr key={meta.ID_Meta}>
                <td>{meta.Nombre}</td>
                <td>{parseFloat(meta.MontoObjetivo).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                <td>{new Date(meta.FechaInicio).toLocaleDateString()}</td>
                <td>{new Date(meta.FechaTermino).toLocaleDateString()}</td>
                <td>{parseFloat(meta.AhorroMensual).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                <td>{meta.MesesParaMeta}</td>
                <td>
                  <button className="details-button" onClick={() => handleViewDetails(meta.ID_Meta)}>Ver Detalles</button>
                  <button className="delete-button" onClick={() => handleDelete(meta.ID_Meta)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VisualizarMetas;
