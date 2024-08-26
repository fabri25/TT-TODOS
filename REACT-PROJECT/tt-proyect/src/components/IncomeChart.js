import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import '../styles/IncomeChart.css'; 
import FilterModal from './FilterModal'; 

// Registra los componentes necesarios
Chart.register(ArcElement, Tooltip, Legend);

const IncomeChart = () => {
  const [chartData, setChartData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({}); // Mantener los filtros actuales

  const fetchData = async (filters = {}) => {
    try {
      const userID = localStorage.getItem('userID'); // Obtener el ID del usuario
      const response = await axios.post('http://127.0.0.1:5000/api/income/filtered', {
        user_id: userID,
        ...filters, // Aplicar filtros si se proporcionan
      });

      const incomeData = response.data;

      const data = {
        labels: incomeData.map(item => item.Descripcion),
        datasets: [
          {
            label: 'Tus ingresos',
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

  useEffect(() => {
    fetchData(); // Cargar datos inicialmente sin filtros
  }, []);

  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters); // Guardar los filtros aplicados
    fetchData(filters); // Aplicar filtros y actualizar la gráfica
    setShowFilterModal(false); // Cerrar la ventana de filtros después de aplicar
  };

  const handleClearFilters = () => {
    setCurrentFilters({}); // Restablecer los filtros
    fetchData(); // Restablecer los datos sin filtros
    setShowFilterModal(false); // Cerrar la ventana de filtros después de limpiar
  };

  return (
    <div className="income-chart-container">
      <h2 className="income-chart-title">Tus Finanzas</h2>
      <hr className="income-chart-divider" />
      <br></br>
      <div className="income-chart-content">
        <h3 className="income-chart-subtitle">Tus Ingresos</h3> {/* Subtítulo centrado */}
        <button 
          className="btn btn-outline-secondary filter-button" 
          onClick={() => setShowFilterModal(true)}
        >
          <i className="bi bi-filter"></i> Filtrar
        </button>
        <div className="income-chart">
          {chartData && chartData.labels && chartData.labels.length > 0 ? (
            <Pie data={chartData} width={300} />
          ) : (
            <p>No hay datos disponibles para mostrar.</p>
          )}
        </div>
      </div>

      {showFilterModal && (
        <FilterModal
          initialFilters={currentFilters} // Pasar los filtros actuales como iniciales
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
};

export default IncomeChart;
