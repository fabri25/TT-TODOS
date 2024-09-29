import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import FilterModal from './FilterModal';
import AddIncomeModal from './AddIncomeModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/IncomeDashboard.css';
import CustomToolbar from './CustomToolbar'; // Importa el nuevo componente

// Registra los componentes de Chart.js
Chart.register(ArcElement, Tooltip, Legend);

const localizer = momentLocalizer(moment);

const IncomeDashboard = () => {
  const [ingresos, setIngresos] = useState([]);
  const [events, setEvents] = useState([]); // Estado para manejar los eventos del calendario
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false); // Nuevo estado para mostrar el modal de eventos
  const [selectedIncome, setSelectedIncome] = useState(null); // Guardar el ingreso seleccionado
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [chartData, setChartData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const navigate = useNavigate();

  // Función para transformar los ingresos en eventos de calendario
  const transformIngresosToEvents = (ingresos) => {
    return ingresos.map(ingreso => {
      const fecha = new Date(ingreso.Fecha);
      
      // Sumar 1 día para corregir el desplazamiento
      fecha.setDate(fecha.getDate() + 1);
  
      return {
        title: ingreso.Descripcion, // Solo mostrar la descripción del ingreso
        start: fecha, // Usar la fecha corregida
        end: fecha, // Usar la misma fecha como fin (es un evento de un solo día)
        allDay: true, // Marcar como evento de todo el día
        ingresoId: ingreso.ID_Ingreso, // Guardar el ID del ingreso en el evento
      };
    });
  };

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

      // Obtener ingresos
      const response = await axios.get('http://127.0.0.1:5000/api/user/incomes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ingresosData = response.data;
      setIngresos(ingresosData);

      // Transformar los ingresos en eventos de calendario
      const events = transformIngresosToEvents(ingresosData);
      setEvents(events); // Establecer los eventos para el calendario

      // Obtener datos para la gráfica
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
  }, [navigate]);

  useEffect(() => {
    fetchIngresos();
  }, [fetchIngresos]);

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

  const handleEdit = (idIngreso) => {
    navigate(`/dashboard/edit-income/${idIngreso}`);
  };

  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters);
    fetchIngresos(filters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    fetchIngresos();
    setShowFilterModal(false);
  };

  // Manejar la selección de un evento (ingreso)
  const handleEventSelect = (event) => {
    setSelectedIncome(event.ingresoId); // Guardar el ingreso seleccionado
    setShowEventModal(true); // Mostrar el modal con las opciones de editar/eliminar
  };

  return (
    <div className="income-dashboard-container">
      <h2 className="income-dashboard-title">Tus Ingresos</h2>

      {/* Sección de la gráfica y el calendario */}
      <div className="income-chart-section">
        <div className="chart-and-buttons">
          {/* Gráfica */}
          <div className="income-chart">
            {chartData && chartData.labels && chartData.labels.length > 0 ? (
              <Pie data={chartData} width={300} height={300} />
            ) : (
              <p>No hay datos disponibles para mostrar.</p>
            )}
          </div>

          {/* Botones de Filtrar y Agregar Ingreso */}
          <div className="button-group">
            <button 
              className="btn btn-outline-secondary filter-button" 
              onClick={() => setShowFilterModal(true)}
            >
              <i className="bi bi-filter"></i> Filtrar
            </button>

            {/* Botón para agregar ingresos */}
            <button
              className="btn btn-primary add-income-button"
              onClick={() => navigate('/dashboard/add-income')}
            >
              <i className="bi bi-plus"></i> Agregar Ingreso
            </button>
          </div>

          {/* Calendario con eventos */}
          <div className="income-calendar">
            <Calendar
              localizer={localizer}
              events={events} // Pasar los eventos (ingresos) al calendario
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, width: 700 }}
              components={{
                toolbar: CustomToolbar, // Usa el nuevo toolbar
              }}
              onSelectEvent={handleEventSelect} // Detectar cuando se selecciona un evento
            />
          </div>
        </div>
      </div>

      {/* Modal para editar/eliminar el ingreso seleccionado */}
      {showEventModal && selectedIncome && (
        <div className="event-modal">
          <h4>Opciones para el ingreso seleccionado</h4>
          <button 
            className="btn btn-warning" 
            onClick={() => handleEdit(selectedIncome)}
          >
            Editar
          </button>
          <button 
            className="btn btn-danger" 
            onClick={() => handleDelete(selectedIncome)}
          >
            Eliminar
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowEventModal(false)}
          >
            Cerrar
          </button>
        </div>
      )}

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
              <th>Periódico/Único</th>
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
                <td>{ingreso.TipoPeriodico}</td>
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

      {showAddIncomeModal && (
        <AddIncomeModal
          onClose={() => setShowAddIncomeModal(false)}
          onSave={() => {
            fetchIngresos();
            setShowAddIncomeModal(false);
          }}
        />
      )}
    </div>
  );
};

export default IncomeDashboard;
