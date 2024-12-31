import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/DetalleMeta.css';
import coinGif from '../assets/images/coin.gif';

const DetalleDeuda = () => {
  const { idDeuda } = useParams();
  const [deuda, setDeuda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [montoAbonar, setMontoAbonar] = useState('');
  const [nuevaCuota, setNuevaCuota] = useState(null);
  const [cuotasRestantes, setCuotasRestantes] = useState(null);

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

  const handleAbonar = async () => {
    if (!montoAbonar || parseFloat(montoAbonar) <= 0) {
      setError('El monto a abonar debe ser mayor a 0.');
      return;
    }
  
    const cuotasPagadas = deuda.Cuotas.filter((cuota) => cuota.Estado === 'Pagado');
    const ultimaCuotaPagada = cuotasPagadas[cuotasPagadas.length - 1];
    const saldoAnterior = ultimaCuotaPagada
      ? parseFloat(ultimaCuotaPagada.Saldo_Restante)
      : parseFloat(deuda.Monto_Total);
    const nuevoSaldo = saldoAnterior - parseFloat(montoAbonar);
  
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://127.0.0.1:5000/api/deudas/${idDeuda}/abonar`,
        {
          monto_abonado: parseFloat(montoAbonar),
          nueva_cuota: parseFloat(nuevaCuota),
          saldo_anterior: saldoAnterior,
          nuevo_saldo: nuevoSaldo,
          tasa_interes: deuda.Tasa_Interes // Enviamos la tasa de interés
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      alert('Abono realizado exitosamente.');
      setMontoAbonar('');
      fetchDeuda(); // Actualiza la información después del abono
    } catch (error) {
      console.error('Error al realizar el abono:', error);
      setError('No se pudo realizar el abono. Por favor, intenta de nuevo.');
    }
  };
  

  const calcularNuevaCuota = () => {
    if (!deuda || !deuda.Cuotas) return;
  
    const cuotasPagadas = deuda.Cuotas.filter((cuota) => cuota.Estado === 'Pagado');
    const ultimaCuotaPagada = cuotasPagadas[cuotasPagadas.length - 1];
    const saldoRestante = ultimaCuotaPagada ? parseFloat(ultimaCuotaPagada.Saldo_Restante) : parseFloat(deuda.Monto_Total);
    const cuotasPendientes = deuda.Cuotas.length - cuotasPagadas.length;
  
    console.log("Saldo restante previo al abono:", saldoRestante);
    console.log("Cuotas pendientes:", cuotasPendientes);
    console.log("Monto abonado:", montoAbonar);
  
    if (cuotasPendientes > 0 && montoAbonar > 0) {
      const nuevoSaldo = saldoRestante - parseFloat(montoAbonar);
      const tasaMensual = deuda.Tasa_Interes / 100 / 12; // Tasa de interés mensual
      const nuevaCuotaCalculada = 
        (tasaMensual * nuevoSaldo) / (1 - Math.pow(1 + tasaMensual, -cuotasPendientes));
  
      console.log("Nuevo saldo después del abono:", nuevoSaldo);
      console.log("Nueva cuota calculada:", nuevaCuotaCalculada);
  
      setNuevaCuota(nuevaCuotaCalculada.toFixed(2));
      setCuotasRestantes(cuotasPendientes);
    } else {
      setNuevaCuota(null);
      setCuotasRestantes(null);
    }
  };
  

  useEffect(() => {
    calcularNuevaCuota();
  }, [montoAbonar, deuda]);

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
            <strong>Tasa de Interés:</strong>{' '}
            {parseFloat(deuda.Tasa_Interes) === 0
              ? 'MSI'
              : `${parseFloat(deuda.Tasa_Interes).toFixed(2)}%`}
          </p>
          <p>
            <strong>Plazo:</strong> {deuda.Plazo} meses
          </p>
          <p>
            <strong>Fecha de Inicio:</strong>{' '}
            {new Date(deuda.Fecha_Inicio).toLocaleDateString()}
          </p>
          <br></br>

          <h3>Cuotas</h3>
          <table className="transacciones-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Monto</th>
                <th>Interés de la Cuota</th>
                <th>Capital Abonado</th>
                <th>Saldo Restante</th>
                <th>Fecha Límite</th>
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
                  <td>
                    {parseFloat(cuota.Interes_Cuota).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </td>
                  <td>
                    {parseFloat(cuota.Capital_Abonado).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </td>
                  <td>
                    {parseFloat(cuota.Saldo_Restante).toLocaleString('es-MX', {
                      style: 'currency',
                      currency: 'MXN',
                    })}
                  </td>
                  <td>{new Date(cuota.Fecha_Limite).toLocaleDateString()}</td>
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
          <br></br>
          <h4>Abonar a Capital</h4>
          <div className="form-group abonar-container">
            <label htmlFor="montoAbonar">Monto a Abonar:</label>
            <br></br>
            <input
              type="number"
              id="montoAbonar"
              value={montoAbonar}
              onChange={(e) => setMontoAbonar(e.target.value)}
              className="form-control"
            />
            <div className="abonar-button-container">
              <button onClick={handleAbonar} className="action-button pay-button-yellow">
                Realizar Abono
              </button>
            </div>
            {nuevaCuota && cuotasRestantes && (
              <p className="info-message">
                La nueva cuota será de{' '}
                {parseFloat(nuevaCuota).toLocaleString('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                })}{' '}
                MXN con {cuotasRestantes} cuotas restantes.
              </p>
            )}
          </div>
          {error && <p className="error-message">{error}</p>}
        </>
      ) : (
        <p>No se encontró la deuda.</p>
      )}
    </div>
  );
};

export default DetalleDeuda;
