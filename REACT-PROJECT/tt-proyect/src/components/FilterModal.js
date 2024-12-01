import React, { useState, useEffect } from 'react';
import '../styles/FilterModal.css'; // Asegúrate de tener un archivo de estilos adecuado

const FilterModal = ({ initialFilters, onApplyFilters, onClose }) => {
  const [tipo, setTipo] = useState('');
  const [esFijo, setEsFijo] = useState('');
  const [periodicidad, setPeriodicidad] = useState(''); // Nuevo estado para periodicidad
  const [tipoChecked, setTipoChecked] = useState(false);
  const [esFijoChecked, setEsFijoChecked] = useState(false);
  const [periodicidadChecked, setPeriodicidadChecked] = useState(false); // Nuevo estado para activar/desactivar periodicidad
  const [fecha, setFecha] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [fechaChecked, setFechaChecked] = useState(false);
  const [rangoChecked, setRangoChecked] = useState(false);

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
      if (initialFilters.periodicidad) {
        setPeriodicidad(initialFilters.periodicidad);
        setPeriodicidadChecked(true);
      }
      if (initialFilters.fecha) {
        setFecha(initialFilters.fecha);
        setFechaChecked(true);
      }
      if (initialFilters.fecha_inicio) {
        setFechaInicio(initialFilters.fecha_inicio);
        setRangoChecked(true);
      }
      if (initialFilters.fecha_fin) {
        setFechaFin(initialFilters.fecha_fin);
      }
    }
  }, [initialFilters]);

  const handleClearFilters = () => {
    setTipo('');
    setEsFijo('');
    setPeriodicidad(''); // Limpiar periodicidad
    setFecha('');
    setFechaInicio('');
    setFechaFin('');
    setTipoChecked(false);
    setEsFijoChecked(false);
    setPeriodicidadChecked(false); // Desactivar checkbox de periodicidad
    setFechaChecked(false);
    setRangoChecked(false);
  };

  const handleApply = () => {
    const filters = {
      tipo: tipoChecked ? tipo : null,
      esFijo: esFijoChecked ? esFijo : null,
      periodicidad: periodicidadChecked ? periodicidad : null, // Incluir periodicidad en los filtros aplicados
      fecha: fechaChecked ? fecha : null,
      fecha_inicio: rangoChecked ? fechaInicio : null,
      fecha_fin: rangoChecked ? fechaFin : null,
    };
    console.log('Filtros aplicados:', filters);
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
          {/* Filtro por tipo */}
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

          {/* Filtro por fijo/no fijo */}
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

          {/* Nuevo Filtro Periodicidad */}
          <div className="form-group">
            <input
              type="checkbox"
              id="filterPeriodicidad"
              checked={periodicidadChecked}
              onChange={(e) => {
                setPeriodicidadChecked(e.target.checked);
                if (!e.target.checked) {
                  setPeriodicidad('');
                }
              }}
            />
            <label htmlFor="filterPeriodicidad">Periodicidad</label>
            {periodicidadChecked && (
              <select
                value={periodicidad}
                onChange={(e) => setPeriodicidad(e.target.value)}
                className="form-control mt-2"
              >
                <option value="">Seleccionar</option>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            )}
          </div>

          {/* Filtro por fecha específica */}
          <div className="form-group">
            <input
              type="checkbox"
              id="filterFecha"
              checked={fechaChecked}
              onChange={(e) => {
                setFechaChecked(e.target.checked);
                if (!e.target.checked) {
                  setFecha('');
                }
              }}
            />
            <label htmlFor="filterFecha">Fecha específica</label>
            {fechaChecked && (
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="form-control mt-2"
              />
            )}
          </div>

          {/* Filtro por rango de fechas */}
          <div className="form-group">
            <input
              type="checkbox"
              id="filterRango"
              checked={rangoChecked}
              onChange={(e) => {
                setRangoChecked(e.target.checked);
                if (!e.target.checked) {
                  setFechaInicio('');
                  setFechaFin('');
                }
              }}
            />
            <label htmlFor="filterRango">Rango de fechas</label>
            {rangoChecked && (
              <div className="form-inline mt-2">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="form-control"
                />
                <span className="mx-2">a</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="form-control"
                />
              </div>
            )}
          </div>
        </div>
        <div className="filter-modal-footer">
          <button className="btn btn-outline-secondary" onClick={handleClearFilters}>
            Limpiar filtros
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            Filtrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
