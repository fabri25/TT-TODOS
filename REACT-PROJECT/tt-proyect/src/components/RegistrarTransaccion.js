import React, { useState } from 'react';
import axios from 'axios';

const RegistrarTransaccion = ({ idMeta, fetchMetas }) => {
  const [montoAhorrado, setMontoAhorrado] = useState('');
  const [fechaTransaccion, setFechaTransaccion] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        montoAhorrado,
        fechaTransaccion
      };
      await axios.post(`http://127.0.0.1:5000/api/metas/${idMeta}/transacciones`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setMontoAhorrado('');
      setFechaTransaccion('');
      fetchMetas(); // Actualizar la lista de metas después de registrar la transacción
    } catch (error) {
      console.error('Error al registrar la transacción', error);
      // Muestra un mensaje de error al usuario
      alert('Error al registrar la transacción. Por favor, intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Monto Ahorrado:</label>
        <input
          type="number"
          value={montoAhorrado}
          onChange={(e) => setMontoAhorrado(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Fecha de Transacción:</label>
        <input
          type="date"
          value={fechaTransaccion}
          onChange={(e) => setFechaTransaccion(e.target.value)}
          required
        />
      </div>
      <button type="submit">Registrar Transacción</button>
    </form>
  );
};

export default RegistrarTransaccion;
