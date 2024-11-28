import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import FilterModal from './FilterModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/ExpenseDashboard.css';
import CustomToolbar from './CustomToolbar';

Chart.register(ArcElement, Tooltip, Legend);

const localizer = momentLocalizer(moment);

const ExpenseDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [chartData, setChartData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const transformExpensesToEvents = (expenses) => {
    return expenses.map((expense) => {
      const fecha = new Date(expense.Fecha);
      fecha.setDate(fecha.getDate() + 1);

      return {
        id: expense.ID_Gasto,
        title: expense.Descripcion,
        start: fecha,
        end: fecha,
        allDay: true,
      };
    });
  };

  const fetchExpenses = useCallback(async (filters = {}) => {
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

      const response = await axios.get('http://127.0.0.1:5000/api/user/gastos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const expensesData = response.data;
      setExpenses(expensesData);

      const events = transformExpensesToEvents(expensesData);
      setEvents(events);

      const chartResponse = await axios.post(
        'http://127.0.0.1:5000/api/gasto/filtered',
        {
          user_id: userID,
          ...filters,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const expenseData = chartResponse.data;
      const data = {
        labels: expenseData.map((item) => item.Descripcion),
        datasets: [
          {
            label: 'Tus gastos',
            data: expenseData.map((item) => item.Monto),
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
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = (id) => {
    setExpenseToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:5000/api/gasto/${expenseToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(expenses.filter((expense) => expense.ID_Gasto !== expenseToDelete));
      setShowModal(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error al eliminar el gasto', error);
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setExpenseToDelete(null);
  };

  const handleEdit = (idGasto) => {
    navigate(`/dashboard/edit-expense/${idGasto}`);

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
    fetchExpenses(filters);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    fetchExpenses();
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
    navigate('/dashboard/add-expense', { state: { selectedDate } });
    setPopoverPosition(null);
  };

  return (
    <div className="expense-dashboard-container">
      <h2 className="expense-dashboard-title">Tus Gastos</h2>

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
              onClick={() => navigate('/dashboard/add-expense')}
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

          {selectedExpense && popoverPosition && (
            <div
              className="event-popover"
              style={{
                position: 'absolute',
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                padding: '10px',
                zIndex: 100,
              }}
            >
              <button
                className="btn btn-warning btn-sm"
                onClick={() => handleEdit(selectedExpense)}
              >
                Editar
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(selectedExpense)}
              >
                Eliminar
              </button>
              <button className="btn btn-secondary btn-sm" onClick={closePopover}>
                Cerrar
              </button>
            </div>
          )}

          {selectedDate && popoverPosition && (
            <div
              className="event-popover"
              style={{
                position: 'absolute',
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                padding: '10px',
                zIndex: 100,
              }}
            >
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddExpenseClick}
                
              >
                Agregar Gasto
              </button>
              <button className="btn btn-secondary btn-sm" onClick={closePopover}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="expense-list-section">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Categoría</th>
              <th>Subcategoría</th>
              <th>Periodicidad</th>
              <th>Es Único</th> {/* Cambiar a "Es Único" */}
              <th>Fecha</th>
              <th>Periódico/Único</th>
              <th>Editar</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.ID_Gasto}>
                <td>{expense.Descripcion}</td>
                <td>{expense.Monto}</td>
                <td>{expense.Categoria}</td>
                <td>{expense.Subcategoria || "N/A"}</td>
                <td>{expense.Periodicidad || "N/A"}</td>
                <td>{expense.Periodico === 0 ? 'Sí' : 'No'}</td> {/* Mostrar "Sí" si es único */}
                <td>{new Date(expense.Fecha).toISOString().split('T')[0]}</td>
                <td>{expense.Periodico ? 'Periódico' : 'Único'}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleEdit(expense.ID_Gasto)}
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                </td>
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

export default ExpenseDashboard;
