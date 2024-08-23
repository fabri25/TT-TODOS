import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from '../assets/images/background.jpg';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleForgotPasswordClick = () => {
    navigate('/recover-email');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post('http://127.0.0.1:5000/api/login', 
        {
            email, 
            password
        }, 
        {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(response.data);  // Verificar qué datos están regresando

        if (response.status === 200 && response.data) {
            console.log("Login exitoso");  // Confirmar que el login fue exitoso
            navigate('/dashboard'); // Redirige al MainLayout después de iniciar sesión
        } else {
            setError('Correo o contraseña incorrectos');
        }
    } catch (err) {
        console.error(err.response?.data?.error || 'Error en la conexión con el servidor');
        setError('Correo o contraseña incorrectos');
    }
};


  return (
    <div className="container d-flex justify-content-center align-items-center vh-100" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="card p-4" style={{ width: '20rem', background: 'rgba(0, 0, 0, 0.55)', borderRadius: '15px' }}>
        <div className="text-center">
          <i className="bi bi-person-circle mb-3" style={{ fontSize: '4rem', color: 'white' }}></i>
          <p className="h mb-4 text-white">INICIA SESIÓN CON TU CUENTA</p>
        </div>
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group position-relative">
            <span className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#000' }}>
              <i className="bi bi-person"></i>
            </span>
            <input 
              type="email" 
              className="form-control with-icon" 
              placeholder=" " 
              id="email" 
              style={{ paddingLeft: '2.5rem' }} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <label htmlFor="email" className="form-label">Correo</label>
          </div>
          <div className="form-group position-relative">
            <span className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#000' }}>
              <i className="bi bi-lock"></i>
            </span>
            <input 
              type="password" 
              className="form-control with-icon" 
              placeholder=" " 
              id="password" 
              style={{ paddingLeft: '2.5rem' }} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <label htmlFor="password" className="form-label">Contraseña</label>
          </div>
          {error && <p className="text-danger">{error}</p>}
          <div className="text-center mb-3">
            <button type="button" className="btn btn-link" onClick={handleForgotPasswordClick}>¿Olvidaste tu contraseña?</button>
          </div>
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-outline-light">Ingresar al sistema</button>
            <button type="button" className="btn btn-outline-light">Registro</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
