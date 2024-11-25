import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import FilterModal from './FilterModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/ExpenseDashboard.css'; // Reutilizamos los estilos
import CustomToolbar from './CustomToolbar';

Chart.register(ArcElement, Tooltip, Legend);

const localizer = momentLocalizer(moment);

const GroupFinanceDashboard = () => {
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [chartData, setChartData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const navigate = useNavigate();
  const { grupoId } = useParams(); // Obtener el ID del grupo desde la URL

  const transformExpensesToEvents = (expenses) => {
    return expenses.map((expense) => {
      const fecha = new Date(expense.Fecha);
      return {
        id: expense.ID_Gasto,
        title: expense.Descripcion,
        start: fecha,
        end: fecha,
        allDay: true,
      };
    });
  };

  const fetchGroupInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`http://127.0.0.1:5000/api/grupo/${grupoId}/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupName(response.data.Nombre_Grupo || 'Grupo');
      setGroupDescription(response.data.Descripcion || 'Sin descripción');
    } catch (error) {
      console.error('Error al obtener la información del grupo:', error);
      navigate('/'); // Redirigir si hay un error crítico
    }
  }, [grupoId, navigate]);

  const fetchGroupExpenses = useCallback(async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`http://127.0.0.1:5000/api/grupo/${grupoId}/gastos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Mapear los datos a los nombres de campos esperados
      const expenses = response.data.map(expense => ({
        ID_Gasto: expense.ID_Gasto_Grupal, // Renombrar campo
        Descripcion: expense.Descripcion,
        Monto: expense.Monto,
        Fecha: expense.Fecha,
        Responsable: expense.Responsable, // Ahora obtenemos el campo directamente
        Estado: expense.Estado,
      }));

      setGroupExpenses(expenses);

      const events = transformExpensesToEvents(expenses);
      setEvents(events);
    } catch (error) {
      console.error('Error al obtener los datos del grupo:', error);
    }
  }, [navigate, grupoId]);

  const fetchChartData = useCallback(async (filters = {}) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        const response = await axios.post(
            `http://127.0.0.1:5000/api/grupo/${grupoId}/gastos/filtrados`,
            {
                ...filters, // Enviar filtros al backend
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const expenseData = response.data;

        const data = {
            labels: expenseData.map((item) => item.Descripcion),
            datasets: [
                {
                    label: 'Gastos del grupo',
                    data: expenseData.map((item) => item.Monto),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                },
            ],
        };

        setChartData(data);
    } catch (error) {
        console.error('Error al obtener los datos para la gráfica:', error);
    }
}, [grupoId, navigate]);

  useEffect(() => {
    fetchGroupInfo();
    fetchGroupExpenses();
    fetchChartData();
  }, [fetchGroupInfo, fetchGroupExpenses, fetchChartData]);

  const handleDelete = (id) => {
    setExpenseToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:5000/api/grupo/${grupoId}/gastos/${expenseToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupExpenses(groupExpenses.filter((expense) => expense.ID_Gasto !== expenseToDelete));
      setShowModal(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error al eliminar el gasto del grupo:', error);
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setExpenseToDelete(null);
  };

  const handleEdit = (idGasto) => {
    navigate(`/dashboard/grupo/${grupoId}/edit-expense/${idGasto}`);
  };

  const handleEventClick = (event, e) => {
    setSelectedExpense(event.id);
    setPopoverPosition({
      top: e.clientY,
      left: e.clientX,
    });
  };

  const closePopover = () => {
    setSelectedExpense(null);
    setPopoverPosition(null);
    setSelectedDate(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if ((selectedExpense || selectedDate) && !e.target.closest('.event-popover')) {
        closePopover();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedExpense, selectedDate]);

  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters);
    fetchGroupExpenses(filters);
    fetchChartData(); // Actualizar gráfica al aplicar filtros
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    fetchGroupExpenses();
    fetchChartData(); // Actualizar gráfica al limpiar filtros
    setShowFilterModal(false);
  };

  const handleDateClick = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setPopoverPosition({
      top: slotInfo.box.y,
      left: slotInfo.box.x,
    });
  };

  const handleAddExpenseClick = () => {
    navigate(`/dashboard/grupo/${grupoId}/add-expense`, { state: { selectedDate } });
    setPopoverPosition(null);
  };
  const handleViewGoals = () => {
    navigate(`/dashboard/grupo/${grupoId}/metas-grupales`); // Ruta para ver metas
  };

  return (
    <div className="expense-dashboard-container">
      <h2 className="expense-dashboard-title">{groupName}</h2>
      <p className="group-description">{groupDescription}</p>

      <div className="expense-chart-section">
        <div className="chart-and-buttons">
          <div className="expense-chart">
            {chartData && chartData.labels && chartData.labels.length > 0 ? (
              <Pie data={chartData} width={300} height={300} />
            ) : (
              <p>No hay datos disponibles para mostrar.</p>
            )}
          </div>

          <div className="button-group">
            <button
              className="btn btn-outline-secondary filter-button"
              onClick={() => setShowFilterModal(true)}
            >
              <i className="bi bi-filter"></i> Filtrar
            </button>

            <button
              className="btn btn-primary add-expense-button"
              onClick={() => navigate(`/dashboard/grupo/${grupoId}/add-expense`)}
            >
              <i className="bi bi-plus"></i> Agregar Gasto
            </button>
          </div>

          <div className="expense-calendar">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, width: 700 }}
              components={{
                toolbar: CustomToolbar,
              }}
              onSelectEvent={(event, e) => handleEventClick(event, e)}
              onSelectSlot={(slotInfo) => handleDateClick(slotInfo)}
              selectable
            />
          </div>
        </div>
      </div>
              {/* Botón centrado para "Ver Metas" */}
      <div className="view-goals-button-container" style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          className="btn btn-success"
          onClick={handleViewGoals}
        >
          Ver Metas
        </button>
      </div>

      <div className="expense-list-section">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {groupExpenses.map((expense) => (
              <tr key={expense.ID_Gasto}>
                <td>{expense.Descripcion}</td>
                <td>{expense.Monto}</td>
                <td>{expense.Responsable}</td>
                <td>{expense.Estado}</td>
                <td>{new Date(expense.Fecha).toISOString().split('T')[0]}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(expense.ID_Gasto)}
                  >
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
          message="¿Estás seguro de que deseas eliminar este gasto?"
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
    </div>
  );
};

export default GroupFinanceDashboard;
