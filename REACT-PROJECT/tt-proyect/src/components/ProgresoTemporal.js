import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgresoTemporal = ({ transacciones }) => {
  // Datos para el gráfico de línea
  const data = transacciones ? transacciones.map(transaccion => ({
    fecha: new Date(transaccion.FechaTransaccion).toLocaleDateString(),
    montoAhorrado: transaccion.MontoAhorrado
  })) : [];

  return (
    <div className="progreso-temporal-container">
      <h3>Progreso Temporal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fecha" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="montoAhorrado" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgresoTemporal;
