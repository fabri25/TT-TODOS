import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import FilterModal from './FilterModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/IncomeDashboard.css';
import CustomToolbar from './CustomToolbar';
import logo1 from '../assets/images/logo1.png';
import coinGif from '../assets/images/coin.gif';

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
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [filteredIngresos, setFilteredIngresos] = useState([]); // Lista de ingresos filtrados
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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
      setFilteredIngresos(ingresosData); // Inicializa los ingresos filtrados con la lista completa


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
    setTimeout(() => {
      setLoading(false); // Cambia el estado de loading después de 3 segundos
    }, 1000);
  }, []);

  useEffect(() => {
    fetchIngresos(); // Llamada inicial sin filtros
  }, [fetchIngresos]);

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const totalMonto = filteredIngresos.reduce((acc, ingreso) => acc + (isNaN(ingreso.Monto) ? 0 : Number(ingreso.Monto)), 0);
  
    // Agregar el logo
    const img = new Image();
    img.src = logo1;
    doc.addImage(img, 'PNG', 10, 10, 30, 15); // Coordenadas (x, y) y tamaño del logo (width, height)
  
    // Título y fecha de generación
    doc.setFontSize(18);
    doc.text('Reporte de Ingresos', 50, 20); // El título está alineado con el logo
    doc.setFontSize(12);
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, 14, 40);
  
    // Mostrar filtros aplicados
    let yPosition = 50; // Posición vertical inicial para los filtros
    if (Object.keys(currentFilters).length > 0 || searchTerm) {
      doc.setFontSize(12);
      doc.text('Filtros Aplicados:', 14, yPosition);
      yPosition += 10;
  
      if (currentFilters.tipo) {
        doc.text(`- Tipo: ${currentFilters.tipo}`, 14, yPosition);
        yPosition += 10;
      }
      if (currentFilters.esFijo) {
        doc.text(`- Es Fijo: ${currentFilters.esFijo}`, 14, yPosition);
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
      if (currentFilters.periodicidad) {
        doc.text(`- Periodicidad: ${currentFilters.periodicidad}`, 14, yPosition);
        yPosition += 10;
      }
      if (searchTerm) {
        doc.text(`- Búsqueda: ${searchTerm}`, 14, yPosition);
        yPosition += 10;
      }
    }
  
    // Generar la tabla con los datos filtrados
    const tableColumn = ['Descripción', 'Monto', 'Periodicidad', 'Es Fijo', 'Tipo', 'Fecha', 'Periódico/Único'];
    const tableRows = filteredIngresos.map((ingreso) => [
      ingreso.Descripcion || 'N/A',
      `$${(isNaN(ingreso.Monto) ? 0 : Number(ingreso.Monto)).toFixed(2)}`,
      ingreso.Periodicidad || 'N/A',
      ingreso.EsFijo ? 'Sí' : 'No',
      ingreso.Tipo || 'N/A',
      ingreso.Fecha ? new Date(ingreso.Fecha).toLocaleDateString() : 'N/A',
      ingreso.EsPeriodico ? 'Periódico' : 'Único',
    ]);
  
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPosition + 10, // Coloca la tabla debajo de los filtros
    });
  
    // Agregar el total de los montos debajo de la tabla
    const finalY = doc.lastAutoTable.finalY + 10; // Posición después de la tabla
    doc.setFontSize(12);
    doc.text(`Total: $${totalMonto.toFixed(2)}`, 14, finalY);
  
    // Descargar el archivo
    doc.save('reporte_ingresos.pdf');
  };
  

  
  
  const handleSearchChange = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
  
    // Filtrar ingresos por descripción
    const filtered = ingresos.filter((ingreso) =>
      ingreso.Descripcion.toLowerCase().includes(searchValue)
    );
  
    // Actualiza la tabla, el calendario, y la gráfica con los datos filtrados
    setFilteredIngresos(filtered);
  
    // Actualizar eventos del calendario
    const events = transformIngresosToEvents(filtered);
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
          label: 'Tus ingresos',
          data: chartValues,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        },
      ],
    };
  
    setChartData(data);
  };
  

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
    <div className="expense-dashboard-container">
      {/* Mostrar la animación de carga */}
      {loading ? (
        <div className="overlay">
          <div className="loading-message">
            Cargando información de tus ingresos... <br />
            <img src={coinGif} alt="Cargando..." className="loading-image" />
          </div>
        </div>
      ) : (
        <div>

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
                  <button
                    className="btn btn-primary add-income-button"
                    onClick={handleGeneratePDF}
                  >
                    <i className="bi bi-file-earmark-pdf"></i> Generar Reporte PDF
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

            <div className="search-bar">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por descripción..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="income-list-section">
              <table className="grupos-table">
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
                  {filteredIngresos.map((ingreso) => (
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
        </div>
      )}
    </div>
  );
};

export default IncomeDashboard;
