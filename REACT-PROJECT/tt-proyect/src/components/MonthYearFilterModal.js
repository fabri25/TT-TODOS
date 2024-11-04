import React, { useState } from 'react';
import '../styles/MonthYearFilterModal.css';

const MonthYearFilterModal = ({ onApplyFilters, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleApply = () => {
    onApplyFilters({ mes: selectedMonth, año: selectedYear });
  };

  return (
    <div className="month-year-filter-modal-backdrop">
      <div className="month-year-filter-modal">
        <div className="month-year-filter-modal-header">
          <h4 className="filter-modal-title">Filtrar por Mes y Año</h4>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="month-year-filter-modal-body">
          <div className="filter-field">
            <label htmlFor="month-select">Mes:</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="form-control"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label htmlFor="year-select">Año:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-control"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={selectedYear - i}>
                  {selectedYear - i}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="month-year-filter-modal-footer">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthYearFilterModal;
