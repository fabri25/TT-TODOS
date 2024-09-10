// IncomeList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';  // Importa el nuevo componente
import '../styles/IncomeList.css';

const IncomeList = () => {
    const [ingresos, setIngresos] = useState([]);
    const [showModal, setShowModal] = useState(false);  // Estado para controlar la visibilidad del modal
    const [incomeToDelete, setIncomeToDelete] = useState(null);  // Estado para almacenar el ingreso a eliminar
    const navigate = useNavigate();

    useEffect(() => {
        const fetchIngresos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:5000/api/user/incomes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIngresos(response.data);
            } catch (error) {
                console.error("Error al obtener los ingresos", error);
            }
        };

        fetchIngresos();
    }, []);

    const handleDelete = (id) => {
        setIncomeToDelete(id);
        setShowModal(true);  // Mostrar la ventana modal para confirmar la eliminación
    };

    const confirmDelete = async () => {
        if (!incomeToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://127.0.0.1:5000/api/user/incomes/${incomeToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIngresos(ingresos.filter((ingreso) => ingreso.ID_Ingreso !== incomeToDelete));
            setShowModal(false);
            setIncomeToDelete(null);  // Resetea el ingreso seleccionado
        } catch (error) {
            console.error("Error al eliminar el ingreso", error);
        }
    };

    const cancelDelete = () => {
        setShowModal(false);
        setIncomeToDelete(null);  // Resetea el ingreso seleccionado
    };

    const handleEdit = (idIngreso) => {
        console.log("ID del ingreso a editar:", idIngreso); // Agregar este log
        navigate(`/dashboard/edit-income/${idIngreso}`);
    };

    return (
        <div className="income-list-container">
            <h2>Lista de Ingresos</h2>
            <table className="income-table">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th>Monto</th>
                        <th>Periodicidad</th>
                        <th>Es Fijo</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Editar</th>
                        <th>Eliminar</th>
                    </tr>
                </thead>
                <tbody>
                    {ingresos.map((ingreso) => (
                        <tr key={ingreso.ID_Ingreso}>
                            <td>{ingreso.Descripcion}</td>
                            <td>{ingreso.Monto}</td>
                            <td>{ingreso.Periodicidad}</td>
                            <td>{ingreso.EsFijo ? 'Sí' : 'No'}</td>
                            <td>{ingreso.Tipo}</td>
                            <td>{new Date(ingreso.Fecha).toISOString().split('T')[0]}</td>
                            <td>
                                <button className="btn btn-warning btn-sm" onClick={() => handleEdit(ingreso.ID_Ingreso)}>
                                    <i className="bi bi-pencil-square"></i>
                                </button>
                            </td>
                            <td>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ingreso.ID_Ingreso)}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <ConfirmationModal
                    message="¿Estás seguro de que deseas eliminar este ingreso?"
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
};

export default IncomeList;
