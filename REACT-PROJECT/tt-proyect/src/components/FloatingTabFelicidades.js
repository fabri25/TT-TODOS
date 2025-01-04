import React, { useEffect } from 'react';
import '../styles/FloatingTab.css'; // Usa el mismo CSS que los demás
import { useNavigate } from 'react-router-dom';

const FloatingTabFelicidades = ({ descripcionDeuda, onClose }) => {
  const navigate = useNavigate();

  // Debugging para verificar los props recibidos
  useEffect(() => {
    console.log('Datos recibidos en FloatingTabFelicidades:');
    console.log('Descripción de la deuda:', descripcionDeuda);
  }, [descripcionDeuda]);

  const handleAceptar = () => {
    navigate(`/dashboard/deudas`); // Redirige a la tabla de deudas
    onClose(); // Cerrar la ventana flotante
  };

  return (
    <div className="floating-tab-backdrop">
      <div className="floating-tab">
        <h4>🎉 ¡Felicidades, terminaste de pagar tu deuda! 🎉</h4>
        <p>
          <strong>Descripción de la deuda:</strong> {descripcionDeuda || 'No disponible'}
        </p>
        <div className="button-group-horizontal">
          <button
            type="button"
            className="btn btn-success custom-btn"
            onClick={handleAceptar}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingTabFelicidades;
