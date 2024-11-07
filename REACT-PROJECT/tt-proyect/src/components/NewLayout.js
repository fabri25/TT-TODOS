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
  const [perteneceAGrupo, setPerteneceAGrupo] = useState(false);
  const [esAdminGrupo, setEsAdminGrupo] = useState(false);
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

    // Obtener valores de login desde localStorage
    const hasIncome = localStorage.getItem('hasIncome') === 'true';
    const showIncomeTab = localStorage.getItem('showFloatingTabIncome') === 'true';
    const perteneceAGrupoLocal = localStorage.getItem('pertenece_a_grupo') === 'true';
    const esAdminGrupoLocal = localStorage.getItem('es_admin_grupo') === 'true';

    // Asignar los valores de grupo a los estados locales
    setPerteneceAGrupo(perteneceAGrupoLocal);
    setEsAdminGrupo(esAdminGrupoLocal);

    console.log("Es administrador de grupo:", esAdminGrupoLocal);
    console.log("Pertenece a un grupo:", perteneceAGrupoLocal);

    // Mostrar ventanas flotantes según estado de ingresos
    if (!hasIncome) {
      setShowFloatingTab(true);
    } else if (showIncomeTab) {
      setDescripcionIngreso(localStorage.getItem('descripcionIngreso') || '');
      setFechaUltimoIngreso(localStorage.getItem('fechaUltimoIngreso') || '');
      setShowFloatingTabIncome(true);
    }

    // Decidir opciones de menú lateral
    if (esAdminGrupoLocal && perteneceAGrupoLocal) {
      console.log("Mostrar opciones: Mis Grupos, Crear Grupo, Unirse a un Grupo, Configuración de Grupo");
    } else if (perteneceAGrupoLocal) {
      console.log("Mostrar opciones: Mis Grupos, Crear Grupo, Unirse a un Grupo");
    } else {
      console.log("Mostrar opciones: Crear Grupo, Unirse a un Grupo");
    }
  }, [navigate]);

  const handleSave = () => {
    setShowFloatingTab(false);
    localStorage.setItem('hasIncome', 'true');
    localStorage.removeItem('showFloatingTab');
  };

  const handleSaveIncome = () => {
    setShowFloatingTabIncome(false);
    localStorage.setItem('showFloatingTabIncome', 'false');
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
                <li><Link to="/dashboard/ingresos">Ingresos</Link></li>
                <li><Link to="/dashboard/gastos">Gastos</Link></li>
                <li><Link to="/dashboard/ahorros">Ahorros</Link></li>
                <li><Link to="/dashboard/inversiones">Inversiones</Link></li>
              </ul>
            </li>

            {/* Grupos Financieros */}
            {perteneceAGrupo ? (
              <li className={`menu-item ${activeMenu === 'grupo' ? 'active' : ''}`} onClick={() => toggleMenu('grupo')}>
                <div className="dropdown-menu-button">
                  <i className="bi bi-people"></i> Grupos Financieros <i className={`bi bi-chevron-${activeMenu === 'grupo' ? 'up' : 'down'}`}></i>
                </div>
                <ul className={`dropdown-menu ${activeMenu === 'grupo' ? 'show' : ''}`}>
                  <li><Link to="/dashboard/grupo/mis-grupos">Mis Grupos</Link></li>
                  <li><Link to="/dashboard/grupo/crear">Crear Grupo</Link></li>
                  <li><Link to="/dashboard/grupo/unirse">Unirse a un Grupo</Link></li>
                  {esAdminGrupo && <li><Link to="/dashboard/grupo/configurar">Configuración de Grupo</Link></li>}
                </ul>
              </li>
            ) : (
              <li className={`menu-item ${activeMenu === 'grupo' ? 'active' : ''}`} onClick={() => toggleMenu('grupo')}>
                <div className="dropdown-menu-button">
                  <i className="bi bi-people"></i> Grupos Financieros <i className={`bi bi-chevron-${activeMenu === 'grupo' ? 'up' : 'down'}`}></i>
                </div>
                <ul className={`dropdown-menu ${activeMenu === 'grupo' ? 'show' : ''}`}>
                  <li><Link to="/dashboard/grupo/crear">Crear Grupo</Link></li>
                  <li><Link to="/dashboard/grupo/unirse">Unirse a un Grupo</Link></li>
                </ul>
              </li>
            )}

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
        <header className="top-bar"></header>
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
