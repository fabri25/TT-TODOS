import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/DetalleMeta.css';
import coinGif from '../assets/images/coin.gif';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DetalleMeta = () => {
  const { idMeta } = useParams();
  const [meta, setMeta] = useState(null);
  const [transaccion, setTransaccion] = useState({
    montoAhorrado: '',
    fechaTransaccion: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:5000/api/metas/${idMeta}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data) {
        setMeta({
          ...response.data,
          MontoAhorrado: parseFloat(response.data.MontoAhorrado) || 0,
        });
      } else {
        console.error('No se encontraron detalles para la meta');
      }
    } catch (error) {
      console.error('Error al obtener la meta', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const faltante = meta.MontoObjetivo - meta.MontoAhorrado;
    if (parseFloat(transaccion.montoAhorrado) > faltante) {
      setError('El monto no puede ser mayor al faltante para concluir la meta.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://127.0.0.1:5000/api/metas/${idMeta}/transacciones`,
        transaccion,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setTransaccion({ montoAhorrado: '', fechaTransaccion: '' });
      setError('');
      fetchMeta();
    } catch (error) {
      console.error('Error al registrar la transacción', error);
      setError('Error al registrar la transacción. Por favor, intenta de nuevo.');
    }
  };

  const calcularDatosGrafico = () => {
    if (!meta) return [];
  
    const fechaInicio = new Date(meta.FechaInicio);
    const fechaTermino = new Date(meta.FechaTermino);
    const ahorroMensual = parseFloat(meta.AhorroMensual);
    const montoObjetivo = parseFloat(meta.MontoObjetivo);
  
    // Generar datos de ahorro ideal por meses
    const datosIdeal = [];
    let acumuladoIdeal = 0;
    let fechaActual = new Date(fechaInicio);
  
    while (acumuladoIdeal < montoObjetivo && fechaActual <= fechaTermino) {
      datosIdeal.push({
        fecha: `${fechaActual.getFullYear()}-${fechaActual.getMonth() + 1}`, // Formato "YYYY-MM"
        ahorroIdeal: acumuladoIdeal,
      });
      acumuladoIdeal += ahorroMensual;
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }
  
    // Asegurarse de que el último punto no exceda el monto objetivo
    if (acumuladoIdeal >= montoObjetivo) {
      datosIdeal.push({
        fecha: `${fechaActual.getFullYear()}-${fechaActual.getMonth()}`, // Formato "YYYY-MM"
        ahorroIdeal: montoObjetivo,
      });
    }
  
    // Agrupar transacciones reales por mes
    const transaccionesPorMes = {};
    meta.transacciones.forEach((transaccion) => {
      const fecha = new Date(transaccion.FechaTransaccion);
      const mes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`; // Formato "YYYY-MM"
      if (!transaccionesPorMes[mes]) {
        transaccionesPorMes[mes] = 0;
      }
      transaccionesPorMes[mes] += parseFloat(transaccion.MontoAhorrado);
    });
  
    // Generar datos reales acumulados hasta el último mes registrado
    const datosReales = [];
    let acumuladoReal = 0;
    let ultimaFechaReal = '';
    Object.keys(transaccionesPorMes).forEach((mes) => {
      acumuladoReal += transaccionesPorMes[mes];
      ultimaFechaReal = mes;
      datosReales.push({
        fecha: mes,
        ahorroReal: acumuladoReal,
      });
    });
  
    // Asegurar que todos los meses desde el inicio hasta el final tengan datos
    const mesesGrafico = [];
    let fechaTemp = new Date(fechaInicio);
    while (fechaTemp <= fechaTermino) {
      mesesGrafico.push(`${fechaTemp.getFullYear()}-${fechaTemp.getMonth() + 1}`);
      fechaTemp.setMonth(fechaTemp.getMonth() + 1);
    }
  
    // Completar datos de ahorro real con valores anteriores si no hay transacción en ese mes
    let ultimoAhorroReal = 0;
  
    const datosFinales = mesesGrafico.map((mes, index) => {
      const datoIdeal = datosIdeal.find((dato) => dato.fecha === mes);
      const datoReal = datosReales.find((real) => real.fecha === mes);
  
      // Si no hay dato real para este mes, mantener el valor del último mes disponible
      if (datoReal) {
        ultimoAhorroReal = datoReal.ahorroReal;
      }
  
      // Asignar ahorro real: asegurar que el primer mes tenga siempre 0
      const esPrimerMes = mes === `${fechaInicio.getFullYear()}-${fechaInicio.getMonth() + 1}`;
      const ahorroReal = esPrimerMes ? 0 : ultimoAhorroReal;
  
      // Asignar ahorro ideal, garantizando que el último mes tenga el monto objetivo
      const esUltimoMes = index === mesesGrafico.length - 1;
      const ahorroIdeal = esUltimoMes
        ? montoObjetivo
        : (datoIdeal ? datoIdeal.ahorroIdeal : 0);
  
      return {
        fecha: mes,
        ahorroIdeal: ahorroIdeal,
        ahorroReal: ahorroReal,
      };
    });
  
    return datosFinales;
  };
  

  const data = meta
    ? meta.transacciones.map((transaccion) => ({
        fecha: new Date(transaccion.FechaTransaccion).toLocaleDateString(),
        montoAhorrado: parseFloat(transaccion.MontoAhorrado),
        ahorroMensual: parseFloat(meta.AhorroMensual), // Línea constante
      }))
    : [];

  const porcentajeCumplimiento = meta
    ? ((meta.MontoAhorrado || 0) / meta.MontoObjetivo) * 100
    : 0;

  const faltanteParaConcluir = meta
    ? meta.MontoObjetivo - meta.MontoAhorrado
    : 0;

  return (
    <div className="detalle-meta-container">
      {meta ? (
        <>
          <h2>{meta.Nombre}</h2>
          <p>
            <strong>Monto Objetivo:</strong>{' '}
            {parseFloat(meta.MontoObjetivo).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </p>
          <p>
            <strong>Fecha de Inicio:</strong>{' '}
            {new Date(meta.FechaInicio).toLocaleDateString()}
          </p>
          <p>
            <strong>Fecha de Término:</strong>{' '}
            {new Date(meta.FechaTermino).toLocaleDateString()}
          </p>
          <p>
            <strong>Ahorro Mensual:</strong>{' '}
            {parseFloat(meta.AhorroMensual).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </p>
          <p>
            <strong>Meses para Alcanzar:</strong> {meta.MesesParaMeta}
          </p>
          <p>
            <strong>Monto Ahorrado:</strong>{' '}
            {parseFloat(meta.MontoAhorrado).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </p>
          <p>
            <strong>Faltante para Concluir Meta:</strong>{' '}
            {parseFloat(faltanteParaConcluir).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </p>

          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${porcentajeCumplimiento}%` }}
              ></div>
              <div className="progress-text">
                {porcentajeCumplimiento.toFixed(2)}%
              </div>
            </div>
          </div>

          {porcentajeCumplimiento >= 100 ? (
            <p className="meta-completada">
              ¡Felicidades! Has alcanzado tu meta financiera.
            </p>
          ) : (
            <>
              <h3>Transacciones</h3>
              {meta.transacciones && meta.transacciones.length > 0 ? (
                <table className="transacciones-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta.transacciones.map((transaccion) => (
                      <tr key={transaccion.id}>
                        <td>
                          {new Date(transaccion.FechaTransaccion).toLocaleDateString()}
                        </td>
                        <td>
                          {parseFloat(transaccion.MontoAhorrado).toLocaleString('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No se han registrado transacciones aún.</p>
              )}

              <h3>Registrar Transacción</h3>
              <form onSubmit={handleSubmit}>
              
                <input
                  type="number"
                  id="montoAhorrado"
                  value={transaccion.montoAhorrado}
                  onChange={(e) =>
                    setTransaccion({
                      ...transaccion,
                      montoAhorrado: e.target.value,
                    })
                  }
                />
                
                <input
                  type="date"
                  id="fechaTransaccion"
                  value={transaccion.fechaTransaccion}
                  onChange={(e) =>
                    setTransaccion({
                      ...transaccion,
                      fechaTransaccion: e.target.value,
                    })
                  }
                />
                <button type="submit">Registrar</button>
              </form>
              {error && <p className="error">{error}</p>}
            </>
          )}

          <h3>Gráfico de Ahorro</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={calcularDatosGrafico()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="ahorroIdeal"
                stroke="#8884d8"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ahorroReal"
                stroke="#82ca9d"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="overlay">
    <div className="loading-message">
      Cargando meta... <br />
      <img src={coinGif} alt="Cargando..." className="loading-image" />
    </div>
  </div>
      )}
    </div>
  );
};

export default DetalleMeta;
