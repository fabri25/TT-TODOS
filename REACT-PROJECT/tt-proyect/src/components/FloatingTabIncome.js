import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/FloatingTab.css';

const FloatingTabIncome = ({ onSave, descripcionIngreso, fechaUltimoIngreso }) => {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Elimina todo lo que no sea número
    setAmount(value);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = async () => {
    const userID = localStorage.getItem('userID'); // Obtener el ID del usuario desde el localStorage

    if (amount) {
      try {
        // Realizar la solicitud POST para actualizar el ingreso existente
        const response = await axios.post('http://127.0.0.1:5000/api/ingreso', {
          id_usuario: userID,
          monto: amount,
          descripcion: descripcionIngreso,
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Ingreso actualizado:', response.data.message);

        if (onSave) {
          onSave(); // Llamar a la función onSave después de guardar
        }
      } catch (error) {
        console.error('Error al actualizar el ingreso:', error);
        alert('Hubo un error al actualizar el ingreso. Inténtalo nuevamente.');
      }
    } else {
      alert('Debe ingresar un monto válido.');
    }
  };

  return (
    <div className="floating-tab-backdrop">
      <div className="floating-tab">
        <h4>Captura los ingresos de este periodo ({descripcionIngreso})</h4>
        <p>Última captura de ingresos: {fechaUltimoIngreso}</p>
        <div className="form-group input-group">
          <span className="input-group-text">$</span>
          <input
            type="text"
            className="form-control"
            placeholder="Ingreso"
            value={formatAmount(amount)}
            onChange={handleAmountChange}
          />
        </div>
        <button type="button" onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
};

export default FloatingTabIncome;
