import React from 'react';
import '../styles/Input.css';


const Input = ({ type, placeholder }) => {
  return (
    <input className="login-input" type={type} placeholder={placeholder} />
  );
};

export default Input;
