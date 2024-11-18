import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProgresoMeta = ({ meta }) => {
  // Datos para el gráfico
  const data = [
    {
      name: 'Progreso',
      Ahorrado: meta.MontoAhorrado || 0,
      'Monto Objetivo': (meta.MontoObjetivo || 0) - (meta.MontoAhorrado || 0),
    },
  ];

  // Depuración: Verificar datos de entrada
  console.log('Datos para el gráfico:', data);

  return (
    <div className="progreso-meta-container">
      <h3>{meta.Nombre}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" />
          <Tooltip />
          <Legend />
          <Bar dataKey="Ahorrado" fill="#8884d8" />
          <Bar dataKey="Monto Objetivo" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgresoMeta;
