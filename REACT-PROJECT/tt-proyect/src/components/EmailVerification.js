import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/EmailVerification.css';

const EmailVerification = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:5000/confirm_email/${token}`);
                if (response.status === 200) {
                    setMessage('Correo verificado con éxito.');
                } else {
                    setMessage('Hubo un error al verificar tu correo.');
                }
            } catch (error) {
                setMessage('Hubo un error al verificar tu correo.');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token]);

    return (
        <div className="email-verification-container">
            <div className="email-verification-box">
                <h1 className="email-verification-title">Verificación de Correo</h1>
                <p className="email-verification-message">{message}</p>
                <button
                    className="email-verification-button"
                    onClick={() => navigate('/')}
                >
                    Ir a Inicio de Sesión
                </button>
            </div>
        </div>
    );
};

export default EmailVerification;
