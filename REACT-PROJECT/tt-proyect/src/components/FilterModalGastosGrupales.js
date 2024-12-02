import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../styles/FilterModal.css"; // Asegúrate de tener un archivo de estilos adecuado

const FilterModalGastosGrupales = ({ initialFilters, onApplyFilters, onClose }) => {
  const { grupoId } = useParams(); // Obtener el grupoId de la URL
  const [estado, setEstado] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [miembros, setMiembros] = useState([]); // Lista de miembros confirmados del grupo

  const [estadoChecked, setEstadoChecked] = useState(false);
  const [responsableChecked, setResponsableChecked] = useState(false);
  const [fechaChecked, setFechaChecked] = useState(false);
  const [rangoChecked, setRangoChecked] = useState(false);

  // Log para verificar el grupoId
  useEffect(() => {
    console.log("Valor actual de grupoId:", grupoId);
    if (!grupoId) {
      console.error("El grupoId no está definido o es inválido.");
    }
  }, [grupoId]);

  // Cargar miembros confirmados del grupo
  useEffect(() => {
    const fetchMiembros = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Token no disponible. El usuario no está autenticado.");
          return;
        }

        const response = await axios.get(
          `http://127.0.0.1:5000/api/grupo/${grupoId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.Miembros) {
          setMiembros(
            response.data.Miembros.filter((miembro) => miembro.Confirmado === 1)
          );
        }
      } catch (error) {
        console.error("Error al obtener los miembros del grupo:", error);
      }
    };

    if (grupoId) {
      fetchMiembros();
    }
  }, [grupoId]);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.estado) {
        setEstado(initialFilters.estado);
        setEstadoChecked(true);
      }
      if (initialFilters.responsable) {
        setResponsable(initialFilters.responsable);
        setResponsableChecked(true);
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
    setEstado("");
    setResponsable("");
    setFecha("");
    setFechaInicio("");
    setFechaFin("");
    setEstadoChecked(false);
    setResponsableChecked(false);
    setFechaChecked(false);
    setRangoChecked(false);
  };

  const handleApply = () => {
    const filters = {
      estado: estadoChecked ? estado : null,
      responsable: responsableChecked ? responsable : null,
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
          <h4 className="filter-modal-title">Filtrar Gastos Grupales</h4>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="filter-modal-body">
          {/* Filtro por estado */}
          <div className="form-group">
            <input
              type="checkbox"
              id="filterEstado"
              checked={estadoChecked}
              onChange={(e) => {
                setEstadoChecked(e.target.checked);
                if (!e.target.checked) {
                  setEstado("");
                }
              }}
            />
            <label htmlFor="filterEstado">Estado</label>
            {estadoChecked && (
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="form-control mt-2"
              >
                <option value="">Seleccionar</option>
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            )}
          </div>

          {/* Filtro por responsable */}
          <div className="form-group">
            <input
              type="checkbox"
              id="filterResponsable"
              checked={responsableChecked}
              onChange={(e) => {
                setResponsableChecked(e.target.checked);
                if (!e.target.checked) {
                  setResponsable("");
                }
              }}
            />
            <label htmlFor="filterResponsable">Responsable</label>
            {responsableChecked && (
              <select
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="form-control mt-2"
              >
                <option value="">Seleccionar</option>
                {miembros.map((miembro) => (
                  <option key={miembro.ID_Usuario} value={miembro.ID_Usuario}>
                    {miembro.Nombre_Completo}
                  </option>
                ))}
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

export default FilterModalGastosGrupales;
