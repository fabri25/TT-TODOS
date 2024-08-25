import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';

const IncomeChart = () => {
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userID = localStorage.getItem('userID'); // Obtener el ID del usuario
        const response = await axios.post('http://127.0.0.1:5000/api/income/filtered', {
          user_id: userID,
          // Puedes pasar filtros predeterminados aquí, si lo deseas
        });

        const incomeData = response.data;

        // Transformar los datos para Chart.js
        const data = {
          labels: incomeData.map(item => item.Descripcion),
          datasets: [
            {
              label: 'Ingresos',
              data: incomeData.map(item => item.Monto),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'], // Colores de ejemplo
            },
          ],
        };

        setChartData(data);
      } catch (error) {
        console.error('Error al cargar los datos de la gráfica:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Distribución de Ingresos</h2>
      <Pie data={chartData} />
    </div>
  );
};

export default IncomeChart;
