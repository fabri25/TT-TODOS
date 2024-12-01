import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/FilterModal.css"; // Asegúrate de tener un archivo de estilos adecuado

const FilterModalGastos = ({ initialFilters, onApplyFilters, onClose }) => {
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [periodicidad, setPeriodicidad] = useState("");
  const [periodico, setPeriodico] = useState(""); // Para distinguir entre periódico y único
  const [fecha, setFecha] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [subcategoriasDisponibles, setSubcategoriasDisponibles] = useState([]);

  const [categoriaChecked, setCategoriaChecked] = useState(false);
  const [subcategoriaChecked, setSubcategoriaChecked] = useState(false);
  const [periodicidadChecked, setPeriodicidadChecked] = useState(false);
  const [periodicoChecked, setPeriodicoChecked] = useState(false);
  const [fechaChecked, setFechaChecked] = useState(false);
  const [rangoChecked, setRangoChecked] = useState(false);

  // Categorías predefinidas
  const categoriasPredefinidas = ["Fijo", "Variable", "Inesperado"];

  useEffect(() => {
    // Cargar subcategorías cuando se selecciona una categoría
    const fetchSubcategorias = async () => {
      if (!categoria) {
        setSubcategoriasDisponibles([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://127.0.0.1:5000/api/subcategorias/${categoria}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubcategoriasDisponibles(response.data);
      } catch (error) {
        console.error("Error al obtener subcategorías:", error);
      }
    };

    fetchSubcategorias();
  }, [categoria]);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.categoria) {
        setCategoria(initialFilters.categoria);
        setCategoriaChecked(true);
      }
      if (initialFilters.subcategoria) {
        setSubcategoria(initialFilters.subcategoria);
        setSubcategoriaChecked(true);
      }
      if (initialFilters.periodicidad) {
        setPeriodicidad(initialFilters.periodicidad);
        setPeriodicidadChecked(true);
      }
      if (initialFilters.periodico !== undefined && initialFilters.periodico !== "") {
        setPeriodico(initialFilters.periodico);
        setPeriodicoChecked(true);
      } else {
        setPeriodico("");
        setPeriodicoChecked(false);
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
    setCategoria("");
    setSubcategoria("");
    setPeriodicidad("");
    setPeriodico(""); // Limpia el valor de periodico
    setFecha("");
    setFechaInicio("");
    setFechaFin("");
    setCategoriaChecked(false);
    setSubcategoriaChecked(false);
    setPeriodicidadChecked(false);
    setPeriodicoChecked(false); // Asegúrate de desactivar el checkbox
    setFechaChecked(false);
    setRangoChecked(false);
  };
  

  const handleApply = () => {
    const filters = {
      categoria: categoriaChecked ? categoria : null,
      subcategoria: subcategoriaChecked ? subcategoria : null,
      periodicidad: periodicidadChecked ? periodicidad : null,
      periodico: periodicoChecked ? periodico : null,
      fecha: fechaChecked ? fecha : null,
      fecha_inicio: rangoChecked ? fechaInicio : null,
      fecha_fin: rangoChecked ? fechaFin : null,
    };
    onApplyFilters(filters);
  };

  return (
    <div className="filter-modal-backdrop">
      <div className="filter-modal">
        <div className="filter-modal-header">
          <h4 className="filter-modal-title">Filtrar Gastos</h4>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="filter-modal-body">
          {/* Filtro por categoría */}
          <div className="form-group">
            <input
              type="checkbox"
              id="filterCategoria"
              checked={categoriaChecked}
              onChange={(e) => {
                setCategoriaChecked(e.target.checked);
                if (!e.target.checked) {
                  setCategoria("");
                  setSubcategoria("");
                  setSubcategoriaChecked(false);
                }
              }}
            />
            <label htmlFor="filterCategoria">Categoría</label>
            {categoriaChecked && (
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="form-control mt-2"
              >
                <option value="">Seleccionar</option>
                {categoriasPredefinidas.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Filtro por subcategoría */}
          <div className="form-group">
            <input
              type="checkbox"
              id="filterSubcategoria"
              checked={subcategoriaChecked}
              onChange={(e) => {
                setSubcategoriaChecked(e.target.checked);
                if (!e.target.checked) {
                  setSubcategoria("");
                }
              }}
              disabled={!categoriaChecked || !categoria} // Habilitar solo si hay categoría seleccionada
            />
            <label htmlFor="filterSubcategoria">Subcategoría</label>
            {subcategoriaChecked && (
              <select
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="form-control mt-2"
              >
                <option value="">Seleccionar</option>
                {subcategoriasDisponibles.map((sub) => (
                  <option key={sub.ID_Subcategoria} value={sub.Nombre}>
                    {sub.Nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Filtro por periodicidad */}
            <div className="form-group">
            <input
                type="checkbox"
                id="filterPeriodicidad"
                checked={periodicidadChecked} // Este valor debe reflejar el estado real
                onChange={(e) => {
                setPeriodicidadChecked(e.target.checked);
                if (!e.target.checked) {
                    setPeriodicidad(""); // Limpiar periodicidad si se desmarca el checkbox
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
                <option value="Diario">Diario</option>
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
                </select>
            )}
            </div>


          {/* Filtro por periódico/único */}
            <div className="form-group">
            <input
                type="checkbox"
                id="filterPeriodico"
                checked={periodicoChecked} // Controla si el checkbox está seleccionado
                onChange={(e) => {
                    setPeriodicoChecked(e.target.checked);
                    if (!e.target.checked) {
                    setPeriodico(""); // Limpia el valor de "periodico" si el checkbox se desmarca
                    }
                }}
            />
            <label htmlFor="filterPeriodico">Periódico/Único</label>
            {periodicoChecked && (
                <select
                value={periodico}
                onChange={(e) => setPeriodico(e.target.value)}
                className="form-control mt-2"
                >
                <option value="">Seleccionar</option>
                <option value="1">Periódico</option>
                <option value="0">Único</option>
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
                  setFecha("");
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
                  setFechaInicio("");
                  setFechaFin("");
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

export default FilterModalGastos;
