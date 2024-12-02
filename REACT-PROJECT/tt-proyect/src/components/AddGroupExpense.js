import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/EditIncome.css';
import Notification from './Notification';

const AddGroupExpense = () => {
  const { grupoId } = useParams();
  const navigate = useNavigate();

  const [expenseData, setExpenseData] = useState({
    descripcion: '',
    monto: '',
    fecha: '',
    asignado_a: '',
    es_mi_gasto: true, // Por defecto en true para miembros
  });

  const [groupMembers, setGroupMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://127.0.0.1:5000/api/grupos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const grupos = response.data;

        const grupoActual = grupos.find((grupo) => grupo.ID_Grupo === parseInt(grupoId, 10));
        if (grupoActual) {
          setIsAdmin(grupoActual.es_admin === 1);
        } else {
          navigate('/'); // Redirigir si no pertenece al grupo
        }

        const miembrosResponse = await axios.get(`http://127.0.0.1:5000/api/grupo/${grupoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { Miembros, ID_Admin } = miembrosResponse.data;

        // Filtrar los miembros para excluir al administrador
        const miembrosFiltrados = Miembros.filter((member) => member.ID_Usuario !== ID_Admin);
        setGroupMembers(miembrosFiltrados);
      } catch (error) {
        console.error('Error al obtener información de los grupos:', error);
        navigate('/');
      }
    };

    fetchUserGroups();
  }, [grupoId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setExpenseData((prevState) => ({
      ...prevState,
      es_mi_gasto: isChecked,
      asignado_a: isChecked ? '' : prevState.asignado_a, // Limpiar asignado si es "mi gasto"
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const payload = {
        descripcion: expenseData.descripcion,
        monto: expenseData.monto,
        fecha: expenseData.fecha,
        asignado_a: isAdmin && !expenseData.es_mi_gasto ? expenseData.asignado_a : null,
        es_mi_gasto: isAdmin ? expenseData.es_mi_gasto : true, // Siempre true para miembros
      };

      await axios.post(`http://127.0.0.1:5000/api/grupo/${grupoId}/registrar-gasto`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotification({ show: true, type: 'success', message: 'Gasto registrado con éxito' });
      navigate(`/dashboard/grupo/${grupoId}`);
    } catch (error) {
      console.error('Error al registrar el gasto grupal:', error);
      setNotification({ show: true, type: 'error', message: 'Error al registrar el gasto' });
    }
  };

  return (
    <div className="edit-income-container">
      <h2>Registrar Gasto Grupal</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="descripcion">Descripción</label>
          <br></br><br></br>
          <input
            type="text"
            id="descripcion"
            name="descripcion"
            value={expenseData.descripcion}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="monto">Monto</label>
          <br></br><br></br>
          <input
            type="number"
            id="monto"
            name="monto"
            value={expenseData.monto}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="fecha">Fecha</label>
          <br></br><br></br>
          <input
            type="date"
            id="fecha"
            name="fecha"
            value={expenseData.fecha}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        {isAdmin && (
          <>
            <div className="form-group checkbox-group">
              <label htmlFor="es_mi_gasto">Es mi gasto</label>
              <br></br><br></br>
              <input
                type="checkbox"
                id="es_mi_gasto"
                name="es_mi_gasto"
                checked={expenseData.es_mi_gasto}
                onChange={handleCheckboxChange}
                className="form-control-checkbox"
              />
            </div>

            {!expenseData.es_mi_gasto && (
              <div className="form-group">
                <label htmlFor="asignado_a">Asignar a</label>
                <br></br><br></br>
                <select
                  id="asignado_a"
                  name="asignado_a"
                  value={expenseData.asignado_a}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="">Cualquiera</option>
                  {groupMembers.map((member) => (
                    <option key={member.ID_Usuario} value={member.ID_Usuario}>
                      {member.Nombre_Completo}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="modal-buttons">
          <button type="submit" className="btn btn-primary">
            Guardar Gasto
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancelar
          </button>
        </div>
      </form>

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

export default AddGroupExpense;
