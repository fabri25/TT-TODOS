import React from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/Login.css';  // Asegúrate de que el archivo CSS esté en la carpeta `styles`

const FormStep = ({ title, icon, placeholder, inputType = "text", buttonText, onSubmit }) => {
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4" style={{ width: '20rem', background: 'rgba(0, 0, 0, 0.55)', borderRadius: '15px' }}>
        <div className="text-center">
          <i className={`bi ${icon} mb-3`} style={{ fontSize: '4rem', color: 'white' }}></i>
          <h2 className="h5 mb-4 text-white">{title}</h2>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group position-relative">
            <span className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#000' }}>
              <i className={`bi bi-${inputType === 'password' ? 'lock' : 'person'}`}></i>
            </span>
            <input type={inputType} className="form-control with-icon" placeholder=" " id="inputField" style={{ paddingLeft: '2.5rem' }} />
            <label htmlFor="inputField" className="form-label">{placeholder}</label>
          </div>
          <div className="text-center mb-3">
            <button type="submit" className="btn btn-outline-light">{buttonText}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormStep;
