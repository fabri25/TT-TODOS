import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Register.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import RegistrationModal from './RegistrationModal'; // Importa el nuevo componente modal

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellidoP, setApellidoP] = useState('');
    const [apellidoM, setApellidoM] = useState('');
    const [fechaCumple, setFechaCumple] = useState('');
    const [contacto, setContacto] = useState('');
    const [error, setError] = useState('');
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    const esMayorDeEdad = (fechaNacimiento) => {
        const hoy = new Date();
        const cumpleanos = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - cumpleanos.getFullYear();
        const diferenciaMeses = hoy.getMonth() - cumpleanos.getMonth();

        if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < cumpleanos.getDate())) {
            edad--;
        }

        return edad >= 18;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!esMayorDeEdad(fechaCumple)) {
            setError('Debes ser mayor de 18 años para registrarte.');
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:5000/api/register', {
                email,
                password,
                nombre,
                apellido_p: apellidoP,
                apellido_m: apellidoM,
                fecha_cumple: fechaCumple,
                contacto
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(response.data);
            setShowVerificationModal(true); // Mostrar la ventana flotante después del registro exitoso
        } catch (err) {
            console.error(err.response?.data?.error || 'Error en la conexión con el servidor');
            setError(err.response?.data?.error || 'Error en la conexión con el servidor');
        }
    };

    const handleModalClose = () => {
        setShowVerificationModal(false);
        navigate('/'); // Redirige al Login después de cerrar la ventana flotante
    };

    return (
        <div className="register-container" style={{ backgroundImage: `url(${require('../assets/images/background.jpg')})` }}>
            <div className="form-container">
                <p className="text-center">
                    <i className="bi bi-person-circle" style={{ fontSize: '5rem', color: 'white' }}></i>
                </p>
                <h4 className="text-center">REGISTRO DE USUARIO</h4>
                <form onSubmit={handleSubmit}>
                    <div className="group-material-login">
                        <input type="email" className="material-login-control" required maxLength="70" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <label><i className="bi bi-envelope"></i> &nbsp; Correo</label>
                    </div>
                    <div className="group-material-login">
                        <input type="password" className="material-login-control" required maxLength="70" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <label><i className="bi bi-lock"></i> &nbsp; Contraseña</label>
                    </div>
                    <div className="group-material-login">
                        <input type="text" className="material-login-control" required maxLength="50" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                        <label><i className="bi bi-person"></i> &nbsp; Nombres</label>
                    </div>
                    <div className="group-material-login">
                        <input type="text" className="material-login-control" required maxLength="50" value={apellidoP} onChange={(e) => setApellidoP(e.target.value)} />
                        <label><i className="bi bi-person"></i> &nbsp; Apellido Paterno</label>
                    </div>
                    <div className="group-material-login">
                        <input type="text" className="material-login-control" required maxLength="50" value={apellidoM} onChange={(e) => setApellidoM(e.target.value)} />
                        <label><i className="bi bi-person"></i> &nbsp; Apellido Materno</label>
                    </div>
                    <div className="group-material-login">
                        <input type="date" className="material-login-control" required value={fechaCumple} onChange={(e) => setFechaCumple(e.target.value)} />
                        <label className="static-label"><i className="bi bi-calendar"></i> &nbsp; Fecha de nacimiento</label>
                    </div>
                    <div className="group-material-login">
                        <input type="text" className="material-login-control" maxLength="100" value={contacto} onChange={(e) => setContacto(e.target.value)} />
                        <label><i className="bi bi-phone"></i> &nbsp; Contacto (opcional)</label>
                    </div>
                    {error && <p className="text-danger">{error}</p>}
                    <button type="submit" className="btn btn-outline-light" >Registrar &nbsp; <i className="bi bi-arrow-right"></i></button>
                </form>
            </div>

            {showVerificationModal && (
                <RegistrationModal email={email} onClose={handleModalClose} />
            )}
        </div>
    );
};

export default Register;
