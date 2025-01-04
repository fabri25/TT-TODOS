import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/DetalleMeta.css';
import coinGif from '../assets/images/coin.gif';
import FloatingTabCuotaAtrasada from './FloatingTabCuotaAtrasada'; // Ajusta la ruta según la ubicación del archivo
import { useCallback } from 'react';
import ConfirmationModal from './ConfirmationModal'; // Ajusta la ruta si es necesario
import FloatingTabFelicidades from './FloatingTabFelicidades'; // Importa el componente




const DetalleDeuda = () => {
  const { idDeuda } = useParams();
  const [deuda, setDeuda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [montoAbonar, setMontoAbonar] = useState('');
  const [nuevaCuota, setNuevaCuota] = useState(null);
  const [cuotasRestantes, setCuotasRestantes] = useState(null);
  const [showModal, setShowModal] = useState(false); // Estado para controlar el modal
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null); // Cuota seleccionada para el modal
  const [showFelicitationModal, setShowFelicitationModal] = useState(false); // Nuevo estado para la ventana de felicitación
  const [cuotasPendientes, setCuotasPendientes] = useState(0); // Cuotas pendientes
  
  

  const fetchDeuda = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:5000/api/deudas/${idDeuda}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeuda(response.data);
      // Actualizar el número de cuotas pendientes
      const cuotasPendientes = response.data.Cuotas.filter((cuota) => cuota.Estado === 'Pendiente').length;
      setCuotasPendientes(cuotasPendientes);

      // Mostrar en consola
      console.log(`Cuotas pendientes para la deuda ${idDeuda}: ${cuotasPendientes}`);
    } catch (error) {
      console.error('Error al obtener el detalle de la deuda:', error);
      setError('Error al cargar la información de la deuda');
    }
    setLoading(false);
  }, [idDeuda]); // Incluye solo las dependencias relevantes
  
  useEffect(() => {
    fetchDeuda();
  }, [fetchDeuda]); // Usa fetchDeuda como dependencia
  

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
      // Refrescar datos después del pago
      await fetchDeuda();

      // Verificar si ya no quedan cuotas pendientes
      if (cuotasPendientes === 1) {
        setShowFelicitationModal(true); // Mostrar felicitación
      }

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
  
    console.log('Nuevo saldo después del abono:', nuevoSaldo);
  
    try {
      const token = localStorage.getItem('token');
      console.log('Datos enviados al endpoint:', {
        monto_abonado: parseFloat(montoAbonar),
        nueva_cuota: parseFloat(nuevaCuota),
        saldo_anterior: saldoAnterior,
        nuevo_saldo: nuevoSaldo,
        tasa_interes: deuda.Tasa_Interes,
      });
  
      const response = await axios.post(
        `http://127.0.0.1:5000/api/deudas/${idDeuda}/abonar`,
        {
          monto_abonado: parseFloat(montoAbonar),
          nueva_cuota: parseFloat(nuevaCuota),
          saldo_anterior: saldoAnterior,
          nuevo_saldo: nuevoSaldo,
          tasa_interes: deuda.Tasa_Interes, // Enviamos la tasa de interés
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      console.log('Respuesta del servidor:', response.data);
  
      setMontoAbonar(''); // Limpia el campo de abono
      await fetchDeuda(); // Recarga la información de la deuda
  
      console.log('Estado de la deuda después de fetchDeuda:', deuda);
  
      // Verificar si la deuda se liquidó
      if (parseFloat(nuevaCuota) === 0) {
        console.log('Condición nuevaCuota === 0 cumplida. Deuda liquidada con abono.');
        setShowFelicitationModal(true);
      } else {
        // Verificar si todas las cuotas están marcadas como pagadas
        const todasPagadas = deuda.Cuotas.every((cuota) => cuota.Estado === 'Pagado');
        console.log('¿Todas las cuotas están pagadas?', todasPagadas);
  
        if (todasPagadas) {
          console.log('Todas las cuotas están marcadas como pagadas. Mostrando felicitaciones.');
          setShowFelicitationModal(true);
        } else {
          console.log('No se cumplen las condiciones para mostrar felicitaciones.');
        }
      }
    } catch (error) {
      console.error('Error al realizar el abono:', error);
      setError('No se pudo realizar el abono. Por favor, intenta de nuevo.');
    }
  };
  
  
  
  
  

  const isCuotaVencida = (fechaLimite) => {
    const hoy = new Date();
    const fechaLimiteDate = new Date(fechaLimite);
    if (fechaLimiteDate < hoy) {
      const diasAtraso = Math.floor((hoy - fechaLimiteDate) / (1000 * 60 * 60 * 24));
      return diasAtraso;
    }
    return 0; // No está vencida
  };

  const handleOpenModal = (cuota) => {
    setCuotaSeleccionada(cuota); // Guardar la cuota seleccionada
    setShowModal(true); // Mostrar el modal
  };

  const handleCloseModal = () => {
    setShowModal(false); // Cerrar el modal
    setCuotaSeleccionada(null); // Limpiar la cuota seleccionada
  };

  const handlePayAtrasada = async (idCuota, nuevoMonto) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://127.0.0.1:5000/api/deudas/cuotas/${idCuota}/pagar-atrasada`,
        {
          nuevoMonto: parseFloat(nuevoMonto),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDeuda(); // Recargar la información después del pago
    } catch (error) {
      console.error('Error al pagar la cuota atrasada:', error);
      setError('No se pudo completar el pago. Inténtalo de nuevo.');
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
          {deuda.Cuotas.some((cuota) => cuota.Dias_Atraso > 0 && cuota.Estado === 'Pendiente') && (
            <div className="error-message">
              {deuda.Cuotas.filter((cuota) => cuota.Dias_Atraso > 0 && cuota.Estado === 'Pendiente').map(
                (cuota, index) => (
                  <p key={index} className="error-message">
                    La cuota #{index + 1} está atrasada hace {cuota.Dias_Atraso} días. La fecha límite de pago fue{' '}
                    {new Date(cuota.Fecha_Limite).toLocaleDateString()}.
                  </p>
                )
              )}
            </div>
          )}

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
                {deuda.Cuotas.map((cuota, index) => {
                  const diasAtraso = isCuotaVencida(cuota.Fecha_Limite);
                  return (
                    <tr key={cuota.ID_Deuda_Cuota}>
                      <td>{index + 1}</td>
                      <td>
                        {parseFloat(cuota.Cuota).toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                      </td>
                      <td>
                        {parseFloat(cuota.Interes_Cuota).toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                      </td>
                      <td>
                        {parseFloat(cuota.Capital_Abonado).toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                      </td>
                      <td>
                        {parseFloat(cuota.Saldo_Restante).toLocaleString("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        })}
                      </td>
                      <td>{new Date(cuota.Fecha_Limite).toLocaleDateString()}</td>
                      <td className="table-cell-center">
                        {cuota.Estado === 'Pendiente' ? (
                          <button
                            className={`action-button ${diasAtraso > 0 ? 'pay-button-red' : 'pay-button-yellow'}`}
                            onClick={() =>
                              diasAtraso > 0 ? handleOpenModal(cuota) : handlePayCuota(cuota.ID_Deuda_Cuota)
                            }
                          >
                            {diasAtraso > 0 ? `Pagar (Vencida)` : `Pagar`}
                          </button>
                        ) : (
                          <span className="paid-label">Pagado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {showModal && cuotaSeleccionada && (
              <FloatingTabCuotaAtrasada
                cuota={cuotaSeleccionada}
                onClose={handleCloseModal}
                onPay={handlePayAtrasada}
              />
            )}


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
      {showFelicitationModal && (
        <div className="floating-tab-backdrop">
          <div className="floating-tab">
            <h4>¡Felicidades!</h4>
            <p>Has terminado de pagar tu deuda.</p>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setShowFelicitationModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default DetalleDeuda;
