import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/EditIncome.css';
import ConfirmationModal from './ConfirmationModal';
import Notification from './Notification';

const AddExpenseModal = ({ onClose, onSave }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedDate = location.state?.selectedDate
    ? new Date(location.state.selectedDate).toISOString().split('T')[0]
    : '';

  const [expenseData, setExpenseData] = useState({
    Descripcion: '',
    Monto: '',
    Periodicidad: '',
    Categoria: '',
    Fecha: selectedDate || '',
    Periodico: 1, // Por defecto, el gasto es periódico
    ID_Subcategoria: '', // Aquí guardaremos el ID de la subcategoría
  });

  const [isUniqueExpense, setIsUniqueExpense] = useState(false); // Nuevo estado para el checkbox de gasto único
  const [subcategories, setSubcategories] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: '',
  });

  // Función para formatear el monto como moneda
  const formatAmount = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Cuando se selecciona una nueva categoría, obtener subcategorías
    if (name === 'Categoria') {
      fetchSubcategories(value);
    }
  };

  const fetchSubcategories = async (category) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:5000/api/subcategorias/${category}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSubcategories(response.data);
    } catch (error) {
      console.error('Error al obtener subcategorías', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Error al obtener subcategorías',
      });
    }
  };

  const handleSubcategoryChange = (e) => {
    setExpenseData((prevState) => ({
      ...prevState,
      ID_Subcategoria: e.target.value, // Asignar el ID de la subcategoría seleccionada
    }));
  };

  const handleUniqueExpenseChange = (e) => {
    const isChecked = e.target.checked;
    setIsUniqueExpense(isChecked);

    setExpenseData((prevState) => ({
      ...prevState,
      Periodico: isChecked ? 0 : 1, // Si es único, Periodico es 0; si no, es 1
      Periodicidad: isChecked ? '' : prevState.Periodicidad,
      ID_Subcategoria: prevState.ID_Subcategoria, // Mantener subcategoría sin cambios
      Categoria: isChecked && prevState.Categoria === 'Fijo' ? '' : prevState.Categoria, // Limpiar si estaba en "Fijo"
    }));
  };

  const handleConfirmSave = async () => {
    try {
      const token = localStorage.getItem('token');

      const payload = {
        descripcion: expenseData.Descripcion,
        monto: expenseData.Monto.replace(/[^0-9.-]+/g, ''),
        categoria: expenseData.Categoria,
        id_subcategoria: expenseData.ID_Subcategoria, // Enviar el ID de la subcategoría
        fecha: expenseData.Fecha,
        periodicidad: expenseData.Periodico ? expenseData.Periodicidad : null,
        periodico: expenseData.Periodico,
      };

      await axios.post('http://127.0.0.1:5000/api/gasto', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotification({ show: true, type: 'success', message: 'Gasto registrado con éxito' });

      if (typeof onSave === 'function') {
        onSave();
      }

      navigate('/dashboard/gastos');
    } catch (error) {
      console.error('Error al registrar el gasto', error);
      setNotification({ show: true, type: 'error', message: 'Error al registrar el gasto' });
    } finally {
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="edit-income-container">
      <h2>Agregar Nuevo Gasto</h2>
      <form onSubmit={(e) => e.preventDefault()}>

        <div className="form-group checkbox-group">
          <label htmlFor="UniqueExpense">Es Gasto Único</label>

          <input
            type="checkbox"
            id="UniqueExpense"
            name="UniqueExpense"
            checked={isUniqueExpense}
            onChange={handleUniqueExpenseChange}
            className="form-control-checkbox"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Categoria">Categoría</label>
          <br></br><br></br>
          <select
            id="Categoria"
            name="Categoria"
            value={expenseData.Categoria}
            onChange={handleInputChange}
            className="form-control"
            required
          >
            <option value="">Selecciona la categoría</option>
            {!isUniqueExpense && <option value="Fijo">Fijo</option>}
            <option value="Variable">Variable</option>
            <option value="Inesperado">Inesperado</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ID_Subcategoria">Subcategoría</label>
          <br></br><br></br>
          <select
            id="ID_Subcategoria"
            name="ID_Subcategoria"
            value={expenseData.ID_Subcategoria}
            onChange={handleSubcategoryChange}
            className="form-control"
            required
          >
            <option value="">Selecciona la subcategoría</option>
            {subcategories.map((subcat) => (
              <option key={subcat.ID_Subcategoria} value={subcat.ID_Subcategoria}>
                {subcat.Nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="Descripcion">Descripción</label>
          <br></br><br></br>
          <input
            type="text"
            id="Descripcion"
            name="Descripcion"
            value={expenseData.Descripcion}
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
            value={expenseData.Monto}
            onChange={(e) =>
              setExpenseData((prev) => ({
                ...prev,
                Monto: formatAmount(e.target.value.replace(/\D/g, '')),
              }))
            }
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
            value={expenseData.Fecha}
            onChange={handleInputChange}
            className="form-control"
            required
          />
        </div>

        {!isUniqueExpense && (
          <div className="form-group">
            <label htmlFor="Periodicidad">Periodicidad</label>
            <br></br><br></br>
            <select
              id="Periodicidad"
              name="Periodicidad"
              value={expenseData.Periodicidad}
              onChange={handleInputChange}
              className="form-control"
              required={!isUniqueExpense}
            >
              <option value="">Selecciona la periodicidad</option>
              <option value="Diario">Diario</option>
              <option value="Semanal">Semanal</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Mensual">Mensual</option>
            </select>
          </div>
        )}

        <div className="modal-buttons">
          <button type="button" className="btn btn-primary" onClick={handleConfirmSave}>
            Guardar Gasto
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <ConfirmationModal
          message="¿Está seguro de que desea registrar este gasto?"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirmModal(false)}
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

export default AddExpenseModal;
