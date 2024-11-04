import React, { useState, useEffect, useCallback } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import '../styles/FinancialOverview.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CustomToolbar from './CustomToolbar';

Chart.register(ArcElement, Tooltip, Legend);

const localizer = momentLocalizer(moment);

const GeneralFinancialComparison = () => {
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [chartData, setChartData] = useState({});
  const [events, setEvents] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]);

  const fetchFinancialData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      // Llamada para todos los ingresos y gastos
      const [ingresosResponse, gastosResponse] = await Promise.all([
        axios.get('http://127.0.0.1:5000/api/ingresos', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://127.0.0.1:5000/api/gastos', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const ingresosData = ingresosResponse.data;
      const gastosData = gastosResponse.data;

      // Calcular totales de ingresos y gastos
      const incomeSum = ingresosData.reduce((acc, ingreso) => acc + ingreso.Monto, 0);
      const expenseSum = gastosData.reduce((acc, gasto) => acc + gasto.Monto, 0);

      setIncomeTotal(incomeSum);
      setExpenseTotal(expenseSum);

      // Configurar datos para la gráfica
      setChartData({
        labels: ['Ingresos', 'Gastos'],
        datasets: [
          {
            data: [incomeSum, expenseSum],
            backgroundColor: ['#36A2EB', '#FF6384'],
          },
        ],
      });

      // Combinar ingresos y gastos para la tabla y calendario
      const combinedRecords = [
        ...ingresosData.map((ingreso) => ({ ...ingreso, type: 'Ingreso' })),
        ...gastosData.map((gasto) => ({ ...gasto, type: 'Gasto' })),
      ];
      setFinancialRecords(combinedRecords);

      // Convertir ingresos y gastos a eventos para el calendario
      const incomeEvents = ingresosData.map((ingreso) => ({
        id: ingreso.ID,
        title: `Ingreso: ${ingreso.Descripcion}`,
        start: new Date(ingreso.Fecha),
        end: new Date(ingreso.Fecha),
        allDay: true,
        color: '#36A2EB', // Azul para ingresos
      }));

      const expenseEvents = gastosData.map((gasto) => ({
        id: gasto.ID,
        title: `Gasto: ${gasto.Descripcion}`,
        start: new Date(gasto.Fecha),
        end: new Date(gasto.Fecha),
        allDay: true,
        color: '#FF6384', // Rojo para gastos
      }));

      setEvents([...incomeEvents, ...expenseEvents]);
    } catch (error) {
      console.error('Error al obtener los datos financieros:', error);
    }
  }, []);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return (
    <div className="financial-overview-container">
      <h2>Comparación Financiera General</h2>

      <div className="financial-chart-section">
        <div className="financial-chart">
          {chartData && chartData.labels && chartData.labels.length > 0 ? (
            <Pie data={chartData} width={300} height={300} />
          ) : (
            <p>No hay datos disponibles para mostrar.</p>
          )}
        </div>
      </div>

      <div className="financial-calendar">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          components={{
            toolbar: CustomToolbar,
          }}
          eventPropGetter={(event) => ({
            style: { backgroundColor: event.color },
          })}
        />
      </div>

      <div className="financial-table-section">
        <table className="financial-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {financialRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.Descripcion}</td>
                <td>{record.Monto}</td>
                <td>{new Date(record.Fecha).toISOString().split('T')[0]}</td>
                <td style={{ color: record.type === 'Ingreso' ? '#36A2EB' : '#FF6384' }}>
                  {record.type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralFinancialComparison;
