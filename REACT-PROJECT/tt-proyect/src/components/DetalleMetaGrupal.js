import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../styles/DetalleMeta.css";

const DetalleMetaGrupal = () => {
  const { grupoId, metaId } = useParams();
  const [meta, setMeta] = useState(null);
  const [aporte, setAporte] = useState({
    monto: "",
    fecha: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMeta(); // Carga la meta y los aportes
  }, []);

  const fetchMeta = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/metas/${metaId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data) {
        setMeta(response.data); // Establecemos la meta y los aportes
      }
    } catch (error) {
      console.error("Error al obtener la meta grupal", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const faltante = meta.Monto_Objetivo - meta.Monto_Actual;
    if (parseFloat(aporte.monto) > faltante) {
      setError('El monto no puede ser mayor al faltante para concluir la meta.');
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      const data = {
        monto: parseFloat(aporte.monto), // Asegurar que el monto sea un número
        fecha: aporte.fecha,
      };
      await axios.post(
        `http://127.0.0.1:5000/api/grupo/${grupoId}/metas/${metaId}/aportes`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setAporte({ monto: '', fecha: '' });
      setError('');
      fetchMeta(); // Refrescar los datos después de registrar
    } catch (error) {
      console.error('Error al registrar el aporte grupal', error);
      setError('Error al registrar el aporte. Por favor, intenta de nuevo.');
    }
  };
  

  const porcentajeCumplimiento = meta
    ? ((meta.Monto_Actual || 0) / meta.Monto_Objetivo) * 100
    : 0;

  const faltanteParaConcluir = meta
    ? meta.Monto_Objetivo - meta.Monto_Actual
    : 0;

  return (
    <div className="detalle-meta-container">
      {meta ? (
        <>
          <h2>{meta.Descripcion}</h2>
          <p>
            <strong>Monto Objetivo:</strong>{" "}
            {parseFloat(meta.Monto_Objetivo).toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </p>
          <p>
            <strong>Fecha de Inicio:</strong>{" "}
            {new Date(meta.Fecha_Inicio).toLocaleDateString()}
          </p>
          <p>
            <strong>Fecha Límite:</strong>{" "}
            {new Date(meta.Fecha_Limite).toLocaleDateString()}
          </p>
          <p>
            <strong>Monto Ahorrado:</strong>{" "}
            {parseFloat(meta.Monto_Actual).toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </p>
          <p>
            <strong>Faltante para Concluir:</strong>{" "}
            {parseFloat(faltanteParaConcluir).toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </p>

          <div className="progress-bar-container">
            <div
                className="progress"
                style={{ width: `${porcentajeCumplimiento}%` }} // Calcula dinámicamente el ancho
            ></div>
                <div className="progress-text">
                    {porcentajeCumplimiento.toFixed(2)}%
                </div>
            </div>

          <h3>Aportes Registrados</h3>
          {meta.Aportes && meta.Aportes.length > 0 ? (
            <table className="transacciones-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {meta.Aportes.map((aporte) => (
                  <tr key={aporte.ID_Aporte}>
                    <td>
                      {new Date(aporte.Fecha_Aporte).toLocaleDateString()}
                    </td>
                    <td>
                      {parseFloat(aporte.Monto_Aporte).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </td>
                    <td>{aporte.Responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No se han registrado aportes aún.</p>
          )}

          <h3>Registrar Aporte</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="number"
              placeholder="Monto"
              value={aporte.monto}
              onChange={(e) =>
                setAporte({ ...aporte, monto: e.target.value })
              }
              required
            />
            <input
              type="date"
              placeholder="Fecha"
              value={aporte.fecha}
              onChange={(e) =>
                setAporte({ ...aporte, fecha: e.target.value })
              }
              required
            />
            <button type="submit">Registrar</button>
          </form>
          {error && <p className="error">{error}</p>}
        </>
      ) : (
        <p>Cargando los detalles de la meta...</p>
      )}
    </div>
  );
};

export default DetalleMetaGrupal;
