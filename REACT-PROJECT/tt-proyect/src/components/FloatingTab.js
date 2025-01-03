import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  
import '../styles/FloatingTab.css';
import { useNavigate } from 'react-router-dom';

const FloatingTab = ({ onSave }) => {
  const [incomes, setIncomes] = useState([
    { frequency: '', amount: '', isFixed: false, type: '', description: '', date: '' },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('modal-open');

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleAmountChange = (index, e) => {
    const value = e.target.value.replace(/\D/g, ''); 
    const updatedIncomes = [...incomes];
    updatedIncomes[index].amount = value;
    setIncomes(updatedIncomes);
  };

  const handleFrequencyChange = (index, e) => {
    const updatedIncomes = [...incomes];
    updatedIncomes[index].frequency = e.target.value;
    setIncomes(updatedIncomes);
  };

  const handleFixedChange = (index, e) => {
    const updatedIncomes = [...incomes];
    updatedIncomes[index].isFixed = e.target.checked;
    setIncomes(updatedIncomes);
  };

  const handleTypeChange = (index, e) => {
    const updatedIncomes = [...incomes];
    updatedIncomes[index].type = e.target.value;
    setIncomes(updatedIncomes);
  };

  const handleDescriptionChange = (index, e) => {
    const updatedIncomes = [...incomes];
    updatedIncomes[index].description = e.target.value;
    setIncomes(updatedIncomes);
  };

  const handleDateChange = (index, e) => {
    const updatedIncomes = [...incomes];
    updatedIncomes[index].date = e.target.value;
    setIncomes(updatedIncomes);
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddIncome = () => {
    if (incomes.length < 5) {
      setIncomes([
        ...incomes,
        { frequency: '', amount: '', isFixed: false, type: '', description: '', date: '' },
      ]);
    }
  };

  const handleRemoveIncome = (index) => {
    if (incomes.length > 1) {
      const updatedIncomes = incomes.filter((_, i) => i !== index);
      setIncomes(updatedIncomes);
    }
  };

  

  const handleSave = async () => {
    const token = localStorage.getItem('token'); 
    
    if (!token) {
      navigate('/'); 
      return;
    }

    const decodedToken = jwtDecode(token);
    
    if (decodedToken.exp * 1000 < Date.now()) {
      localStorage.clear(); 
      navigate('/');
      return;
    }

    const userID = localStorage.getItem('userID');
  
    const validIncomes = incomes.filter(income => income.frequency && income.amount && income.type && income.description && income.date);
    
    if (validIncomes.length > 0) {
      try {
        for (const income of validIncomes) {
          await axios.post('http://127.0.0.1:5000/api/ingreso', {
            id_usuario: userID,
            monto: income.amount,
            periodicidad: income.frequency,
            descripcion: income.description,
            esFijo: income.isFixed,
            tipo: income.type,
            fecha: income.date,  // Enviar la fecha seleccionada
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
  
        if (onSave) {
          onSave(validIncomes);
        }

        
      } catch (error) {
        console.error('Error al guardar el ingreso:', error);
        alert('Hubo un error al guardar el ingreso. Inténtalo nuevamente.');
      }
    } else {
      alert('Debe capturar al menos un ingreso válido.');
    }
  };

  return (
    <div className="floating-tab-backdrop">
      <div className="floating-tab">
        <h4>¿Cada cuánto recibes tu ingreso?</h4>
        <div className="form-group">
          {incomes.map((income, index) => (
            <div key={index} className="income-entry">
              <p>Ingreso {index + 1}</p>
              <select
                id={`frequency-${index}`}
                value={income.frequency}
                onChange={(e) => handleFrequencyChange(index, e)}
              >
                <option value="">Frecuencia</option>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
              <br></br><br></br>

              <input
                type="date"
                id={`date-${index}`}
                value={income.date}
                onChange={(e) => handleDateChange(index, e)}
                className="form-control"
              />

              <div className="form-group input-group">
                <span className="input-group-text"></span>
                <input
                  type="text"
                  id={`amount-${index}`}
                  className="form-control"
                  placeholder="Ingreso"
                  value={formatAmount(income.amount)}
                  onChange={(e) => handleAmountChange(index, e)}
                />
              </div>

              <div className="form-group">
                <select
                  id={`type-${index}`}
                  value={income.type}
                  onChange={(e) => handleTypeChange(index, e)}
                >
                  <option value="">Selecciona tipo</option>
                  <option value="activo">Activo</option>
                  <option value="pasivo">Pasivo</option>
                </select>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id={`description-${index}`}
                  className="form-control"
                  placeholder="Descripción"
                  value={income.description}
                  onChange={(e) => handleDescriptionChange(index, e)}
                />
              </div>
              <div className="form-group">
                <input
                  type="checkbox"
                  id={`fixed-${index}`}
                  checked={income.isFixed}
                  onChange={(e) => handleFixedChange(index, e)}
                />
                <label htmlFor={`fixed-${index}`}>¿Es fijo?</label>
              </div>

              {incomes.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveIncome(index)}
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {incomes.length < 5 && (
          <div className="form-group">
            <button
              type="button"
              className="btn-add-income"  // Clases CSS para el nuevo botón verde
              onClick={handleAddIncome}
            >
              Agregar otro ingreso
            </button>
          </div>
        )}

        <button type="button" onClick={handleSave}>
          Guardar
        </button>
      </div>
    </div>
  );
};

export default FloatingTab;
