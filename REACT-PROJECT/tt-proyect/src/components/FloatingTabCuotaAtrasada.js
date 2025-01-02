import React, { useState } from 'react';
import '../styles/FloatingTab.css';

const FloatingTabCuotaAtrasada = ({ cuota, onClose, onPay }) => {
  const [amount, setAmount] = useState(cuota.Cuota);

  const handleConfirm = async () => {
    try {
      await onPay(cuota.ID_Deuda_Cuota, amount); // Confirmar el pago con el monto ajustado
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error al realizar el pago:', error);
    }
  };

  const handleCancel = () => {
    onClose(); // Cerrar modal
  };

  return (
    <div className="floating-tab-backdrop">
      <div className="floating-tab">
        <h4>
          ¿Realizaste el pago normal de esta cuota (#{cuota.ID_Deuda_Cuota}) con fecha límite{' '}
          {new Date(cuota.Fecha_Limite).toLocaleDateString()}?
        </h4>
        <p>Cuota normal: {parseFloat(cuota.Cuota).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
        <p>En caso contrario, modifica la cantidad:</p>
        <div className="form-group input-group">
          <span className="input-group-text">$</span>
          <input
            type="number"
            className="form-control"
            placeholder="Editar monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="button-group-horizontal">
          <button type="button" className="btn btn-success custom-btn" onClick={handleConfirm}>
            Confirmar
          </button>
          <button type="button" className="btn btn-danger custom-btn" onClick={handleCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingTabCuotaAtrasada;
