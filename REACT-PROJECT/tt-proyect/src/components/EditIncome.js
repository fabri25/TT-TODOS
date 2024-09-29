import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/EditIncome.css';
import ConfirmationModal from './ConfirmationModal';
import Notification from './Notification';

const EditIncome = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [incomeData, setIncomeData] = useState({
        Descripcion: '',
        Monto: '',
        Periodicidad: '',
        EsFijo: false,
        Tipo: '',
        Fecha: '',
        EsPeriodico: true, // Valor por defecto hasta obtener los datos
    });
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        const fetchIncomeData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://127.0.0.1:5000/api/user/income/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const fetchedIncome = {
                    ...response.data,
                    EsFijo: response.data.EsFijo === 1 || response.data.EsFijo === true,
                    Monto: formatAmount(response.data.Monto),
                    Fecha: new Date(response.data.Fecha).toISOString().split('T')[0], // Convertir la fecha correctamente
                };

                setIncomeData(fetchedIncome);
            } catch (error) {
                console.error("Error al obtener los datos del ingreso", error);
            }
        };

        fetchIncomeData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setIncomeData((prevState) => ({
            ...prevState,
            [name]: value || ''
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setIncomeData((prevState) => ({
            ...prevState,
            [name]: checked
        }));
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setIncomeData((prevState) => ({
            ...prevState,
            Monto: formatAmount(value)
        }));
    };

    const handleConfirmUpdate = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://127.0.0.1:5000/api/user/update_income/${id}`, {
                ...incomeData,
                Monto: incomeData.Monto.replace(/[^0-9.-]+/g, '') // Elimina el formato antes de enviar
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotification({ show: true, type: 'success', message: 'Ingreso actualizado con éxito' });
            navigate('/dashboard/ingresos');
        } catch (error) {
            console.error("Error al actualizar el ingreso", error);
            setNotification({ show: true, type: 'error', message: 'Error al actualizar el ingreso' });
        } finally {
            setShowModal(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowModal(true);
    };

    const handleCancel = () => {
        setShowModal(false);
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
            <h2>Editar Ingreso</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="Descripcion">Descripción</label>
                    <br /><br />
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
                    <br /><br />
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
                    <br /><br />
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

                {/* Ocultar periodicidad si es un ingreso único */}
                {incomeData.EsPeriodico && (
                    <>
                        <div className="form-group">
                            <label htmlFor="Periodicidad">Periodicidad</label>
                            <br /><br />
                            <select
                                id="Periodicidad"
                                name="Periodicidad"
                                value={incomeData.Periodicidad}
                                onChange={handleInputChange}
                                className="form-control"
                                required
                            >
                                <option value="">Selecciona la periodicidad</option>
                                <option value="Diario">Diario</option>
                                <option value="Semanal">Semanal</option>
                                <option value="Quincenal">Quincenal</option>
                                <option value="Mensual">Mensual</option>
                            </select>
                        </div>

                        <div className="form-group checkbox-group">
                            <label htmlFor="EsFijo"> Es Fijo</label>
                            <br /><br />
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

                <button type="submit" className="btn btn-primary">Actualizar Ingreso</button>
            </form>

            {showModal && (
                <ConfirmationModal
                    message="¿Está seguro de que desea actualizar este ingreso?"
                    onConfirm={handleConfirmUpdate}
                    onCancel={handleCancel}
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

export default EditIncome;
