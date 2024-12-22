import React, { useState, useEffect } from 'react';
import '../styles/EditIncome.css';
import ConfirmationModal from './ConfirmationModal';
import Notification from './Notification';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const AddIncomeModal = ({ onClose, onSave }) => {
  const location = useLocation(); // Para obtener la fecha pasada
  const navigate = useNavigate();
  
  // Recibe la fecha seleccionada desde el estado de location
  const selectedDate = location.state?.selectedDate ? new Date(location.state.selectedDate).toISOString().split('T')[0] : '';

  const [incomeData, setIncomeData] = useState({
    Descripcion: '',
    Monto: '',
    Periodicidad: '',
    EsFijo: false,
    Tipo: '',
    Fecha: selectedDate || '', // Prellenar con la fecha seleccionada
    EsPeriodico: true,
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIncomeData((prevState) => ({
      ...prevState,
      [name]: value || ''
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;

    if (name === 'EsPeriodico') {
      setIncomeData((prevState) => ({
        ...prevState,
        EsPeriodico: !checked,
        EsFijo: checked ? null : prevState.EsFijo,
      }));
    } else {
      setIncomeData((prevState) => ({
        ...prevState,
        [name]: checked
      }));
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setIncomeData((prevState) => ({
      ...prevState,
      Monto: formatAmount(value)
    }));
  };

  const handleConfirmSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        descripcion: incomeData.Descripcion,
        monto: incomeData.Monto.replace(/[^0-9.-]+/g, ''),
        tipo: incomeData.Tipo,
        fecha: incomeData.Fecha,
        periodicidad: incomeData.EsPeriodico ? incomeData.Periodicidad : null,
        esFijo: incomeData.EsPeriodico ? incomeData.EsFijo : null,
        es_periodico: incomeData.EsPeriodico,
      };

      await axios.post('http://127.0.0.1:5000/api/ingreso', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({ show: true, type: 'success', message: 'Ingreso registrado con éxito' });

      if (typeof onSave === 'function') {
        onSave();
      }

      navigate('/dashboard/ingresos');

    } catch (error) {
      console.error("Error al registrar el ingreso", error);
      setNotification({ show: true, type: 'error', message: 'Error al registrar el ingreso' });
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
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

        <div className="form-group checkbox-group">
          <label htmlFor="EsPeriodico">Es Ingreso Único</label>
          <input
            type="checkbox"
            id="EsPeriodico"
            name="EsPeriodico"
            checked={!incomeData.EsPeriodico}
            onChange={handleCheckboxChange}
            className="form-control-checkbox"
          />
        </div>

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
                required={incomeData.EsPeriodico}
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
            value={incomeData.Fecha} // Mostramos la fecha seleccionada aquí
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
