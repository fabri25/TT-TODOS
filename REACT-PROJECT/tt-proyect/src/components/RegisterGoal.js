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
  const [tipoMeta, setTipoMeta] = useState(''); // Selector de tipo de meta
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
        navigate('/dashboard/inicio');
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
    }
  };

  const calcularFechaTermino = (fechaInicio, meses) => {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + meses);
    setFechaTermino(fecha.toISOString().split('T')[0]);
  };

  const [deuda, setDeuda] = useState({
    descripcion: '',
    montoDeuda: '',
    montoTotal: '',
    tasaInteres: '',
    fechaInicio: '',
    plazo: ''
  });

  const [leyendaDeuda, setLeyendaDeuda] = useState(''); // Leyenda dinámica

  const calcularCuotaIntereses = () => {
    const tasaAnual = deuda.tasaInteres ? parseFloat(deuda.tasaInteres) / 100 : 0; // Tasa anual en decimal
    const rMensual = tasaAnual / 12; // Tasa mensual
    const n = deuda.plazo ? parseInt(deuda.plazo) : 0; // Número de pagos (meses)
    const montoInicial = deuda.montoDeuda ? parseFloat(deuda.montoDeuda) : 0; // Monto inicial (sin intereses)
  
    console.log("Tasa anual (decimal):", tasaAnual);
    console.log("Tasa mensual (decimal):", rMensual);
    console.log("Número de pagos (n):", n);
    console.log("Monto inicial (sin intereses):", montoInicial);
  
    if (!rMensual || !n || !montoInicial) {
      console.log("Datos incompletos para calcular.");
      setLeyendaDeuda(""); // No mostrar leyenda si los datos no están completos
      return;
    }
  
    const numerador = rMensual * montoInicial;
    console.log("Numerador:", numerador);
  
    const denominador = 1 - Math.pow(1 + rMensual, -n);
    console.log("Denominador:", denominador);
  
    const cuotaMensual = numerador / denominador;
    console.log("Cuota mensual calculada:", cuotaMensual);
  
    const totalAPagar = cuotaMensual * n; // Total a pagar de la deuda
    const interesesTotales = totalAPagar - montoInicial; // Intereses totales
    console.log("Total a pagar:", totalAPagar);
    console.log("Intereses totales:", interesesTotales);
  
    const leyenda = `
      Cuota Mensual: ${cuotaMensual.toFixed(2)} MXN
      Total a Pagar: ${totalAPagar.toFixed(2)} MXN
      Intereses Totales: ${interesesTotales.toFixed(2)} MXN
    `;
    setLeyendaDeuda(leyenda);
  };
  

  
  const handleDeudaBlur = (e) => {
    const { name, value } = e.target;
  
    let formattedValue = value;
  
    // Formatear el valor según el campo
    if (name === "tasaInteres") {
      formattedValue = formatPercentage(unformatPercentage(value));
    } else if (name === "plazo") {
      formattedValue = formatMonths(unformatMonths(value));
    } else if (name === "montoDeuda" || name === "montoTotal") {
      formattedValue = formatNumber(unformatNumber(value));
    }
  
    // Actualizar el estado de deuda con el valor formateado
    setDeuda((prev) => {
      const updatedDeuda = { ...prev, [name]: formattedValue };
  
      // Ejecutar los cálculos después de actualizar el estado
      if (["montoDeuda", "montoTotal", "tasaInteres", "plazo"].includes(name)) {
        setTimeout(() => calcularCuotaIntereses(updatedDeuda), 0);
      }
  
      return updatedDeuda;
    });
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirmacion = window.confirm(
      `¿Estás seguro de que deseas crear la meta "${goal.nombre}" con un monto objetivo de ${goal.montoObjetivo}?`
    );

    if (!confirmacion) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = {
        nombre: goal.nombre,
        montoObjetivo: goal.montoObjetivo,
        fechaInicio: goal.fechaInicio,
        mesesParaMeta,
        fechaTermino,
        ahorroMensual,
      };
      await axios.post('http://127.0.0.1:5000/api/metas', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      navigate('/dashboard/metas-financieras');
    } catch (error) {
      console.error('Error al crear la meta', error);
    }
  };

  const formatNumber = (value) => {
    if (!value) return "";
    return `$${parseFloat(value).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  
  const formatPercentage = (value) => {
    if (!value) return "";
    return `${parseFloat(value).toFixed(2)}%`;
  };

  const formatMonths = (value) => {
    if (!value) return "";
    return `${parseInt(value)} meses`;
  };
  
  const unformatPercentage = (value) => {
    return value.replace("%", "").trim();
  };
  
  const unformatMonths = (value) => {
    return value.replace("meses", "").trim();
  };
  
  const unformatNumber = (value) => {
    return value.replace(/,/g, "");
  };
  

  return (
    <div className="register-goal-container">
      <h2>Registrar Nueva Meta</h2>
      <div className="form-group">
        <label htmlFor="tipoMeta" className="tipo-meta-label">Selecciona el tipo de meta:</label>
        <br></br><br></br>
        <select
          id="tipoMeta"
          value={tipoMeta}
          onChange={(e) => setTipoMeta(e.target.value)}
          className="form-control"
        >
          <option value="">Seleccione un tipo</option>
          <option value="fija">Meta Fija</option>
          <option value="ahorro">Ahorro</option>
          <option value="deuda">Deuda</option>
        </select>
      </div>

      {tipoMeta === 'fija' && (
        <div id="form-meta-fija">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre de la Meta"
              value={goal.nombre}
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

            <small className="form-text text-muted">
              Selecciona la fecha en la que deseas comenzar a ahorrar para esta meta.
            </small>
            <input
              type="date"
              id="fechaInicio"
              name="fechaInicio"
              placeholder="Fecha de Inicio"
              value={goal.fechaInicio}
              onChange={handleChange}
              required
            />
            <small className="form-text text-muted">
              Selecciona un tipo de ahorro (En base a tus ingresos sobre tus gastos)
            </small>
            <select
              name="ahorroTipo"
              value={ahorroTipo}
              onChange={handleAhorroChange}
              required
            >
              <option value="">Selecciona un tipo de ahorro</option>
              <option value="Poco margen de ahorro">Poco margen de ahorro 10%</option>
              <option value="Ahorro recomendado">Ahorro (RECOMENDADO) 20%</option>
              <option value="Mega ahorro">Mega ahorro 30%</option>
              <option value="Ahorro personalizado">Ahorro personalizado</option>
            </select>
            {ahorroTipo === 'Ahorro personalizado' && (
              <input
                type="number"
                name="customPercentage"
                placeholder="Porcentaje Personalizado"
                value={customPercentage}
                onChange={handlePercentageChange}
                required
              />
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
      )}
      {tipoMeta === 'ahorro' && (
        <div id="form-meta-ahorro">
          <form onSubmit={(e) => {
            e.preventDefault();
            // Lógica para manejar el envío del formulario de ahorro fijo
            console.log('Ahorro registrado');
          }}>
            <input
              type="text"
              name="descripcion"
              placeholder="Descripción del Ahorro"
              value={goal.descripcion || ''}
              onChange={(e) => setGoal({ ...goal, descripcion: e.target.value })}
              required
            />
            <input
              type="number"
              name="tasaInteres"
              placeholder="Tasa de Interés (%)"
              value={goal.tasaInteres || ''}
              onChange={(e) => setGoal({ ...goal, tasaInteres: e.target.value })}
              required
            />
            <small className="form-text text-muted">
              Selecciona la fecha en la que deseas comenzar a ahorrar.
            </small>
            <input
              type="date"
              name="fechaInicio"
              value={goal.fechaInicio || ''}
              onChange={(e) => setGoal({ ...goal, fechaInicio: e.target.value })}
              required
            />

            {/* Check para abonar dinero al crear la meta */}
            <div className="form-group">
              <label htmlFor="descripcion" className="form-label">¿Gustas agregar dinero ahora?</label>
              <input
                type="checkbox"
                id="abonarDinero"
                name="abonarDinero"
                checked={goal.abonarDinero || false}
                onChange={(e) => setGoal({ ...goal, abonarDinero: e.target.checked })}
                className="form-control-checkbox"
              />
            </div>


            {/* Mostrar campo de monto actual solo si se selecciona el check */}
            {goal.abonarDinero && (
              <input
                type="number"
                name="montoActual"
                placeholder="Monto a Agregar"
                value={goal.montoActual || ''}
                onChange={(e) => setGoal({ ...goal, montoActual: e.target.value })}
                required
              />
            )}
            <button type="submit">Registrar Ahorro</button>
          </form>
        </div>
      )}
      {tipoMeta === 'deuda' && (
        <div id="form-meta-deuda">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log('Deuda registrada', deuda);
            }}
          >
            <div className="form-group">
            <small className="form-text text-muted">
              Selecciona la fecha de inicio de la deuda
            </small>
              <input
                type="date"
                name="fechaInicio"
                placeholder="Fecha de Inicio"
                value={deuda.fechaInicio || ''}
                onChange={(e) => setDeuda({ ...deuda, fechaInicio: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="descripcion"
                placeholder="Descripción de la Deuda"
                value={deuda.descripcion || ''}
                onChange={(e) => setDeuda({ ...deuda, descripcion: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="tasaInteres"
                placeholder="Tasa de interés (%)"
                value={deuda.tasaInteres || ""}
                onBlur={handleDeudaBlur}
                onChange={(e) =>
                  setDeuda((prev) => ({
                    ...prev,
                    tasaInteres: unformatPercentage(e.target.value),
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="plazo"
                placeholder="Plazo en meses"
                value={deuda.plazo || ""}
                onBlur={handleDeudaBlur}
                onChange={(e) =>
                  setDeuda((prev) => ({
                    ...prev,
                    plazo: unformatMonths(e.target.value),
                  }))
                }
                required
              />
            </div>


            <div className="form-group">
              <input
                type="text"
                name="montoDeuda"
                placeholder="Monto inicial (sin intereses)"
                value={deuda.montoDeuda || ""}
                onBlur={handleDeudaBlur}
                onChange={(e) =>
                  setDeuda((prev) => ({
                    ...prev,
                    montoDeuda: unformatNumber(e.target.value),
                  }))
                }
                required
              />
            </div>


            {/* Leyenda dinámica */}
            <div className="meta-info">
              <p>
                {leyendaDeuda.split("\n").map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
            </div>

            <button type="submit">Registrar Deuda</button>
          </form>
        </div>
      )}







    </div>
  );
};

export default RegisterGoal;
