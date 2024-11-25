import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import '../styles/RegisterGoal.css';

const RegisterGroupGoal = () => {
  const [goal, setGoal] = useState({
    descripcion: '',
    montoObjetivo: '',
    fechaInicio: '',
    fechaLimite: ''
  });
  const [montoMensual, setMontoMensual] = useState(null);
  const [mesesParaMeta, setMesesParaMeta] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { grupoId } = useParams(); // Obtener el ID del grupo desde la URL

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGoal((prevGoal) => ({
      ...prevGoal,
      [name]: value
    }));

    if (name === 'fechaInicio' && mesesParaMeta) {
      calcularFechaTermino(value, mesesParaMeta);
    }

    if (name === 'montoObjetivo' && goal.fechaInicio && goal.fechaLimite) {
      calcularMontoMensual(value, goal.fechaInicio, goal.fechaLimite);
    }
  };

  const calcularMontoMensual = (montoObjetivo, fechaInicio, fechaLimite) => {
    const fechaInicioDate = new Date(fechaInicio);
    const fechaLimiteDate = new Date(fechaLimite);
    const diffTime = Math.abs(fechaLimiteDate - fechaInicioDate);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    const ahorroMensual = (montoObjetivo / diffMonths).toFixed(2);

    setMontoMensual(ahorroMensual);
    setMesesParaMeta(diffMonths);
  };

  const calcularFechaTermino = (fechaInicio, meses) => {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + meses);
    return fecha.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        descripcion: goal.descripcion,
        montoObjetivo: goal.montoObjetivo,
        fechaInicio: goal.fechaInicio,
        fechaLimite: goal.fechaLimite,
        idGrupo: grupoId
      };

      await axios.post('http://127.0.0.1:5000/api/grupo/metas', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      navigate(`/dashboard/grupo/${grupoId}`); // Redirige al grupo después de registrar la meta
    } catch (error) {
      console.error('Error al registrar la meta grupal:', error);
    }
  };

  const handleShowModal = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleCancelModal = () => {
    setShowModal(false);
  };

  return (
    <div className="register-goal-container">
      <h2>Registrar Meta de Ahorro Grupal</h2>
      <form onSubmit={handleShowModal}>
        <input
          type="text"
          name="descripcion"
          placeholder="Nombre de la Meta"
          value={goal.descripcion}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="montoObjetivo"
          placeholder="Monto Objetivo"
          value={goal.montoObjetivo}
          onChange={handleChange}
          required
        />
        <small className="form-text text-muted">Selecciona la fecha en la que se desea empezar a ahorrar para esta meta.</small>
        <input
          type="date"
          name="fechaInicio"
          placeholder="Fecha de Inicio"
          value={goal.fechaInicio}
          onChange={handleChange}
          required
        />
        <small className="form-text text-muted">Selecciona la fecha en la que se tiene previsto cumplir la meta.</small>
        <input
          type="date"
          name="fechaLimite"
          placeholder="Fecha Límite"
          value={goal.fechaLimite}
          onChange={handleChange}
          required
        />

        {montoMensual && (
          <div className="meta-info">
            <p>Para alcanzar esta meta, se necesita un ahorro mensual de ${montoMensual}.</p>
            <p>Tiempo estimado para la meta: {mesesParaMeta} meses.</p>
          </div>
        )}

        <button type="submit" className="btn btn-primary">
          Registrar Meta
        </button>
      </form>

      {showModal && (
        <ConfirmationModal
          message="¿Estás seguro de que deseas registrar esta meta?"
          onConfirm={handleSubmit}
          onCancel={handleCancelModal}
        />
      )}
    </div>
  );
};

export default RegisterGroupGoal;
