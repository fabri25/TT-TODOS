import React, { useState, useEffect, useCallback } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/FinancialOverview.css';
import CustomToolbar from './CustomToolbar';
import MonthYearFilterModal from './MonthYearFilterModal';

Chart.register(ArcElement, BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const localizer = momentLocalizer(moment);

const FinancialOverview = () => {
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [chartData, setChartData] = useState({});
  const [barChartData, setBarChartData] = useState({});
  const [events, setEvents] = useState([]);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();

  const fetchFinancialData = useCallback(async (filters) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const endpoint = 'http://127.0.0.1:5000/api/totales_financieros';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      });

      const monthlyData = response.data;

      // Datos para la gráfica de pastel cuando se aplican filtros
      if (filters) {
        const { total_ingresos, total_gastos } = monthlyData.find(
          (data) => data.mes === filters.mes && data.año === filters.año
        ) || { total_ingresos: 0, total_gastos: 0 };
        setIncomeTotal(total_ingresos);
        setExpenseTotal(total_gastos);

        setChartData({
          labels: ['Ingresos', 'Gastos'],
          datasets: [
            {
              data: [total_ingresos, total_gastos],
              backgroundColor: ['#36A2EB', '#FF6384'],
            },
          ],
        });
      }

      // Convertir números de mes a nombres abreviados
      const barLabels = monthlyData.map((data) => {
        const date = new Date(data.año, data.mes - 1); // -1 porque los meses en JavaScript van de 0 a 11
        return date.toLocaleString('es', { month: 'short' }).toUpperCase(); // Mes en abreviatura en español y en mayúsculas
      });

      const incomeValues = monthlyData.map((data) => data.total_ingresos);
      const expenseValues = monthlyData.map((data) => data.total_gastos);

      setBarChartData({
        labels: barLabels,
        datasets: [
          {
            label: 'Ingresos',
            data: incomeValues,
            backgroundColor: '#36A2EB',
          },
          {
            label: 'Gastos',
            data: expenseValues,
            backgroundColor: '#FF6384',
          },
        ],
      });

      // Eventos de calendario
      const ingresosResponse = await axios.get('http://127.0.0.1:5000/api/user/incomes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const gastosResponse = await axios.get('http://127.0.0.1:5000/api/user/gastos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ingresosData = ingresosResponse.data;
      const gastosData = gastosResponse.data;

      const incomeEvents = ingresosData.map((ingreso) => ({
        id: ingreso.ID_Ingreso,
        title: ingreso.Descripcion,
        start: new Date(new Date(ingreso.Fecha).setDate(new Date(ingreso.Fecha).getDate() + 1)),
        end: new Date(new Date(ingreso.Fecha).setDate(new Date(ingreso.Fecha).getDate() + 1)),
        allDay: true,
        color: '#36A2EB',
      }));

      const expenseEvents = gastosData.map((gasto) => ({
        id: gasto.ID_Gasto,
        title: gasto.Descripcion,
        start: new Date(new Date(gasto.Fecha).setDate(new Date(gasto.Fecha).getDate() + 1)),
        end: new Date(new Date(gasto.Fecha).setDate(new Date(gasto.Fecha).getDate() + 1)),
        allDay: true,
        color: '#FF6384',
      }));

      setEvents([...incomeEvents, ...expenseEvents]);
    } catch (error) {
      console.error('Error al obtener los datos financieros:', error);
    }
  }, [navigate]);

  useEffect(() => {
    fetchFinancialData(null);
  }, [fetchFinancialData]);

  const handleApplyMonthFilter = (filters) => {
    setIsFiltered(true);
    fetchFinancialData(filters);
    setShowMonthFilter(false);
  };

  const toggleMonthFilter = () => {
    setShowMonthFilter(!showMonthFilter);
  };

  return (
    <div className="financial-overview-container">
      <h2>Resumen Financiero</h2>

      <div className="chart-and-calendar">
        <div className="bar-chart-section">
          {barChartData && barChartData.labels && barChartData.labels.length > 0 ? (
            <Bar data={barChartData} options={{ responsive: true }} />
          ) : (
            <p>No hay datos de ingresos y gastos mensuales disponibles.</p>
          )}
        </div>

        <div className="financial-calendar">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500, width: 700 }}
            components={{
              toolbar: CustomToolbar,
            }}
            eventPropGetter={(event) => ({
              style: { backgroundColor: event.color },
            })}
          />
        </div>
      </div>
      <br></br>
      <div className="financial-chart-section">
        <div className="financial-chart">
          {chartData && chartData.labels && chartData.labels.length > 0 ? (
            <Pie data={chartData} width={300} height={300} />
          ) : (
            <p>No hay datos disponibles para mostrar.</p>
          )}
        </div>

        <button className="btn btn-outline-secondary filter-button" onClick={toggleMonthFilter}>
          <i className="bi bi-filter"></i> Filtrar por Mes
        </button>
      </div>

      {showMonthFilter && (
        <MonthYearFilterModal
          onApplyFilters={handleApplyMonthFilter}
          onClose={() => setShowMonthFilter(false)}
        />
      )}
    </div>
  );
};

export default FinancialOverview;
