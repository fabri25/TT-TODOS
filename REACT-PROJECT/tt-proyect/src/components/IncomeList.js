// IncomeList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/IncomeList.css';

const IncomeList = () => {
    const [ingresos, setIngresos] = useState([]);

    useEffect(() => {
        const fetchIngresos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://127.0.0.1:5000/api/incomes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIngresos(response.data);
            } catch (error) {
                console.error("Error al obtener los ingresos", error);
            }
        };

        fetchIngresos();
    }, []);

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
                            <td>{new Date(ingreso.Fecha).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default IncomeList;
