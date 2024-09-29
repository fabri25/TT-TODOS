import React, { useState } from 'react';
import '../styles/EditIncome.css'; // Usaremos el mismo estilo de EditIncome para mantener la consistencia
import ConfirmationModal from './ConfirmationModal';
import Notification from './Notification';  // Importar el nuevo componente de notificación
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddIncomeModal = ({ onClose, onSave }) => {
  const [incomeData, setIncomeData] = useState({
    Descripcion: '',
    Monto: '',
    Periodicidad: '',
    EsFijo: false,
    Tipo: '',
    Fecha: '',
    EsPeriodico: true, // Por defecto es periódico (ya que esto depende del check de EsGastoUnico)
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false); // Estado para mostrar/ocultar la ventana modal de confirmación
  const [notification, setNotification] = useState({ show: false, type: '', message: '' }); // Estado para manejar la notificación
  const navigate = useNavigate();

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIncomeData((prevState) => ({
      ...prevState,
      [name]: value || '' // Asigna un string vacío si el valor es null o undefined
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;

    // Si se selecciona "EsGastoUnico", EsPeriodico debe ser false
    if (name === 'EsPeriodico') {
      setIncomeData((prevState) => ({
        ...prevState,
        EsPeriodico: !checked, // Si EsGastoUnico está marcado, EsPeriodico será false
        EsFijo: checked ? null : prevState.EsFijo, // Si es gasto único, EsFijo debe ser null
      }));
    } else {
      setIncomeData((prevState) => ({
        ...prevState,
        [name]: checked
      }));
    }
  };

  // Formatear monto
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Elimina cualquier carácter que no sea un dígito
    setIncomeData((prevState) => ({
      ...prevState,
      Monto: formatAmount(value)
    }));
  };

  // Enviar los datos a la API
  const handleConfirmSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        descripcion: incomeData.Descripcion,
        monto: incomeData.Monto.replace(/[^0-9.-]+/g, ''),
        tipo: incomeData.Tipo,
        fecha: incomeData.Fecha,
        periodicidad: incomeData.EsPeriodico ? incomeData.Periodicidad : null, // Solo enviar periodicidad si es periódico
        esFijo: incomeData.EsPeriodico ? incomeData.EsFijo : null, // Solo enviar EsFijo si es periódico
        es_periodico: incomeData.EsPeriodico,
      };

      await axios.post('http://127.0.0.1:5000/api/ingreso', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ show: true, type: 'success', message: 'Ingreso registrado con éxito' });

      // Llama a onSave si está definido y es una función válida
      if (typeof onSave === 'function') {
        onSave();
      }

      navigate('/dashboard/ingresos'); // Redirigir a la ruta de ingresos

    } catch (error) {
      console.error("Error al registrar el ingreso", error);
      setNotification({ show: true, type: 'error', message: 'Error al registrar el ingreso' });
    } finally {
      setShowConfirmModal(false); // Ocultar la ventana modal después de la confirmación
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false); // Ocultar el modal de confirmación si el usuario cancela
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true); // Mostrar el modal de confirmación antes de guardar
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="edit-income-container">
      <h2>Agregar Nuevo Ingreso</h2>
      <form onSubmit={handleSubmit}>

        {/* Mover check de EsGastoUnico al principio */}
        <div className="form-group checkbox-group">
          <label htmlFor="EsPeriodico">Es Ingreso Único</label>
          <input
            type="checkbox"
            id="EsPeriodico"
            name="EsPeriodico"
            checked={!incomeData.EsPeriodico} // EsPeriodico es false cuando es gasto único
            onChange={handleCheckboxChange}
            className="form-control-checkbox"
          />
        </div>

        {/* Solo mostrar Periodicidad y EsFijo si no es Gasto Único */}
        {incomeData.EsPeriodico && (
          <>
            <div className="form-group">
              <label htmlFor="Periodicidad">Periodicidad</label>
              <br></br><br></br>
              <select
                id="Periodicidad"
                name="Periodicidad"
                value={incomeData.Periodicidad}
                onChange={handleInputChange}
                className="form-control"
                required={incomeData.EsPeriodico} // Requerido si es periódico
              >
                <option value="">Selecciona la periodicidad</option>
                <option value="Diario">Diario</option>
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="EsFijo">Es Fijo</label>
              <input
                type="checkbox"
                id="EsFijo"
                name="EsFijo"
                checked={incomeData.EsFijo}
                onChange={handleCheckboxChange}
                className="form-control-checkbox"
              />
            </div>
          </>
        )}

        {/* Campos de Descripción, Monto, Tipo, y Fecha */}
        <div className="form-group">
          <label htmlFor="Descripcion">Descripción</label>
          <br></br><br></br>
          <input
            type="text"
            id="Descripcion"
            name="Descripcion"
            value={incomeData.Descripcion}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Monto">Monto</label>
          <br></br><br></br>
          <input
            type="text"
            id="Monto"
            name="Monto"
            value={incomeData.Monto}
            onChange={handleAmountChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Fecha">Fecha</label>
          <br></br><br></br>
          <input
            type="date"
            id="Fecha"
            name="Fecha"
            value={incomeData.Fecha}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Tipo">Tipo</label>
          <br></br><br></br>
          <select
            id="Tipo"
            name="Tipo"
            value={incomeData.Tipo}
            onChange={handleInputChange}
            className="form-control"
            required
          >
            <option value="">Selecciona el tipo</option>
            <option value="Activo">Activo</option>
            <option value="Pasivo">Pasivo</option>
          </select>
        </div>

        <div className="modal-buttons">
          <button type="submit" className="btn btn-primary">Guardar Ingreso</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </form>

      {showConfirmModal && (
        <ConfirmationModal
          message="¿Está seguro de que desea registrar este ingreso?"
          onConfirm={handleConfirmSave}
          onCancel={handleCancelConfirm}
        />
      )}

      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ show: false, type: '', message: '' })}
        />
      )}
    </div>
  );
};

export default AddIncomeModal;
