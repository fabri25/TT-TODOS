import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Grupos.css';

const Grupos = () => {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGrupos();
  }, []);

  const fetchGrupos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:5000/api/grupos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGrupos(response.data);
    } catch (error) {
      console.error('Error al obtener los grupos:', error);
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
    setLoading(false);
  };

  const handleInfoClick = (grupo) => {
    console.log(`Información del grupo: ${grupo.Nombre_Grupo}`);
    // Aquí podrías redirigir a una vista de información del grupo si es necesario
  };

  const handleConfigClick = (grupo) => {
    console.log(`Configuración del grupo: ${grupo.Nombre_Grupo}`);
    navigate(`/dashboard/grupo/configurar/${grupo.ID_Grupo}`);
  };

  return (
    <div className="grupos-container">
      <h2>Grupos a los que Pertenezco</h2>
      {loading ? (
        <div className="loading-message">Cargando grupos...</div>
      ) : grupos.length === 0 ? (
        <p>No perteneces a ningún grupo.</p>
      ) : (
        <table className="grupos-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Administrador</th>
              <th>Info</th>
              <th>Configuración</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <tr key={grupo.ID_Grupo}>
                <td>{grupo.Nombre_Grupo}</td>
                <td>{grupo.Descripcion}</td>
                <td>
                  {grupo.es_admin
                    ? `${grupo.Nombre_Admin} (Tú)`
                    : grupo.Nombre_Admin}
                </td>
                <td>
                  <button
                    className="info-button"
                    onClick={() => handleInfoClick(grupo)}
                  >
                    <i className="bi bi-info-circle"></i>
                  </button>
                </td>
                <td>
                  {grupo.es_admin ? (
                    <button
                      className="config-button"
                      onClick={() => handleConfigClick(grupo)}
                    >
                      <i className="bi bi-gear"></i>
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Grupos;
