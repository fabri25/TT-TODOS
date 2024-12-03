import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const VerificationStep = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || ''; // Obtén el correo del estado

    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            const response = await axios.post('http://127.0.0.1:5000/api/verify-code', { email, code });
            setSuccessMessage('Código verificado correctamente.');
            console.log(email); // Verifica si el email es correcto
            setTimeout(() => {
                navigate('/new-password', { state: { email } }); // Redirige con el estado
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Código incorrecto. Inténtalo nuevamente.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4" style={{ width: '20rem', background: 'rgba(0, 0, 0, 0.55)', borderRadius: '15px' }}>
                <div className="text-center">
                    <i className="bi bi-shield-lock mb-3" style={{ fontSize: '4rem', color: 'white' }}></i>
                    <h2 className="h5 mb-4 text-white">VERIFICACIÓN DE CÓDIGO</h2>
                </div>
                <form onSubmit={handleVerificationSubmit}>
                    <div className="form-group position-relative">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Código de verificación"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-danger mt-2">{error}</p>}
                    {successMessage && <p className="text-success mt-2">{successMessage}</p>}
                    <div className="text-center mb-3 mt-4">
                        <button type="submit" className="btn btn-outline-light">Verificar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerificationStep;
