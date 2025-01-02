import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/RegisterGoal.css';
import ConfirmationModal from './ConfirmationModal'; // Ajusta la ruta si es necesario


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
  const [showModal, setShowModal] = useState(false); // Controla el modal
  const [confirmationMessage, setConfirmationMessage] = useState(''); // Mensaje del modal
  const [onConfirmAction, setOnConfirmAction] = useState(null); // Acción en confirmación


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
    plazo: '',
    cuotaMensual: '', // Agregamos cuota mensual
    totalAPagar: ''   // Agregamos total a pagar
  });

  const [leyendaDeuda, setLeyendaDeuda] = useState(''); // Leyenda dinámica

  const handleDeudaBlur = (e) => {
    const { name, value } = e.target;
  
    // Eliminar el formato del valor ingresado
    let formattedValue = value;
    let rawValue = value;
  
    if (name === "tasaInteres" && !deuda.msi) {
      rawValue = unformatPercentage(value);
      formattedValue = formatPercentage(rawValue);
    } else if (name === "plazo") {
      rawValue = unformatMonths(value);
      formattedValue = formatMonths(rawValue);
    } else if (name === "montoDeuda" || name === "montoTotal") {
      rawValue = unformatNumber(value);
      formattedValue = formatNumber(rawValue);
    }
  
    // Actualizar estado con el valor formateado
    setDeuda((prev) => {
      const updatedDeuda = { ...prev, [name]: formattedValue };
  
      // Usar valores sin formato para los cálculos
      const deudaSinFormato = {
        ...updatedDeuda,
        [name]: rawValue,
      };
  
      // Recalcular si los campos afectan los cálculos
      if (["montoDeuda", "montoTotal", "tasaInteres", "plazo"].includes(name)) {
        setTimeout(() => calcularCuotaIntereses(deudaSinFormato), 0);
      }
  
      return updatedDeuda;
    });
  };
  
  const calcularCuotaIntereses = (deudaSinFormato = deuda) => {
    // Usar valores desformateados para cálculos
    const { msi, montoDeuda, tasaInteres, plazo } = deudaSinFormato;
  
    if (msi) {
      // Cálculo de MSI: cuota = monto inicial / plazo
      const montoInicial = parseFloat(montoDeuda) || 0;
      const n = parseInt(plazo) || 0;
  
      if (!n || !montoInicial) {
        setLeyendaDeuda("Datos incompletos para calcular cuota a MSI.");
        return;
      }
  
      const cuotaMensual = montoInicial / n;
      setDeuda((prev) => ({
        ...prev,
        montoTotal: montoInicial.toFixed(2),
        cuotaMensual: cuotaMensual.toFixed(2),
      }));
  
      setLeyendaDeuda(`Cuota Mensual a MSI: ${formatNumber(cuotaMensual)} MXN`);
      return;
    }
  
    // Cálculo normal con intereses
    const tasaAnual = parseFloat(tasaInteres) / 100 || 0;
    const rMensual = tasaAnual / 12;
    const n = parseInt(plazo) || 0;
    const montoInicial = parseFloat(montoDeuda) || 0;
  
    if (!rMensual || !n || !montoInicial) {
      setLeyendaDeuda("Datos incompletos para calcular.");
      return;
    }
  
    const numerador = rMensual * montoInicial;
    const denominador = 1 - Math.pow(1 + rMensual, -n);
    const cuotaMensual = numerador / denominador;
    const totalAPagar = cuotaMensual * n;
    const interesesTotales = totalAPagar - montoInicial;
  
    setDeuda((prev) => ({
      ...prev,
      montoTotal: totalAPagar.toFixed(2),
      cuotaMensual: cuotaMensual.toFixed(2),
    }));
  
    setLeyendaDeuda(`
      Cuota Mensual: ${formatNumber(cuotaMensual)} MXN
      Total a Pagar: ${formatNumber(totalAPagar)} MXN
      Intereses Totales: ${formatNumber(interesesTotales)} MXN
    `);
  };
  
  
  
  const handleMsiChange = (e) => {
    const esMsi = e.target.checked;
  
    setDeuda((prev) => {
      const updatedDeuda = { ...prev, msi: esMsi };
  
      // Limpiar campos según el estado del MSI
      if (esMsi) {
        updatedDeuda.tasaInteres = "";
        updatedDeuda.montoTotal = "";
      } else {
        updatedDeuda.cuotaMensual = "";
      }
  
      return updatedDeuda;
    });
  
    // Recalcular después de limpiar campos
    setTimeout(() => calcularCuotaIntereses(), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setConfirmationMessage('¿Estás seguro de que deseas crear esta meta?');
    setOnConfirmAction(() => async () => {
        const token = localStorage.getItem('token');
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        try {
            if (tipoMeta === 'fija') {
                const data = {
                    nombre: goal.nombre,
                    montoObjetivo: goal.montoObjetivo,
                    fechaInicio: goal.fechaInicio,
                    mesesParaMeta,
                    fechaTermino,
                    ahorroMensual,
                };
                await axios.post('http://127.0.0.1:5000/api/metas', data, { headers });

                // Actualizar estado financiero
                await verificarEstadoFinanciero();

                navigate('/dashboard/metas-financieras');
            } else if (tipoMeta === 'ahorro') {
                const data = {
                    descripcion: goal.descripcion,
                    montoActual: goal.montoActual || 0.0,
                    fechaInicio: goal.fechaInicio,
                    tasaInteres: goal.tasaInteres,
                };
                await axios.post('http://127.0.0.1:5000/api/ahorro', data, { headers });

                // Actualizar estado financiero
                await verificarEstadoFinanciero();

                navigate('/dashboard/ahorros');
            } else if (tipoMeta === 'deuda') {
                const updatedDeuda = { ...deuda };

                if (!updatedDeuda.cuotaMensual) {
                    calcularCuotaIntereses();
                    return;
                }

                const tasaInteresFormateada = updatedDeuda.msi
                    ? '0.00'
                    : unformatPercentage(updatedDeuda.tasaInteres);

                const data = {
                    descripcion: updatedDeuda.descripcion,
                    montoDeuda: unformatCurrency(updatedDeuda.montoDeuda),
                    montoTotal: unformatCurrency(updatedDeuda.montoTotal),
                    tasaInteres: tasaInteresFormateada,
                    fechaInicio: updatedDeuda.fechaInicio,
                    cuotaMensual: unformatCurrency(updatedDeuda.cuotaMensual),
                    plazo: unformatMonths(updatedDeuda.plazo),
                };

                await axios.post('http://127.0.0.1:5000/api/deuda', data, { headers });

                // Actualizar estado financiero
                await verificarEstadoFinanciero();

                navigate('/dashboard/deudas');
            }
        } catch (error) {
            console.error('Error al guardar la meta', error);
        }
    });
    setShowModal(true);
};


const verificarEstadoFinanciero = async () => {
  try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:5000/api/estado-financiero', {
          headers: { Authorization: `Bearer ${token}` },
      });

      const { hasMetas, hasAhorros, hasDeudas } = response.data;

      // Actualizar localStorage
      localStorage.setItem('hasMetas', hasMetas);
      localStorage.setItem('hasAhorros', hasAhorros);
      localStorage.setItem('hasDeudas', hasDeudas);
  } catch (error) {
      console.error('Error al verificar estado financiero:', error);
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
  const unformatCurrency = (value) => {
    return value.replace(/\$/g, '').replace(/,/g, '').trim();
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
          <form onSubmit={handleSubmit}>
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
          <form onSubmit={handleSubmit}>
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

            {/* Check para MSI */}
            <div className="form-group">
              <label htmlFor="msi" className="form-label">
                Meses Sin Intereses (MSI)
              </label>
              <input
                type="checkbox"
                id="msi"
                name="msi"
                checked={deuda.msi || false}
                onChange={handleMsiChange}
                className="form-control-checkbox"
              />
            </div>

            {/* Campo de tasa de interés (oculto si MSI está seleccionado) */}
            {!deuda.msi && (
              <div className="form-group">
                <input
                  type="text"
                  name="tasaInteres"
                  placeholder="Tasa de interés (%)"
                  value={deuda.tasaInteres || ''}
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
            )}

            <div className="form-group">
              <input
                type="text"
                name="plazo"
                placeholder="Plazo en meses"
                value={deuda.plazo || ''}
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
                value={deuda.montoDeuda || ''}
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
                {leyendaDeuda.split('\n').map((line, index) => (
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
      {showModal && (
          <ConfirmationModal
              message={confirmationMessage}
              onConfirm={() => {
                  setShowModal(false);
                  if (onConfirmAction) onConfirmAction();
              }}
              onCancel={() => setShowModal(false)}
          />
      )}



    </div>
  );
};

export default RegisterGoal;
