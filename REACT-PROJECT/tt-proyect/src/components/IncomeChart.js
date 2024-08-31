import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Importación correcta
import '../styles/IncomeChart.css'; 
import FilterModal from './FilterModal'; 
import { useNavigate } from 'react-router-dom';

// Registra los componentes necesarios
Chart.register(ArcElement, Tooltip, Legend);

const IncomeChart = () => {
  const [chartData, setChartData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({}); // Mantener los filtros actuales
  const navigate = useNavigate();

  const fetchData = async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/'); // Redirigir al login si no hay token
        return;
      }

      const decodedToken = jwtDecode(token);
      const userID = localStorage.getItem('userID');

      // Verificar si el token ha expirado
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.clear(); // Limpiar almacenamiento local si el token ha expirado
        navigate('/'); // Redirigir al login
        return;
      }

      const response = await axios.post('http://127.0.0.1:5000/api/income/filtered', 
      {
        user_id: userID,
        ...filters, // Aplicar filtros si se proporcionan
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`, // Agregar el token en los headers
          'Content-Type': 'application/json'
        }
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
      if (error.response && error.response.status === 401) {
        // Si el backend devuelve un 401, el token es inválido o ha expirado
        localStorage.clear();
        navigate('/'); // Redirigir al login
      }
    }
  };

  useEffect(() => {
    fetchData(); // Cargar datos inicialmente sin filtros
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
