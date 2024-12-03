import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EmailStep = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');
  
      if (!/\S+@\S+\.\S+/.test(email)) {
          setError('Introduce un correo válido.');
          return;
      }
  
      try {
          const response = await axios.post('http://127.0.0.1:5000/api/forgot-password', { email });
          setSuccessMessage('El código de verificación ha sido enviado a tu correo.');
          setTimeout(() => {
              navigate('/recover-code', { state: { email } });
          }, 2000);
      } catch (err) {
          setError(err.response?.data?.error || 'Ocurrió un error. Inténtalo nuevamente.');
      }
  };
  

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4" style={{ width: '20rem', background: 'rgba(0, 0, 0, 0.55)', borderRadius: '15px' }}>
                <div className="text-center">
                    <i className="bi bi-person-circle mb-3" style={{ fontSize: '4rem', color: 'white' }}></i>
                    <h2 className="h5 mb-4 text-white">RECUPERAR CONTRASEÑA</h2>
                </div>
                <form onSubmit={handleEmailSubmit}>
                    <div className="form-group position-relative">
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Correo"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-danger mt-2">{error}</p>}
                    {successMessage && <p className="text-success mt-2">{successMessage}</p>}
                    <div className="text-center mb-3 mt-4">
                        <button type="submit" className="btn btn-outline-light">Continuar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailStep;
