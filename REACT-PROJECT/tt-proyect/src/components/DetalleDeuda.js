import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/DetalleMeta.css'; // Usa el CSS existente para estilos
import coinGif from '../assets/images/coin.gif';

const DetalleDeuda = () => {
  const { idDeuda } = useParams();
  const [deuda, setDeuda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeuda();
  }, []);

  const fetchDeuda = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:5000/api/deudas/${idDeuda}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeuda(response.data);
    } catch (error) {
      console.error('Error al obtener el detalle de la deuda:', error);
      setError('Error al cargar la información de la deuda');
    }
    setLoading(false);
  };

  const handlePayCuota = async (idCuota) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://127.0.0.1:5000/api/deudas/cuotas/${idCuota}/pagar`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDeuda(); // Refresca los datos después del pago
    } catch (error) {
      console.error('Error al pagar la cuota:', error);
      setError('No se pudo completar el pago. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="detalle-meta-container">
      {loading ? (
        <div className="overlay">
          <div className="loading-message">
            Cargando deuda... <br />
            <img src={coinGif} alt="Cargando..." className="loading-image" />
          </div>
        </div>
      ) : deuda ? (
        <>
          <h2>{deuda.Descripcion}</h2>
          <p>
            <strong>Monto Inicial:</strong>{' '}
            {parseFloat(deuda.Monto_Deuda).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </p>
          <p>
            <strong>Monto Total:</strong>{' '}
            {parseFloat(deuda.Monto_Total).toLocaleString('es-MX', {
              style: 'currency',
              currency: 'MXN',
            })}
          </p>
          <p>
            <strong>Tasa de Interés:</strong> {deuda.Tasa_Interes}%
          </p>
          <p>
            <strong>Plazo:</strong> {deuda.Plazo} meses
          </p>
          <p>
            <strong>Fecha de Inicio:</strong>{' '}
            {new Date(deuda.Fecha_Inicio).toLocaleDateString()}
          </p>

          <h3>Cuotas</h3>
          <table className="transacciones-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Monto</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {deuda.Cuotas.map((cuota, index) => (
                <tr key={cuota.ID_Deuda_Cuota}>
                  <td>{index + 1}</td>
                  <td>
                    {parseFloat(cuota.Cuota).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </td>
                  <td>{new Date(cuota.Fecha_Limite).toLocaleDateString()}</td>
                  <td>{cuota.Estado}</td>
                  <td className="table-cell-center">
                    {cuota.Estado === 'Pendiente' ? (
                        <button
                        className="action-button pay-button-yellow"
                        onClick={() => handlePayCuota(cuota.ID_Deuda_Cuota)}
                        >
                        Pagar
                        </button>
                    ) : (
                        <span className="paid-label">Pagado</span>
                    )}
                    </td>


                </tr>
              ))}
            </tbody>
          </table>
          {error && <p className="error">{error}</p>}
        </>
      ) : (
        <p>No se encontró la deuda.</p>
      )}
    </div>
  );
};

export default DetalleDeuda;
