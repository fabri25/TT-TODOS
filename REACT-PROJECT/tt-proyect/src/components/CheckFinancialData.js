import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import coinGif from '../assets/images/coin.gif';
import '../styles/DatosF.css';

const CheckFinancialData = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const validateData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://127.0.0.1:5000/api/validar-ingresos-gastos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.valido) {
          navigate('/dashboard/registrar-meta');
        } else {
          alert("Necesitas ingresar más de 3 ingresos y 3 gastos para poder registrar una meta.");
          // Redirigir después de 5 segundos
          setTimeout(() => {
            navigate('/dashboard/inicio');
          }, 5000);

          // Alternativamente, podríamos redirigir inmediatamente después de que cierren la alerta
          // const userResponse = window.confirm("Necesitas ingresar más de 3 ingresos y 3 gastos para poder registrar una meta. Haz clic en OK para volver a la página principal.");
          // if (userResponse) {
          //   navigate('/');
          // }
        }
      } catch (error) {
        console.error('Error al validar ingresos y gastos:', error);
      }
    };

    validateData();
  }, [navigate]);

  return (
    <div className="overlay">
    <div className="loading-message">
      Validando datos financieros... <br />
      <img src={coinGif} alt="Cargando..." className="loading-image" />
    </div>
  </div>
  );
};

export default CheckFinancialData;
