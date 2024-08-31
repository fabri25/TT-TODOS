import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/NewLayout.css';
import logo1 from '../assets/images/logo1.png';
import FloatingTab from './FloatingTab';
import FloatingTabIncome from './FloatingTabIncome';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const NewLayout = () => {
  const [showFloatingTab, setShowFloatingTab] = useState(false);
  const [showFloatingTabIncome, setShowFloatingTabIncome] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [descripcionIngreso, setDescripcionIngreso] = useState('');
  const [fechaUltimoIngreso, setFechaUltimoIngreso] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
  
      if (decodedToken.exp < currentTime) {
        localStorage.removeItem('token');
        navigate('/');
      } else if (window.location.pathname === '/dashboard') {
        navigate('/dashboard/inicio'); 
      }
    } else {
      navigate('/');
    }
  
    const hasIncome = localStorage.getItem('hasIncome') === 'true';
    const showIncomeTab = localStorage.getItem('showFloatingTabIncome') === 'true';
  
    if (!hasIncome) {
      setShowFloatingTab(true);
    } else if (showIncomeTab) {
      setDescripcionIngreso(localStorage.getItem('descripcionIngreso') || '');
      setFechaUltimoIngreso(localStorage.getItem('fechaUltimoIngreso') || '');
      setShowFloatingTabIncome(true);
    }
  }, [navigate]); // Incluir `navigate` en las dependencias

  const handleSave = () => {
    setShowFloatingTab(false);
  };

  const handleSaveIncome = () => {
    setShowFloatingTabIncome(false);
  };

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <div className="new-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <p>Sistema Financiero</p>
        </div>
        <div className="sidebar-logo-container">
          <img src={logo1} alt="Logo" className="logo-img" />
          <p className="logo-text">Sistema financiero</p>
        </div>
        <div className="sidebar-content">
          <ul className="nav-menu nav-lateral-list-menu">
            {/* Inicio */}
            <li className={`menu-item ${activeMenu === 'inicio' ? 'active' : ''}`}>
              <Link to="/dashboard/inicio" onClick={() => setActiveMenu('inicio')}>
                <i className="bi bi-house"></i> Inicio
              </Link>
            </li>

            {/* Tus Finanzas */}
            <li className={`menu-item ${activeMenu === 'finanzas' ? 'active' : ''}`} onClick={() => toggleMenu('finanzas')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-graph-up"></i> Tus Finanzas <i className={`bi bi-chevron-${activeMenu === 'finanzas' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'finanzas' ? 'show' : ''}`}>
                <li><Link to="/dashboard/ingresos">Ingresos</Link></li> {/* Enlace a IncomeList */}
                <li><Link to="/dashboard/gastos">Gastos</Link></li>
                <li><Link to="/dashboard/ahorros">Ahorros</Link></li>
                <li><Link to="/dashboard/inversiones">Inversiones</Link></li>
              </ul>
            </li>

            {/* Grupos Financieros */}
            <li className={`menu-item ${activeMenu === 'grupo' ? 'active' : ''}`} onClick={() => toggleMenu('grupo')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-people"></i> Grupos Financieros <i className={`bi bi-chevron-${activeMenu === 'grupo' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'grupo' ? 'show' : ''}`}>
                <li><Link to="/dashboard/grupo/mis-grupos">Mis Grupos</Link></li>
                <li><Link to="/dashboard/grupo/crear">Crear Grupo</Link></li>
                <li><Link to="/dashboard/grupo/unirse">Unirse a un Grupo</Link></li>
                <li><Link to="/dashboard/grupo/configurar">Configuración de Grupo</Link></li>
              </ul>
            </li>

            {/* Metas Financieras */}
            <li className={`menu-item ${activeMenu === 'metas' ? 'active' : ''}`} onClick={() => toggleMenu('metas')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-check-square"></i> Metas Financieras <i className={`bi bi-chevron-${activeMenu === 'metas' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'metas' ? 'show' : ''}`}>
                <li><Link to="/dashboard/metas/registro">Registro de Metas</Link></li>
                <li><Link to="/dashboard/metas/seguimiento">Seguimiento de Metas</Link></li>
                <li><Link to="/dashboard/metas/analisis">Análisis de Metas</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      </aside>
      <div className="main-content">
        <header className="top-bar">
          {/* Aquí puedes añadir contenido de la barra superior si es necesario */}
        </header>
        <main className="content">
          {showFloatingTab && <FloatingTab onSave={handleSave} />}
          {showFloatingTabIncome && (
            <FloatingTabIncome 
              onSave={handleSaveIncome} 
              descripcionIngreso={descripcionIngreso} 
              fechaUltimoIngreso={fechaUltimoIngreso} 
            />
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default NewLayout;
