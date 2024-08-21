import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormStep from './FormStep';

const NewPasswordStep = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();
    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Aquí puedes agregar la lógica para actualizar la contraseña
    console.log('Contraseña actualizada');

    // Redirigir al login después de actualizar la contraseña
    navigate('/');
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
            <span className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#000' }}>
              <i className="bi bi-lock"></i>
            </span>
            <input
              type="password"
              className="form-control with-icon"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <div className="form-group position-relative mt-3">
            <span className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#000' }}>
              <i className="bi bi-lock"></i>
            </span>
            <input
              type="password"
              className="form-control with-icon"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          {error && <p className="text-danger mt-2">{error}</p>}
          <div className="text-center mb-3 mt-4">
            <button type="submit" className="btn btn-outline-light">Actualizar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordStep;
