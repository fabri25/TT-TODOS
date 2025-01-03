import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Importación de jwtDecode
import '../styles/FloatingTab.css';
import { useNavigate } from 'react-router-dom';

const FloatingTabIncome = ({ onSave, descripcionIngreso = '', fechaUltimoIngreso = '' }) => {
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

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
    }).format(amount || 0);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token'); // Obtener el token desde el localStorage

    if (!token) {
      navigate('/'); // Redirigir al login si no hay token
      return;
    }

    const decodedToken = jwtDecode(token);

    // Verificar si el token ha expirado
    if (decodedToken.exp * 1000 < Date.now()) {
      localStorage.clear(); // Limpiar almacenamiento local si el token ha expirado
      navigate('/'); // Redirigir al login
      return;
    }

    const userID = localStorage.getItem('userID'); // Obtener el ID del usuario desde el localStorage

    if (amount) {
      try {
        // Realizar la solicitud POST para agregar un nuevo ingreso con la misma descripción
        const response = await axios.post(
          'http://127.0.0.1:5000/api/ingreso',
          {
            id_usuario: userID,
            monto: parseFloat(amount), // Enviar el monto como número
            descripcion: descripcionIngreso, // Solo enviamos el monto y la descripción
          },
          {
            headers: {
              Authorization: `Bearer ${token}`, // Agregar el token en los headers
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Ingreso procesado:', response.data.message);

        if (onSave) {
          onSave(); // Llamar a la función onSave después de guardar
        }
        
      } catch (error) {
        console.error('Error al procesar el ingreso:', error);
        alert('Hubo un error al procesar el ingreso. Inténtalo nuevamente.');
      }
    } else {
      alert('Debe ingresar un monto válido.');
    }
  };

  return (
    <div className="floating-tab-backdrop">
      <div className="floating-tab">
        <h4>Captura los ingresos de este periodo ({descripcionIngreso || 'Sin descripción'})</h4>
        <p>Última captura de ingresos: {fechaUltimoIngreso || 'No disponible'}</p>
        <div className="form-group input-group">
          <span className="input-group-text">$</span>
          <input
            type="text"
            className="form-control"
            placeholder="Ingrese el monto"
            value={amount} // Mostrar el valor sin formatear mientras lo editas
            onChange={handleAmountChange}
          />
        </div>
        <p>Monto formateado: {formatAmount(amount)}</p>
        <button type="button" onClick={handleSave}>
          Guardar
        </button>
      </div>
    </div>
  );
};

export default FloatingTabIncome;
