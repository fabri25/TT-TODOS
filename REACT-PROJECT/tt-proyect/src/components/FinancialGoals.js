import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/VisualizarMetas.css';
import coinGif from '../assets/images/coin.gif';

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
        headers: { Authorization: `Bearer ${token}` },
      });

      const metasConTransacciones = await Promise.all(
        response.data.map(async (meta) => {
          const transaccionesResponse = await axios.get(
            `http://127.0.0.1:5000/api/metas/${meta.ID_Meta}/transacciones`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const totalAhorrado = transaccionesResponse.data.reduce(
            (acc, transaccion) => acc + parseFloat(transaccion.MontoAhorrado),
            0
          );

          let estatusAhorro = 'Bajo ahorro';
          if (totalAhorrado >= parseFloat(meta.MontoObjetivo)) {
            estatusAhorro = 'Completado';
          }

          return {
            ...meta,
            TotalAhorrado: totalAhorrado,
            EstatusAhorro: estatusAhorro,
          };
        })
      );

      setMetas(metasConTransacciones);
    } catch (error) {
      console.error('Error al obtener las metas', error);
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id_meta) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta meta?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://127.0.0.1:5000/api/metas/${id_meta}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchMetas();
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
  <div className="overlay">
    <div className="loading-message">
      Cargando metas financieras... <br />
      <img src={coinGif} alt="Cargando..." className="loading-image" />
    </div>
  </div>
)  : metas.length === 0 ? (
        <p>No tienes metas registradas.</p>
      ) : (
        <div className="metas-table-wrapper">
          <table className="metas-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Monto Objetivo</th>
                <th>Fecha de Inicio</th>
                <th>Fecha de Término</th>
                <th>Total Ahorrado</th>
                <th>Estatus de Ahorro</th>
                <th>Detalles</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {metas.map((meta) => (
                <tr key={meta.ID_Meta}>
                  <td>{meta.Nombre}</td>
                  <td>
                    {parseFloat(meta.MontoObjetivo).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </td>
                  <td>{new Date(meta.FechaInicio).toLocaleDateString()}</td>
                  <td>{new Date(meta.FechaTermino).toLocaleDateString()}</td>
                  <td>
                    {parseFloat(meta.TotalAhorrado).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </td>
                  <td>{meta.EstatusAhorro}</td>
                  <td>
                    <button
                      className="action-button details-button"
                      onClick={() => handleViewDetails(meta.ID_Meta)}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                  </td>
                  <td>
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDelete(meta.ID_Meta)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VisualizarMetas;
