import React, { useState, useEffect } from 'react';
import '../styles/FilterModal.css'; // Asegúrate de tener un archivo de estilos adecuado

const FilterModal = ({ initialFilters, onApplyFilters, onClose }) => {
  const [tipo, setTipo] = useState('');
  const [esFijo, setEsFijo] = useState('');
  const [tipoChecked, setTipoChecked] = useState(false);
  const [esFijoChecked, setEsFijoChecked] = useState(false);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.tipo) {
        setTipo(initialFilters.tipo);
        setTipoChecked(true);
      }
      if (initialFilters.esFijo) {
        setEsFijo(initialFilters.esFijo);
        setEsFijoChecked(true);
      }
    }
  }, [initialFilters]);

  const handleClearFilters = () => {
    setTipo('');
    setEsFijo('');
    setTipoChecked(false);
    setEsFijoChecked(false);
  };

  const handleApply = () => {
    const filters = {
      tipo: tipoChecked ? tipo : null,
      esFijo: esFijoChecked ? esFijo : null,
    };
    console.log("Filtros aplicados:", filters);
    onApplyFilters(filters);
  };

  return (
    <div className="filter-modal-backdrop">
      <div className="filter-modal">
        <div className="filter-modal-header">
          <h4 className="filter-modal-title">Filtrar Ingresos</h4>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="filter-modal-body">
          <div className="form-group">
            <input 
              type="checkbox" 
              id="filterTipo" 
              checked={tipoChecked} 
              onChange={(e) => {
                setTipoChecked(e.target.checked);
                if (!e.target.checked) {
                  setTipo('');
                }
              }} 
            />
            <label htmlFor="filterTipo">Tipo</label>
            {tipoChecked && (
              <select 
                value={tipo} 
                onChange={(e) => setTipo(e.target.value)} 
                className="form-control mt-2"
              >
                <option value="">Seleccionar</option>
                <option value="activo">Activo</option>
                <option value="pasivo">Pasivo</option>
              </select>
            )}
          </div>
          <div className="form-group">
            <input 
              type="checkbox" 
              id="filterEsFijo" 
              checked={esFijoChecked} 
              onChange={(e) => {
                setEsFijoChecked(e.target.checked);
                if (!e.target.checked) {
                  setEsFijo('');
                }
              }} 
            />
            <label htmlFor="filterEsFijo">Fijo/No fijo</label>
            {esFijoChecked && (
              <select 
                value={esFijo} 
                onChange={(e) => setEsFijo(e.target.value)} 
                className="form-control mt-2"
              >
                <option value="">Seleccionar</option>
                <option value="fijo">Fijo</option>
                <option value="nofijo">No fijo</option>
              </select>
            )}
          </div>
        </div>
        <div className="filter-modal-footer">
          <button className="btn btn-outline-secondary" onClick={handleClearFilters}>Limpiar filtros</button>
          <button className="btn btn-primary" onClick={handleApply}>Filtrar</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
