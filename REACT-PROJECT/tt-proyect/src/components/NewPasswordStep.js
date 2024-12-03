import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const NewPasswordStep = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || ''; // Obtener el correo del estado de navegación

    const handleNewPasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
          const response = await axios.post('http://127.0.0.1:5000/api/update-password', { email, new_password: password });
          setSuccessMessage('Contraseña actualizada correctamente.');
            setTimeout(() => {
                navigate('/'); // Redirigir al login u otra página
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar la contraseña. Inténtalo nuevamente.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4" style={{ width: '20rem', background: 'rgba(0, 0, 0, 0.55)', borderRadius: '15px' }}>
                <div className="text-center">
                    <i className="bi bi-key mb-3" style={{ fontSize: '4rem', color: 'white' }}></i>
                    <h2 className="h5 mb-4 text-white">NUEVA CONTRASEÑA</h2>
                </div>
                <form onSubmit={handleNewPasswordSubmit}>
                    <div className="form-group position-relative">
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="form-group position-relative mt-3">
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-danger mt-2">{error}</p>}
                    {successMessage && <p className="text-success mt-2">{successMessage}</p>}
                    <div className="text-center mb-3 mt-4">
                        <button type="submit" className="btn btn-outline-light">Actualizar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewPasswordStep;
