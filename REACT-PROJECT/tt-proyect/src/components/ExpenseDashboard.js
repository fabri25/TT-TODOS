import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import FilterModalGastos from './FilterModalGastos'; // Cambiar la importación
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/ExpenseDashboard.css';
import CustomToolbar from './CustomToolbar';
import logo1 from '../assets/images/logo1.png';
import coinGif from '../assets/images/coin.gif';

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
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [filteredExpenses, setFilteredExpenses] = useState([]); // Gastos filtrados por búsqueda
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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
  
      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.clear();
        navigate('/');
        return;
      }
  
      const response = await axios.post(
        'http://127.0.0.1:5000/api/gasto/filtered',
        { ...filters },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const expensesData = response.data;
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
  
      const events = transformExpensesToEvents(expensesData);
      setEvents(events);
  
      // Agrupar y sumar los gastos por descripción
      const groupedData = expensesData.reduce((acc, curr) => {
        const { Descripcion, Monto } = curr;
  
        if (!acc[Descripcion]) {
          acc[Descripcion] = 0;
        }
        acc[Descripcion] += Number(Monto); // Asegurarse de que el monto sea numérico
        return acc;
      }, {});
  
      const chartLabels = Object.keys(groupedData); // Descripciones agrupadas
      const chartValues = Object.values(groupedData); // Sumas agrupadas
  
      // Construir los datos para la gráfica
      const data = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Tus gastos',
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
  
  
  

  const handleSearchChange = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
  
    // Filtrar los gastos por descripción
    const filtered = expenses.filter((expense) =>
      expense.Descripcion.toLowerCase().includes(searchValue)
    );
  
    // Actualizar los datos filtrados
    setFilteredExpenses(filtered);
  
    // Actualizar eventos del calendario
    const events = transformExpensesToEvents(filtered);
    setEvents(events);
  
    // Actualizar los datos de la gráfica
    const groupedData = filtered.reduce((acc, curr) => {
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
          label: 'Tus gastos',
          data: chartValues,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        },
      ],
    };
  
    setChartData(data);
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const totalMonto = filteredExpenses.reduce(
      (acc, expense) => acc + (isNaN(expense.Monto) ? 0 : Number(expense.Monto)),
      0
    );
  
    // Agregar el logo en la esquina superior izquierda
    const img = new Image();
    img.src = logo1; // Asegúrate de que el logo esté correctamente importado y referenciado
    doc.addImage(img, 'PNG', 10, 10, 30, 15); // Coordenadas (x, y) y tamaño (ancho, alto)
  
    // Agregar título y fecha de generación
    doc.setFontSize(18);
    doc.text('Reporte de Gastos', 50, 20); // Ajusta el título para que no se superponga con el logo
    doc.setFontSize(12);
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, 14, 40);
  
    // Mostrar filtros aplicados
    let yPosition = 50; // Posición inicial para los filtros
    if (Object.keys(currentFilters).length > 0 || searchTerm) {
      doc.setFontSize(12);
      doc.text('Filtros Aplicados:', 14, yPosition);
      yPosition += 10;
  
      if (currentFilters.categoria) {
        doc.text(`- Categoría: ${currentFilters.categoria}`, 14, yPosition);
        yPosition += 10;
      }
      if (currentFilters.subcategoria) {
        doc.text(`- Subcategoría: ${currentFilters.subcategoria}`, 14, yPosition);
        yPosition += 10;
      }
      if (currentFilters.periodicidad) {
        doc.text(`- Periodicidad: ${currentFilters.periodicidad}`, 14, yPosition);
        yPosition += 10;
      }
      if (currentFilters.periodico !== undefined) {
        doc.text(
          `- Periódico/Único: ${currentFilters.periodico === '1' ? 'Periódico' : 'Único'}`,
          14,
          yPosition
        );
        yPosition += 10;
      }
      if (currentFilters.fecha) {
        doc.text(`- Fecha: ${new Date(currentFilters.fecha).toLocaleDateString()}`, 14, yPosition);
        yPosition += 10;
      }
      if (currentFilters.fecha_inicio && currentFilters.fecha_fin) {
        doc.text(
          `- Rango de Fechas: ${new Date(currentFilters.fecha_inicio).toLocaleDateString()} - ${new Date(
            currentFilters.fecha_fin
          ).toLocaleDateString()}`,
          14,
          yPosition
        );
        yPosition += 10;
      }
      if (searchTerm) {
        doc.text(`- Búsqueda: ${searchTerm}`, 14, yPosition);
        yPosition += 10;
      }
    }
  
    // Generar la tabla con los datos filtrados
    const tableColumn = [
      'Descripción',
      'Monto',
      'Categoría',
      'Subcategoría',
      'Periodicidad',
      'Es Único',
      'Fecha',
    ];
    const tableRows = filteredExpenses.map((expense) => [
      expense.Descripcion || 'N/A',
      `$${(isNaN(expense.Monto) ? 0 : Number(expense.Monto)).toFixed(2)}`,
      expense.Categoria || 'N/A',
      expense.Subcategoria || 'N/A',
      expense.Periodicidad || 'N/A',
      expense.Periodico === 'Único' ? 'Sí' : 'No',
      expense.Fecha ? new Date(expense.Fecha).toLocaleDateString() : 'N/A',
    ]);
  
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPosition + 10,
    });
  
    // Agregar el total de los montos debajo de la tabla
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total: $${totalMonto.toFixed(2)}`, 14, finalY);
  
    // Descargar el archivo
    doc.save('reporte_gastos.pdf');
  };
  
  useEffect(() => {
    setTimeout(() => {
      setLoading(false); // Cambia el estado de loading después de 3 segundos
    }, 1000);
  }, []);
  

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
      await fetchExpenses();
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
    const cleanFilters = { ...filters };

    // Si el filtro de "periodico" no está seleccionado, elimínalo
    if (!filters.periodico) {
      delete cleanFilters.periodico;
    }
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
      {/* Mostrar la animación de carga */}
      {loading ? (
        <div className="overlay">
          <div className="loading-message">
            Cargando informacion de tus gastos... <br />
            <img src={coinGif} alt="Cargando..." className="loading-image" />
          </div>
        </div>
      ) : (
        <>
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
                <button
                  className="btn btn-primary add-income-button"
                  onClick={handleGeneratePDF}
                >
                  <i className="bi bi-file-earmark-pdf"></i> Generar Reporte PDF
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
          <div className="search-bar">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por descripción..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="expense-list-section">
            <table className="grupos-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Categoría</th>
                  <th>Subcategoría</th>
                  <th>Periodicidad</th>
                  <th>Es Único</th>
                  <th>Fecha</th>
                  <th>Periódico/Único</th>
                  <th>Editar</th>
                  <th>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.ID_Gasto}>
                    <td>{expense.Descripcion}</td>
                    <td>{expense.Monto}</td>
                    <td>{expense.Categoria}</td>
                    <td>{expense.Subcategoria || 'N/A'}</td>
                    <td>{expense.Periodicidad || 'N/A'}</td>
                    <td>{expense.Periodico === 'Único' ? 'Sí' : 'No'}</td>
                    <td>{new Date(expense.Fecha).toISOString().split('T')[0]}</td>
                    <td>{expense.Periodico}</td>
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
            <FilterModalGastos
              initialFilters={currentFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              onClose={() => setShowFilterModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseDashboard;
