import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormStep from './FormStep';

const EmailStep = () => {
  const navigate = useNavigate();

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes agregar la lógica de validación o envío del correo

    // Redirigir a la página de verificación
    navigate('/recover-code');
  };

  return (
    <FormStep 
      title="RECUPERAR CONTRASEÑA"
      icon="bi-person-circle"
      placeholder="Correo"
      inputType="email"
      buttonText="Continuar"
      onSubmit={handleEmailSubmit}
    />
  );
};

export default EmailStep;
