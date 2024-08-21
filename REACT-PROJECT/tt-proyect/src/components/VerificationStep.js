import React from 'react';
import { useNavigate } from 'react-router-dom';
import FormStep from './FormStep';

const VerificationStep = () => {
  const navigate = useNavigate();

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes agregar la lógica de validación del código

    // Redirigir a la página de nueva contraseña
    navigate('/new-password');
  };

  return (
    <FormStep 
      title="VERIFICACIÓN DE CÓDIGO"
      icon="bi-shield-lock"
      placeholder="Código de verificación"
      inputType="text"
      buttonText="Verificar"
      onSubmit={handleVerificationSubmit}
    />
  );
};

export default VerificationStep;
