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
import '../styles/IncomeDashboard.css';
import CustomToolbar from './CustomToolbar';

Chart.register(ArcElement, Tooltip, Legend);

const localizer = momentLocalizer(moment);

const IncomeDashboard = () => {
  const [ingresos, setIngresos] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [chartData, setChartData] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({});
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  // Función para transformar los ingresos en eventos de calendario
  const transformIngresosToEvents = (ingresos) => {
    return ingresos.map((ingreso) => {
      const fecha = new Date(ingreso.Fecha);
      fecha.setDate(fecha.getDate() + 1);

      return {
        id: ingreso.ID_Ingreso,
        title: ingreso.Descripcion,
        start: fecha,
        end: fecha,
        allDay: true,
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

      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.clear();
        navigate('/');
        return;
      }

      const response = await axios.post(
        'http://127.0.0.1:5000/api/income/filtered',
        { ...filters },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const ingresosData = response.data;

      // Actualizamos los datos para todos los componentes
      setIngresos(ingresosData);

      // Actualizar eventos del calendario
      const events = transformIngresosToEvents(ingresosData);
      setEvents(events);

      // Actualizar los datos de la gráfica
      const groupedData = ingresosData.reduce((acc, curr) => {
        const { Descripcion, Monto } = curr;
        if (!acc[Descripcion]) {
          acc[Descripcion] = 0;
        }
        acc[Descripcion] += Monto;
        return acc;
      }, {});

      const chartLabels = Object.keys(groupedData);
      const chartValues = Object.values(groupedData);

      const data = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Tus ingresos',
            data: chartValues,
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
    fetchIngresos(); // Llamada inicial sin filtros
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
        headers: { Authorization: `Bearer ${token}` },
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

  const handleEventClick = (event, e) => {
    setSelectedIncome(event.id);
    setPopoverPosition({
      top: e.clientY,
      left: e.clientX,
    });
  };

  const closePopover = () => {
    setSelectedIncome(null);
    setPopoverPosition(null);
    setSelectedDate(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if ((selectedIncome || selectedDate) && !e.target.closest('.event-popover')) {
        closePopover();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedIncome, selectedDate]);

  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters);
    fetchIngresos(filters); // Llamada al endpoint con filtros
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    fetchIngresos(); // Llamada al endpoint sin filtros
    setShowFilterModal(false);
  };

  const handleDateClick = (slotInfo) => {
    setSelectedDate(slotInfo.start);
    setPopoverPosition({
      top: slotInfo.box.y,
      left: slotInfo.box.x,
    });
  };

  const handleAddIncomeClick = () => {
    navigate('/dashboard/add-income', { state: { selectedDate } });
    setPopoverPosition(null);
  };

  return (
    <div className="income-dashboard-container">
      <h2 className="income-dashboard-title">Tus Ingresos</h2>

      <div className="income-chart-section">
        <div className="chart-and-buttons">
          <div className="income-chart">
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
              className="btn btn-primary add-income-button"
              onClick={() => navigate('/dashboard/add-income')}
            >
              <i className="bi bi-plus"></i> Agregar Ingreso
            </button>
          </div>

          <div className="income-calendar">
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

          {selectedIncome && popoverPosition && (
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
                onClick={() => handleEdit(selectedIncome)}
              >
                Editar
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(selectedIncome)}
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
                onClick={handleAddIncomeClick}
              >
                Agregar Ingreso
              </button>
              <button className="btn btn-secondary btn-sm" onClick={closePopover}>
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>

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
                <td>{ingreso.EsPeriodico ? 'Periódico' : 'Único'}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => handleEdit(ingreso.ID_Ingreso)}
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(ingreso.ID_Ingreso)}
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
    </div>
  );
};

export default IncomeDashboard;
