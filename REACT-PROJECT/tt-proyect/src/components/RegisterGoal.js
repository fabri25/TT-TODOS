import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/RegisterGoal.css';


const RegisterGoal = () => {
  const [goal, setGoal] = useState({
    nombre: '',
    montoObjetivo: '',
    fechaInicio: ''
  });
  const [promedios, setPromedios] = useState(null);
  const [ahorroTipo, setAhorroTipo] = useState('');
  const [customPercentage, setCustomPercentage] = useState('');
  const [ahorroMensual, setAhorroMensual] = useState(null);
  const [mesesParaMeta, setMesesParaMeta] = useState(null);
  const [fechaTermino, setFechaTermino] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromedios();
  }, []);

  const fetchPromedios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:5000/api/promedios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromedios(response.data);
      if (response.data.disponible_para_metas < 0) {
        //alert("Se recomienda que tengas más ingresos que gastos para una mejor gestión financiera.");
        navigate('/'); // Redirigir a la página principal
      }
    } catch (error) {
      console.error('Error al obtener los promedios', error);
    }
  };

  const handleChange = (e) => {
    setGoal({ ...goal, [e.target.name]: e.target.value });

    if (e.target.name === 'fechaInicio' && mesesParaMeta) {
      calcularFechaTermino(e.target.value, mesesParaMeta);
    }
  };

  const handleAhorroChange = (e) => {
    const tipo = e.target.value;
    setAhorroTipo(tipo);

    if (promedios) {
      let porcentaje = 0;

      switch (tipo) {
        case 'Poco margen de ahorro':
          porcentaje = 10;
          break;
        case 'Ahorro recomendado':
          porcentaje = 20;
          break;
        case 'Mega ahorro':
          porcentaje = 30;
          break;
        case 'Ahorro personalizado':
          porcentaje = customPercentage;
          break;
        default:
          porcentaje = 0;
      }

      setCustomPercentage(porcentaje);
      calcularMesesParaMeta(porcentaje, goal.montoObjetivo);
    }
  };

  const handlePercentageChange = (e) => {
    const porcentaje = e.target.value;
    setCustomPercentage(porcentaje);

    if (ahorroTipo === 'Ahorro personalizado' && promedios) {
      calcularMesesParaMeta(porcentaje, goal.montoObjetivo);
    }
  };

  const calcularMesesParaMeta = (porcentaje, montoObjetivo) => {
    const ahorroMensualCalculado = promedios.disponible_para_metas * (porcentaje / 100);
    if (ahorroMensualCalculado > 0) {
      const mesesNecesarios = Math.ceil(montoObjetivo / ahorroMensualCalculado);
      const nuevoAhorroMensual = (montoObjetivo / mesesNecesarios).toFixed(2);
      
      setAhorroMensual(nuevoAhorroMensual);
      setMesesParaMeta(mesesNecesarios);
  
      if (goal.fechaInicio) {
        calcularFechaTermino(goal.fechaInicio, mesesNecesarios);
      }
    } else {
      //alert("El monto disponible para metas es insuficiente para calcular un plan de ahorro.");
    }
  };
  
  const calcularFechaTermino = (fechaInicio, meses) => {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + meses);
    setFechaTermino(fecha.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        nombre: goal.nombre,
        montoObjetivo: goal.montoObjetivo,
        fechaInicio: goal.fechaInicio,
        mesesParaMeta,
        fechaTermino,
        ahorroMensual
      };
      await axios.post('http://127.0.0.1:5000/api/metas', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      navigate('/dashboard/metas-financieras');
    } catch (error) {
      console.error('Error al crear la meta', error);
    }
  };

  return (
    <div className="register-goal-container">
      <h2>Registrar Nueva Meta</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="nombre" placeholder="Nombre de la Meta" value={goal.nombre} onChange={handleChange} required />
        <input type="number" name="montoObjetivo" placeholder="Monto Objetivo" value={goal.montoObjetivo} onChange={handleChange} required />
       
        <small className="form-text text-muted">Selecciona la fecha en la que deseas comenzar a ahorrar para esta meta.</small>
        <input type="date" id="fechaInicio" name="fechaInicio" placeholder="Fecha de Inicio" value={goal.fechaInicio} onChange={handleChange} required />
        <small className="form-text text-muted">Selecciona un tipo de ahorro (En base a tus ingresos sobre tus gastos) </small>
        <select name="ahorroTipo" value={ahorroTipo} onChange={handleAhorroChange} required>
          <option value="">Selecciona un tipo de ahorro</option>
          <option value="Poco margen de ahorro">Poco margen de ahorro 10%</option>
          <option value="Ahorro recomendado">Ahorro (RECOMENDADO) 20%</option>
          <option value="Mega ahorro">Mega ahorro 30%</option>
          <option value="Ahorro personalizado">Ahorro personalizado</option>
        </select>
        {ahorroTipo === 'Ahorro personalizado' && (
          <input type="number" name="customPercentage" placeholder="Porcentaje Personalizado" value={customPercentage} onChange={handlePercentageChange} required />
        )}
        {mesesParaMeta && (
          <div className="meta-info">
            <p>Para alcanzar tu meta, debes ahorrar ${ahorroMensual} cada mes.</p>
            <p>Esto significa que necesitarás aproximadamente {mesesParaMeta} meses para alcanzar tu meta.</p>
            <p>Fecha estimada de término de la meta: {fechaTermino}</p>
          </div>
        )}
        <button type="submit">Registrar Meta</button>
      </form>
    </div>
  );
};

export default RegisterGoal;
