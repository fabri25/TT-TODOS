import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/EditIncome.css';
import ConfirmationModal from './ConfirmationModal';
import Notification from './Notification';

const EditExpenseModal = () => {
  const navigate = useNavigate();
  const { idGasto } = useParams(); // Obtener el ID del gasto desde la URL

  const [expenseData, setExpenseData] = useState({
    Descripcion: '',
    Monto: '',
    Periodicidad: '',
    Categoria: '',
    Fecha: '',
    Periodico: 1, // Por defecto, el gasto es periódico
    ID_Subcategoria: '', // Aquí guardaremos el ID de la subcategoría
  });

  const [isUniqueExpense, setIsUniqueExpense] = useState(false); // Estado para el checkbox de gasto único
  const [subcategories, setSubcategories] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: '',
  });

  useEffect(() => {
    fetchExpenseDetails();
  }, []);

  const fetchExpenseDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:5000/api/gasto/${idGasto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      setExpenseData({
        Descripcion: data.Descripcion,
        Monto: formatAmount(parseInt(data.Monto, 10)), // Formatear monto como moneda sin decimales
        Periodicidad: data.Periodicidad || '',
        Categoria: data.Categoria,
        Fecha: new Date(data.Fecha).toISOString().split('T')[0], // Asegurar formato de fecha
        Periodico: data.Periodico,
        ID_Subcategoria: data.ID_Subcategoria || '', // Manejar casos sin subcategorías
      });
      setIsUniqueExpense(data.Periodico === 0);
      if (data.Categoria) {
        fetchSubcategories(data.Categoria);
      }
    } catch (error) {
      console.error('Error al obtener los detalles del gasto', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Error al obtener los detalles del gasto',
      });
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0, // Sin decimales
    }).format(amount);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === 'Categoria') {
      fetchSubcategories(value);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Eliminar cualquier carácter no numérico
    setExpenseData((prevState) => ({
      ...prevState,
      Monto: formatAmount(value), // Formatear monto mientras se escribe
    }));
  };

  const handleSubcategoryChange = (e) => {
    setExpenseData((prevState) => ({
      ...prevState,
      ID_Subcategoria: e.target.value,
    }));
  };

  const handleUniqueExpenseChange = (e) => {
    const isChecked = e.target.checked;
    setIsUniqueExpense(isChecked);

    setExpenseData((prevState) => ({
      ...prevState,
      Periodico: isChecked ? 0 : 1,
      Periodicidad: isChecked ? '' : prevState.Periodicidad,
    }));
  };

  const handleConfirmSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        descripcion: expenseData.Descripcion,
        monto: expenseData.Monto.replace(/[^0-9]/g, ''), // Asegurarse de enviar solo números
        categoria: expenseData.Categoria,
        id_subcategoria: expenseData.ID_Subcategoria,
        fecha: expenseData.Fecha,
        periodicidad: expenseData.Periodico ? expenseData.Periodicidad : null,
        periodico: expenseData.Periodico,
      };

      await axios.put(`http://127.0.0.1:5000/api/gasto/actualizar/${idGasto}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotification({
        show: true,
        type: 'success',
        message: 'Gasto actualizado con éxito',
      });

      navigate('/dashboard/gastos');
    } catch (error) {
      console.error('Error al actualizar el gasto', error);
      setNotification({
        show: true,
        type: 'error',
        message: 'Error al actualizar el gasto',
      });
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  return (
    <div className="edit-income-container">
      <h2>Editar Gasto</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group checkbox-group">
          <label htmlFor="UniqueExpense">Es Gasto Único</label>
          <br /><br />
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
          <br /><br />
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
          <br /><br />
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
          <br /><br />
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
          <br /><br />
          <input
            type="text"
            id="Monto"
            name="Monto"
            value={expenseData.Monto}
            onChange={handleAmountChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Fecha">Fecha</label>
          <br /><br />
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
            <br /><br />
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
          <button type="button" className="btn btn-primary" onClick={handleSaveClick}>
            Guardar Cambios
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/gastos')}>
            Cancelar
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <ConfirmationModal
          message="¿Está seguro de que desea actualizar este gasto?"
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

export default EditExpenseModal;
