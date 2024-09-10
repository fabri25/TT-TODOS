import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import FilterModal from './FilterModal'; // Importamos el modal de filtros
import AddIncomeModal from './AddIncomeModal'; // Importamos el modal para añadir ingresos
import '../styles/IncomeDashboard.css';

// Registra los componentes de Chart.js
Chart.register(ArcElement, Tooltip, Legend);

const IncomeDashboard = () => {
  const [ingresos, setIngresos] = useState([]);
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar la ventana modal
  const [incomeToDelete, setIncomeToDelete] = useState(null); // Estado para eliminar un ingreso
  const [chartData, setChartData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false); // Estado para mostrar el modal de filtros
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false); // Estado para mostrar el modal de agregar ingreso
  const [currentFilters, setCurrentFilters] = useState({});
  const navigate = useNavigate();

  // Función para obtener los ingresos
  const fetchIngresos = useCallback(async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
  
      const decodedToken = jwtDecode(token);
      const userID = localStorage.getItem('userID');
  
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.clear();
        navigate('/');
        return;
      }
  
      const response = await axios.get('http://127.0.0.1:5000/api/user/incomes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngresos(response.data);
  
      const chartResponse = await axios.post('http://127.0.0.1:5000/api/income/filtered', 
      {
        user_id: userID,
        ...filters,
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      const incomeData = chartResponse.data;
      const data = {
        labels: incomeData.map(item => item.Descripcion),
        datasets: [
          {
            label: 'Tus ingresos',
            data: incomeData.map(item => item.Monto),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          },
        ],
      };
      setChartData(data);
    } catch (error) {
      console.error('Error al obtener los datos', error);
    }
  }, [navigate]); // Ahora useCallback evitará la recreación de la función
  
  useEffect(() => {
    fetchIngresos();
  }, [fetchIngresos]);

  // Función para eliminar un ingreso
  const handleDelete = (id) => {
    setIncomeToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!incomeToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:5000/api/user/incomes/${incomeToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngresos(ingresos.filter((ingreso) => ingreso.ID_Ingreso !== incomeToDelete));
      setShowModal(false);
      setIncomeToDelete(null);
    } catch (error) {
      console.error('Error al eliminar el ingreso', error);
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setIncomeToDelete(null);
  };

  // Función para editar un ingreso
  const handleEdit = (idIngreso) => {
    navigate(`/dashboard/edit-income/${idIngreso}`);
  };

  // Funciones para manejar el modal de filtros
  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters);
    fetchIngresos(filters); // Aplicar filtros y actualizar los datos
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    fetchIngresos(); // Restablecer los datos sin filtros
    setShowFilterModal(false);
  };

  return (
    <div className="income-dashboard-container">
      <h2 className="income-dashboard-title">Tus Ingresos</h2>

      {/* Sección de la gráfica */}
      <div className="income-chart-section">
        <div className="button-group">
          <button 
            className="btn btn-outline-secondary filter-button" 
            onClick={() => setShowFilterModal(true)}
          >
            <i className="bi bi-filter"></i> Filtrar
          </button>

          {/* Botón para agregar ingresos */}
          <button
            className="btn btn-primary add-income-button" // Nueva clase para agregar estilos
            onClick={() => setShowAddIncomeModal(true)} // Mostrar el modal para agregar ingreso
          >
            <i className="bi bi-plus"></i> Agregar Ingreso
          </button>
        </div>

        <div className="income-chart">
          {chartData && chartData.labels && chartData.labels.length > 0 ? (
            <Pie data={chartData} width={300} height={300} />
          ) : (
            <p>No hay datos disponibles para mostrar.</p>
          )}
        </div>
      </div>

      {/* Sección de la tabla de ingresos */}
      <div className="income-list-section">
        <table className="income-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Periodicidad</th>
              <th>Es Fijo</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Editar</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {ingresos.map((ingreso) => (
              <tr key={ingreso.ID_Ingreso}>
                <td>{ingreso.Descripcion}</td>
                <td>{ingreso.Monto}</td>
                <td>{ingreso.Periodicidad}</td>
                <td>{ingreso.EsFijo ? 'Sí' : 'No'}</td>
                <td>{ingreso.Tipo}</td>
                <td>{new Date(ingreso.Fecha).toISOString().split('T')[0]}</td>
                <td>
                  <button className="btn btn-warning btn-sm" onClick={() => handleEdit(ingreso.ID_Ingreso)}>
                    <i className="bi bi-pencil-square"></i>
                  </button>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ingreso.ID_Ingreso)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ConfirmationModal
          message="¿Estás seguro de que deseas eliminar este ingreso?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {showFilterModal && (
        <FilterModal
          initialFilters={currentFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* Modal para agregar un ingreso */}
      {showAddIncomeModal && (
        <AddIncomeModal
          onClose={() => setShowAddIncomeModal(false)} // Cierra el modal
          onSave={() => {
            fetchIngresos(); // Actualizar la lista de ingresos después de agregar uno nuevo
            setShowAddIncomeModal(false); // Cierra el modal
          }}
        />
      )}
    </div>
  );
};

export default IncomeDashboard;
