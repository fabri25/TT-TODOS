import React from 'react';
import '../styles/Button.css';


const Button = ({ text, variant = 'default' }) => {
  return (
    <button className={`login-button ${variant}`}>{text}</button>
  );
};

export default Button;
