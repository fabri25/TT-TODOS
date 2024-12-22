import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../styles/FloatingTab.css';
import { useNavigate } from 'react-router-dom';

const FloatingTabFixedIncome = ({
  onSave,
  descripcionIngreso,
  fechaUltimoIngreso,
  fechaTerminoPeriodoFijo, // Nueva fecha límite pasada como prop
  periodicidad,
}) => {
  const [amount, setAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Inicializar el monto desde el localStorage o establecer uno por defecto
    const initialAmount = localStorage.getItem('montoIngresoFijo') || '0';
    setAmount(initialAmount);

    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
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
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const decodedToken = jwtDecode(token);

    if (decodedToken.exp * 1000 < Date.now()) {
      localStorage.clear();
      navigate('/');
      return;
    }

    const userID = localStorage.getItem('userID');

    if (amount) {
      try {
        // Solicitud al endpoint
        const response = await axios.post(
          'http://127.0.0.1:5000/api/ingreso',
          {
            id_usuario: userID,
            monto: amount,
            descripcion: descripcionIngreso,
            periodicidad: periodicidad,
            esFijo: true, // Indicamos que es un ingreso fijo
            es_periodico: true, // Indicamos que es periódico
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Respuesta del servidor:', response.data.message);

        if (onSave) {
          onSave(); // Cerrar modal después de guardar
        }

        window.location.reload();
      } catch (error) {
        console.error('Error al procesar el ingreso:', error.response?.data || error);
        alert('Hubo un error al procesar el ingreso. Inténtalo nuevamente.');
      }
    } else {
      alert('Debe ingresar un monto válido.');
    }
  };

  useEffect(() => {
    console.log("Prop fechaTerminoPeriodoFijo recibida:", fechaTerminoPeriodoFijo);
    console.log("Prop fechaUltimoIngreso recibida:", fechaUltimoIngreso);
  }, [fechaTerminoPeriodoFijo, fechaUltimoIngreso]);
  

  const handleConfirm = async () => {
    await handleSave(); // Confirmar y guardar ingreso
  };

  const handleReject = () => {
    if (onSave) {
      onSave(); // Cerrar modal tras rechazar
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing); // Cambiar entre modo edición y vista
  };

  return (
    <div className="floating-tab-backdrop">
      <div className="floating-tab">
        <h4>
          ¿Recibiste este ingreso ({descripcionIngreso}) el{' '}
          {fechaTerminoPeriodoFijo}?
        </h4>
        <p>Última captura de ingresos: {fechaUltimoIngreso}</p>
        {!isEditing ? (
          <p>Monto recibido: {formatAmount(amount)}</p>
        ) : (
          <div className="form-group input-group">
            <span className="input-group-text">$</span>
            <input
              type="text"
              className="form-control"
              placeholder="Editar ingreso"
              value={amount}
              onChange={handleAmountChange}
            />
          </div>
        )}
        <div className="button-group-horizontal">
          {!isEditing && (
            <button
              type="button"
              className="btn btn-success custom-btn"
              onClick={handleConfirm}
            >
              Confirmar
            </button>
          )}
          <button
            type="button"
            className="btn btn-warning custom-btn"
            onClick={toggleEdit}
          >
            {isEditing ? 'Guardar' : 'Editar Monto'}
          </button>
          {!isEditing && (
            <button
              type="button"
              className="btn btn-danger custom-btn"
              onClick={handleReject}
            >
              Rechazar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatingTabFixedIncome;
