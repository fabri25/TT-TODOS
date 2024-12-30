import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
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

const DetalleAhorro = () => {
  const { idAhorro } = useParams();
  const [ahorro, setAhorro] = useState(null);
  const [abono, setAbono] = useState({ monto: '', fecha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAhorro();
  }, []);

  const fetchAhorro = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:5000/api/ahorro/${idAhorro}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAhorro(response.data);
    } catch (error) {
      console.error('Error al obtener el detalle del ahorro', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!abono.monto || !abono.fecha) {
      setError('Todos los campos son obligatorios');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://127.0.0.1:5000/api/ahorro/${idAhorro}/abonos`,
        { abono: abono.monto, fechaAbono: abono.fecha },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAbono({ monto: '', fecha: '' });
      setError('');
      fetchAhorro(); // Actualizar el estado del ahorro
    } catch (error) {
      console.error('Error al registrar el abono', error);
      setError('Error al registrar el abono');
    }
  };

  const calcularDatosGrafico = () => {
    if (!ahorro || !ahorro.Abonos) return [];

    const fechaInicio = new Date(ahorro.Fecha_Inicio);
    const fechaActual = new Date();

    // Agrupar los abonos por mes
    const abonosPorMes = {};
    ahorro.Abonos.forEach((abono) => {
      const fecha = new Date(abono.Fecha_Abono);
      const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      if (!abonosPorMes[mes]) {
        abonosPorMes[mes] = 0;
      }
      abonosPorMes[mes] += abono.Abono;
    });

    let acumulado = 0;
    const datos = [];

    // Generar puntos mensuales
    while (fechaInicio <= fechaActual) {
      const mes = `${fechaInicio.getFullYear()}-${(fechaInicio.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      acumulado += abonosPorMes[mes] || 0; // Sumar abonos del mes si existen
      datos.push({ fecha: mes, ahorro: acumulado });
      fechaInicio.setMonth(fechaInicio.getMonth() + 1); // Avanzar al siguiente mes
    }

    return datos;
  };

  return (
    <div className="detalle-meta-container">
      {loading ? (
        <div className="overlay">
          <div className="loading-message">
            Cargando ahorro... <br />
            <img src={coinGif} alt="Cargando..." className="loading-image" />
          </div>
        </div>
      ) : ahorro ? (
        <>
          <h2>{ahorro.Descripcion}</h2>
          <p>
            <strong>Monto Actual:</strong>{' '}
            {parseFloat(ahorro.Monto_Actual).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </p>
          <p>
            <strong>Fecha de Inicio:</strong>{' '}
            {new Date(ahorro.Fecha_Inicio).toLocaleDateString()}
          </p>
          <p>
            <strong>Tasa de Interés:</strong> {ahorro.Tasa_Interes}%
          </p>

          <h3>Abonos</h3>
          <table className="transacciones-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {ahorro.Abonos.map((abono) => (
                <tr key={abono.ID_Abono}>
                  <td>{new Date(abono.Fecha_Abono).toLocaleDateString()}</td>
                  <td>
                    {parseFloat(abono.Abono).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Registrar Abono</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="number"
              placeholder="Monto"
              value={abono.monto}
              onChange={(e) => setAbono({ ...abono, monto: e.target.value })}
            />
            <input
              type="date"
              value={abono.fecha}
              onChange={(e) => setAbono({ ...abono, fecha: e.target.value })}
            />
            <button type="submit">Registrar</button>
          </form>
          {error && <p className="error">{error}</p>}

          <h3>Gráfico de Ahorro</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={calcularDatosGrafico()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ahorro" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p>No se encontró el ahorro.</p>
      )}
    </div>
  );
};

export default DetalleAhorro;
