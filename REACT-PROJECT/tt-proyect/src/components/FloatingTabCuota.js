import React, { useEffect } from 'react';
import '../styles/FloatingTab.css'; // Usa el mismo CSS que los demás
import { useNavigate } from 'react-router-dom';

const FloatingTabCuota = ({ descripcionDeuda, fechaLimite, monto, idCuota, onClose }) => {
  const navigate = useNavigate();

  // Debugging para verificar los props recibidos
  useEffect(() => {
    console.log('Datos recibidos en FloatingTabCuota:');
    console.log('Descripción de la deuda:', descripcionDeuda);
    console.log('Fecha límite:', fechaLimite);
    console.log('Monto:', monto);
    console.log('ID de la cuota:', idCuota);
  }, [descripcionDeuda, fechaLimite, monto, idCuota]);

  const handleIrPagar = () => {
    navigate(`/dashboard/deudas`); // Redirige a la tabla de cuotas
    onClose(); // Cerrar la ventana flotante
  };

  // Formatear la fecha al formato dd/mm/aaaa
  const formatFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    const date = new Date(fecha);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="floating-tab-backdrop">
      <div className="floating-tab">
        <h4>¡Tienes una cuota próxima a vencer!</h4>
        <p>
          <strong>Descripción de la deuda:</strong> {descripcionDeuda || 'No disponible'}
        </p>
        <p>
          <strong>Fecha límite de pago:</strong> {formatFecha(fechaLimite)}
        </p>
        <p>
          <strong>Monto:</strong>{' '}
          {monto !== undefined
            ? new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(monto)
            : 'No disponible'}
        </p>
        <div className="button-group-horizontal">
          <button
            type="button"
            className="btn btn-warning custom-btn"
            onClick={handleIrPagar}
          >
            Ir a pagar
          </button>
          <button
            type="button"
            className="btn btn-danger custom-btn"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingTabCuota;
