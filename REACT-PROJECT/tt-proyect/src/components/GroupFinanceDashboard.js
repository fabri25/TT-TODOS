import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/ExpenseDashboard.css'; // Reutilizamos los estilos
import CustomToolbar from './CustomToolbar';
import FilterModal from './FilterModalGastosGrupales';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo1 from '../assets/images/logo1.png';
import coinGif from '../assets/images/coin.gif';

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
  const [metas, setMetas] = useState([]); // Estado para almacenar las metas grupales
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false); // Estado para mostrar u ocultar el modal de confirmación
  const [isAdmin, setIsAdmin] = useState(false); // Nuevo estado para identificar si el usuario es admin
  const [currentUserId, setCurrentUserId] = useState(null); // Nuevo estado para almacenar el ID del usuario actual
  const [selectedDate, setSelectedDate] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [claimingExpense, setClaimingExpense] = useState(null); // Gasto en proceso de reclamación
  const [showClaimModal, setShowClaimModal] = useState(false); // Mostrar el modal de reclamación
  const [filteredGroupExpenses, setFilteredGroupExpenses] = useState([]); // Gastos filtrados por búsqueda
  const navigate = useNavigate();
  const { grupoId } = useParams(); // Obtener el ID del grupo desde la URL
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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
      setIsAdmin(response.data.EsAdmin); // Suponiendo que el backend devuelve "EsAdmin"
      setCurrentUserId(response.data.UserId); // Suponiendo que el backend devuelve "UserId"
    } catch (error) {
      console.error('Error al obtener la información del grupo:', error);
      navigate('/'); // Redirigir si hay un error crítico
    }
  }, [grupoId, navigate]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);  // Empieza a cargar
      try {
        // Aquí va tu código para obtener los datos (por ejemplo, usando fetch o axios)
        const response = await fetch("/api/datos");
        const result = await response.json();
        setData(result);  // Establece los datos obtenidos
      } catch (error) {
        console.error("Error al cargar los datos:", error);
      } finally {
        setLoading(false);  // Al terminar de cargar, cambiamos loading a false
      }
    };
  
    // Usamos setTimeout para simular un retraso
    setTimeout(() => {
      fetchData();  // Llama a la función después del retraso
    }, 2000);  // 2000ms (2 segundos)
    
  }, []); // Esto solo se ejecutará una vez cuando el componente se monte

  const fetchGroupExpenses = useCallback(async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
  
      const response = await axios.post(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/gastos/filtrados`,
        filters,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setIsAdmin(response.data.EsAdmin); // Guardar si es administrador
      setCurrentUserId(response.data.UserId); // Guardar el ID del usuario autenticado
      const gastos = response.data.Gastos.map((gasto) => ({
        ...gasto,
        ID_Usuario: gasto.ID_Usuario || null, // Asegurar que exista ID_Usuario
      }));
  
      setGroupExpenses(gastos);
      setFilteredGroupExpenses(gastos); // Inicializar correctamente
    } catch (error) {
      console.error('Error al obtener los datos del grupo:', error);
    }
  }, [grupoId, navigate]);
  
  
  

  const fetchChartData = useCallback(async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }
  
      const response = await axios.post(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/gastos/filtrados`,
        filters,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const expenseData = response.data.Gastos; // Cambiado para extraer los gastos
  
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
    fetchGroupExpenses(); // Llama al endpoint sin filtros
    fetchChartData(); // Llama al endpoint sin filtros
  }, [fetchGroupInfo, fetchGroupExpenses, fetchChartData]);

  const handleDelete = (id) => {
    setExpenseToDelete(id);
    setShowModal(true);
  };

  const handleOpenClaimModal = (expenseId) => {
    setClaimingExpense(expenseId);
    setShowClaimModal(true);
  };

  const handleSearchChange = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);
  
    // Filtrar los gastos por descripción
    const filtered = groupExpenses.filter((expense) =>
      expense.Descripcion.toLowerCase().includes(searchValue)
    );
  
    // Actualizar los datos filtrados
    setFilteredGroupExpenses(filtered);
  
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
          label: 'Gastos del grupo',
          data: chartValues,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        },
      ],
    };
  
    setChartData(data);
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
  
    // Agregar el logo en la esquina superior izquierda
    const img = new Image();
    img.src = logo1;
    doc.addImage(img, 'PNG', 10, 10, 30, 15); // Coordenadas (x, y) y tamaño (ancho, alto)
  
    // Agregar título y fecha de generación
    doc.setFontSize(18);
    doc.text('Reporte de Gastos del Grupo', 50, 20);
    doc.setFontSize(12);
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString()}`, 14, 40);
  
    // Mostrar filtros aplicados
    let yPosition = 50;
    if (Object.keys(currentFilters).length > 0 || searchTerm) {
      doc.setFontSize(12);
      doc.text('Filtros Aplicados:', 14, yPosition);
      yPosition += 10;
  
      if (currentFilters.categoria) {
        doc.text(`- Categoría: ${currentFilters.categoria}`, 14, yPosition);
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
    const tableColumn = ['Descripción', 'Monto', 'Responsable', 'Estado', 'Fecha'];
    const tableRows = filteredGroupExpenses.map((expense) => [
      expense.Descripcion || 'N/A',
      `$${Number(expense.Monto).toFixed(2)}`,
      expense.Responsable || 'N/A',
      expense.Estado || 'N/A',
      expense.Fecha ? new Date(expense.Fecha).toLocaleDateString() : 'N/A',
    ]);
  
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPosition + 10,
    });
  
    // Agregar el total de los montos debajo de la tabla
    const totalMonto = filteredGroupExpenses.reduce(
      (acc, expense) => acc + (isNaN(expense.Monto) ? 0 : Number(expense.Monto)),
      0
    );
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total: $${totalMonto.toFixed(2)}`, 14, finalY);
  
    // Descargar el archivo
    doc.save('reporte_gastos_grupo.pdf');
  };
  
  const handleConfirmClaimExpense = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/gasto/${claimingExpense}/reclamar`,
        {}, // No se necesitan datos en el cuerpo
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        // Actualizar la lista de gastos después de reclamar
        fetchGroupExpenses();
        setShowClaimModal(false); // Cerrar el modal
        setClaimingExpense(null); // Resetear el estado
      }
    } catch (error) {
      console.error('Error al reclamar el gasto:', error);
      setShowClaimModal(false); // Cerrar el modal incluso si falla
      setClaimingExpense(null);
    }
  };
  
  // Obtener información de metas grupales
  const fetchMetasGrupales = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:5000/api/grupo/${grupoId}/metas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const metasConProgreso = response.data.map((meta) => {
        const progreso = (meta.Monto_Actual / meta.Monto_Objetivo) * 100;
        return {
          ...meta,
          progreso: progreso.toFixed(2), // Calcular el porcentaje de progreso
        };
      });

      setMetas(metasConProgreso);
    } catch (error) {
      console.error('Error al obtener las metas grupales:', error);
    }
  }, [grupoId]);

  useEffect(() => {
    fetchMetasGrupales();
  }, [fetchMetasGrupales]);

  const handleViewMetaDetails = (metaId) => {
    navigate(`/dashboard/grupo/${grupoId}/metas/${metaId}`);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
  
    try {
      const token = localStorage.getItem('token');
      // Llamar al endpoint de eliminación
      const response = await axios.delete(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/gastos/${expenseToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.status === 200) {
        // Filtrar el gasto eliminado de la lista
        setGroupExpenses(groupExpenses.filter((expense) => expense.ID_Gasto !== expenseToDelete));
        setFilteredGroupExpenses(filteredGroupExpenses.filter((expense) => expense.ID_Gasto !== expenseToDelete));
        
        setShowModal(false); // Cerrar el modal de confirmación
        setExpenseToDelete(null); // Resetear el gasto seleccionado
      }
    } catch (error) {
      console.error('Error al eliminar el gasto del grupo:', error);
      //alert('No se pudo eliminar el gasto. Por favor, intenta nuevamente.');
    }
  };
  

  const cancelDelete = () => {
    setShowModal(false);
    setExpenseToDelete(null);
  };

  const handleLeaveGroup = () => {
    setShowLeaveModal(true); // Mostrar el modal
  };
  
  const confirmLeaveGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:5000/api/grupo/${grupoId}/salir`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      //alert('Has salido del grupo exitosamente.');
      navigate('/dashboard/listado_grupos'); // Redirigir al listado de grupos
    } catch (error) {
      console.error('Error al salir del grupo:', error);
      //alert('Hubo un error al intentar salir del grupo. Por favor, intenta nuevamente.');
    } finally {
      setShowLeaveModal(false); // Cerrar el modal
    }
  };
  
  const cancelLeaveGroup = () => {
    setShowLeaveModal(false); // Cerrar el modal
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
    fetchGroupExpenses(filters); // Llama con filtros
    fetchChartData(filters); // Actualizar gráfica al aplicar filtros
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    fetchGroupExpenses(); // Llama sin filtros
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
      {/* Mostrar la animación de carga */}
      {loading ? (
        <div className="overlay">
          <div className="loading-message">
            Cargando info... <br />
            <img src={coinGif} alt="Cargando..." className="loading-image" />
          </div>
        </div>
      ) : (
        <>
          {/* Aquí va tu contenido principal, que se muestra cuando loading es false */}
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
            </div>
          </div>
  
          <div className="search-bar" style={{ marginBottom: '20px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por descripción..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
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
                {filteredGroupExpenses.map((expense) => (
                  <tr key={expense.ID_Gasto}>
                    <td>{expense.Descripcion}</td>
                    <td>{expense.Monto}</td>
                    <td>
                      {expense.Responsable === 'Pendiente' ? (
                        <button
                          className="btn btn-link text-decoration-none"
                          onClick={() => handleOpenClaimModal(expense.ID_Gasto)}
                        >
                          Registra este gasto como tuyo
                        </button>
                      ) : (
                        expense.Responsable
                      )}
                    </td>
                    <td>{expense.Estado}</td>
                    <td>{new Date(expense.Fecha).toISOString().split('T')[0]}</td>
                    <td>
                      {(isAdmin || expense.ID_Usuario === currentUserId) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(expense.ID_Gasto)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
  
              {showClaimModal && (
                <ConfirmationModal
                  message="¿Estás seguro de que deseas registrar este gasto como tuyo?"
                  onConfirm={handleConfirmClaimExpense}
                  onCancel={() => {
                    setShowClaimModal(false);
                    setClaimingExpense(null);
                  }}
                />
              )}
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
          <br></br><br></br>
  
          <div className="metas-progress-container" style={{ marginTop: '20px' }}>
            <h3>Progreso de Metas</h3>
            {metas.length > 0 ? (
              metas.map((meta) => (
                <div
                  key={meta.ID_Ahorro_Grupal}
                  className="meta-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    gap: '20px',
                  }}
                >
                  <span style={{ flex: '1', marginRight: '10px', fontWeight: 'bold' }}>
                    {meta.Descripcion}
                  </span>
  
                  <div className="progress-bar-container" style={{ flex: '3' }}>
                    <div
                      className="progress"
                      style={{ width: `${meta.progreso}%` }}
                    ></div>
                    <div className="progress-text">{meta.progreso}%</div>
                  </div>
                </div>
              ))
            ) : (
              <p>No hay metas registradas.</p>
            )}
  
            <div className="view-goals-button-container" style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                className="btn btn-success"
                onClick={handleViewGoals}
                style={{ backgroundColor: '#4caf50', border: 'none', padding: '10px 20px', borderRadius: '5px' }}
              >
                Ver Metas
              </button>
            </div>
          </div>
          <div className="group-exit-action">
            {!isAdmin && (
              <button
                className="btn btn-danger"
                onClick={handleLeaveGroup}
                style={{ marginTop: '20px', padding: '10px 20px' }}
              >
                Salir del Grupo
              </button>
            )}

            {showLeaveModal && (
              <ConfirmationModal
                message="¿Estás seguro de que deseas salir del grupo? Esta acción no se puede deshacer."
                onConfirm={confirmLeaveGroup} // Confirmar salida
                onCancel={cancelLeaveGroup} // Cancelar acción
              />
            )}
          </div>
        </>
      )}
    </div>
  );
  
  
};

export default GroupFinanceDashboard;
