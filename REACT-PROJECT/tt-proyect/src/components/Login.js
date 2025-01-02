import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from '../assets/images/background.jpg';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Register.css';

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
      const response = await axios.post(
        'http://127.0.0.1:5000/api/login',
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Respuesta del endpoint:', response.data);

      if (response.status === 200 && response.data) {
        const {
          token,
          user,
          hasIncome,
          showFloatingTabIncome,
          descripcionIngresoNoFijo,
          montoIngresoNoFijo,
          fechaUltimoIngresoNoFijo,
          fechaTerminoPeriodoNoFijo,
          showFloatingTabFixedIncome,
          descripcionIngresoFijo,
          montoIngresoFijo,
          fechaUltimoIngresoFijo,
          fechaTerminoPeriodoFijo,
          pertenece_a_grupo,
          es_admin_grupo,
          grupos_administrados,
          grupos_pertenecientes,
          hasMetas,
          hasAhorros,
          hasDeudas,
        } = response.data;

        // Guardar el token en el almacenamiento local
        localStorage.setItem('token', token);

        // Guardar el ID del usuario y el estado hasIncome en el almacenamiento local
        localStorage.setItem('userID', user.ID_Usuario);
        localStorage.setItem('hasIncome', hasIncome);

        // Guardar las variables de pertenencia a grupo y rol de administrador en el almacenamiento local
        localStorage.setItem('pertenece_a_grupo', pertenece_a_grupo);
        localStorage.setItem('es_admin_grupo', es_admin_grupo);

        // Guardar las banderas en el localStorage
        localStorage.setItem('hasMetas', hasMetas);
        localStorage.setItem('hasAhorros', hasAhorros);
        localStorage.setItem('hasDeudas', hasDeudas);

        // Guardar información de los grupos en el almacenamiento local
        localStorage.setItem(
          'grupos_administrados',
          JSON.stringify(grupos_administrados)
        );
        localStorage.setItem(
          'grupos_pertenecientes',
          JSON.stringify(grupos_pertenecientes)
        );

        // Si se debe mostrar la ventana flotante de ingreso no fijo
        if (showFloatingTabIncome) {
          localStorage.setItem('showFloatingTabIncome', 'true');
          localStorage.setItem('descripcionIngresoNoFijo', descripcionIngresoNoFijo);
          localStorage.setItem('montoIngresoNoFijo', montoIngresoNoFijo);
          localStorage.setItem('fechaUltimoIngresoNoFijo', fechaUltimoIngresoNoFijo);
          localStorage.setItem('fechaTerminoPeriodoNoFijo', fechaTerminoPeriodoNoFijo);
        } else {
          localStorage.setItem('showFloatingTabIncome', 'false');
        }

        // Si se debe mostrar la ventana flotante de ingreso fijo
        if (showFloatingTabFixedIncome) {
          localStorage.setItem('showFloatingTabFixedIncome', 'true');
          localStorage.setItem('descripcionIngresoFijo', descripcionIngresoFijo);
          localStorage.setItem('montoIngresoFijo', montoIngresoFijo);
          localStorage.setItem('fechaUltimoIngresoFijo', fechaUltimoIngresoFijo);
          localStorage.setItem('fechaTerminoPeriodoFijo', fechaTerminoPeriodoFijo);
        } else {
          localStorage.setItem('showFloatingTabFixedIncome', 'false');
        }

        // Verificar lo que se ha guardado en el localStorage
        console.log('Valores guardados en localStorage:');
        console.log('Token:', localStorage.getItem('token'));
        console.log('UserID:', localStorage.getItem('userID'));
        console.log('hasIncome:', localStorage.getItem('hasIncome'));
        console.log('pertenece_a_grupo:', localStorage.getItem('pertenece_a_grupo'));
        console.log('es_admin_grupo:', localStorage.getItem('es_admin_grupo'));
        console.log('descripcionIngresoNoFijo:', localStorage.getItem('descripcionIngresoNoFijo'));
        console.log('montoIngresoNoFijo:', localStorage.getItem('montoIngresoNoFijo'));
        console.log('fechaUltimoIngresoNoFijo:', localStorage.getItem('fechaUltimoIngresoNoFijo'));
        console.log('fechaTerminoPeriodoNoFijo:', localStorage.getItem('fechaTerminoPeriodoNoFijo'));
        console.log('descripcionIngresoFijo:', localStorage.getItem('descripcionIngresoFijo'));
        console.log('montoIngresoFijo:', localStorage.getItem('montoIngresoFijo'));
        console.log('fechaUltimoIngresoFijo:', localStorage.getItem('fechaUltimoIngresoFijo'));
        console.log('fechaTerminoPeriodoFijo:', localStorage.getItem('fechaTerminoPeriodoFijo'));

        console.log('Login exitoso');
        navigate('/dashboard'); // Redirige al Dashboard después de iniciar sesión
      } else {
        setError('Correo o contraseña incorrectos');
      }
    } catch (err) {
      console.error(
        err.response?.data?.error || 'Error en la conexión con el servidor'
      );
      setError('Correo o contraseña incorrectos');
    }
  };

  return (
    <div
      className="register-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="form-container">
        <p className="text-center">
          <i
            className="bi bi-person-circle"
            style={{ fontSize: '5rem', color: 'white' }}
          ></i>
        </p>
        <p className="text-center">INICIA SESIÓN CON TU CUENTA</p>
        <form onSubmit={handleLoginSubmit}>
          <div className="group-material-login">
            <input
              type="email"
              className="material-login-control"
              required
              maxLength="70"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className="highlight-login"></span>
            <span className="bar-login"></span>
            <label>
              <i className="bi bi-envelope"></i> &nbsp; Correo
            </label>
          </div>
          <br />
          <div className="group-material-login">
            <input
              type="password"
              className="material-login-control"
              required
              maxLength="70"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="highlight-login"></span>
            <span className="bar-login"></span>
            <label>
              <i className="bi bi-lock"></i> &nbsp; Contraseña
            </label>
          </div>
          {error && <p className="text-danger">{error}</p>}
          <div className="text-center mb-3">
            <button
              type="button"
              className="btn btn-link"
              onClick={handleForgotPasswordClick}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-outline-light">
              Ingresar al sistema
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => navigate('/register')}
            >
              Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
