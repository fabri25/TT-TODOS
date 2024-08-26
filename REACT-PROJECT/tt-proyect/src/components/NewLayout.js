import React, { useState, useEffect } from 'react';
import '../styles/NewLayout.css';
import logo1 from '../assets/images/logo1.png';
import FloatingTab from './FloatingTab';
import FloatingTabIncome from './FloatingTabIncome'; // Importar el nuevo componente
import IncomeChart from './IncomeChart'; // Importar el componente de la gráfica

const NewLayout = () => {
  const [showFloatingTab, setShowFloatingTab] = useState(false);
  const [showFloatingTabIncome, setShowFloatingTabIncome] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // <--- Agregar esta línea para inicializar activeMenu
  const [descripcionIngreso, setDescripcionIngreso] = useState('');
  const [fechaUltimoIngreso, setFechaUltimoIngreso] = useState('');
  

  useEffect(() => {
    const hasIncome = localStorage.getItem('hasIncome') === 'true';
    const showIncomeTab = localStorage.getItem('showFloatingTabIncome') === 'true';
  
    console.log("hasIncome:", hasIncome);
    console.log("showIncomeTab:", showIncomeTab);
  
    if (!hasIncome) {
      console.log("Mostrando FloatingTab para nuevos ingresos");
      setShowFloatingTab(true); // Mostrar FloatingTab si no tiene ingresos
    } else if (showIncomeTab) {
      console.log("Mostrando FloatingTabIncome para actualización de ingresos");
      setDescripcionIngreso(localStorage.getItem('descripcionIngreso') || '');
      setFechaUltimoIngreso(localStorage.getItem('fechaUltimoIngreso') || '');
      setShowFloatingTabIncome(true); // Mostrar FloatingTabIncome si corresponde
    }
  }, []);

  const handleSave = () => {
    console.log('Información guardada en FloatingTab');
    setShowFloatingTab(false); // Oculta la pestaña flotante después de guardar
  };

  const handleSaveIncome = () => {
    console.log('Información guardada en FloatingTabIncome');
    setShowFloatingTabIncome(false); // Oculta la pestaña flotante después de guardar
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
            <li className={`menu-item ${activeMenu === 'gastos' ? 'active' : ''}`} onClick={() => toggleMenu('gastos')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-cash-stack"></i> Gastos <i className={`bi bi-chevron-${activeMenu === 'gastos' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'gastos' ? 'show' : ''}`}>
                <li><a href="/gastos/registrar">Registrar gasto</a></li>
                <li><a href="/gastos/editar">Editar o eliminar gasto</a></li>
                <li><a href="/gastos/reportes">Reportes de gasto</a></li>
                <li><a href="/gastos/configurar">Configurar gastos</a></li>
              </ul>
            </li>
            <li className={`menu-item ${activeMenu === 'finanzas' ? 'active' : ''}`} onClick={() => toggleMenu('finanzas')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-graph-up"></i> Tus finanzas <i className={`bi bi-chevron-${activeMenu === 'finanzas' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'finanzas' ? 'show' : ''}`}>
                <li><a href="/finanzas/personales">Finanzas personales</a></li>
                <li><a href="/finanzas/grupales">Finanzas grupales</a></li>
                <li><a href="/finanzas/inversiones">Inversiones</a></li>
                <li><a href="/finanzas/presupuesto">Presupuesto</a></li>
              </ul>
            </li>
            <li className={`menu-item ${activeMenu === 'grupo' ? 'active' : ''}`} onClick={() => toggleMenu('grupo')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-people"></i> Grupo <i className={`bi bi-chevron-${activeMenu === 'grupo' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'grupo' ? 'show' : ''}`}>
                <li><a href="/grupo/nuevo">Nuevo grupo</a></li>
                <li><a href="/grupo/mis-grupos">Mis grupos</a></li>
                <li><a href="/grupo/unirse">Unirse a grupo</a></li>
                <li><a href="/grupo/configurar">Configurar grupo</a></li>
              </ul>
            </li>
            <li className={`menu-item ${activeMenu === 'metas' ? 'active' : ''}`} onClick={() => toggleMenu('metas')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-check-square"></i> Metas financieras <i className={`bi bi-chevron-${activeMenu === 'metas' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'metas' ? 'show' : ''}`}>
                <li><a href="/metas/registro">Registro de metas</a></li>
                <li><a href="/metas/seguimiento">Seguimiento de metas</a></li>
                <li><a href="/metas/analisis">Análisis de metas</a></li>
                <li><a href="/metas/configurar">Configurar metas</a></li>
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
          {showFloatingTab && <FloatingTab onSave={handleSave} />} {/* Renderiza la pestaña flotante para nuevos ingresos */}
          {showFloatingTabIncome && (
            <FloatingTabIncome 
              onSave={handleSaveIncome} 
              descripcionIngreso={descripcionIngreso} 
              fechaUltimoIngreso={fechaUltimoIngreso} 
            />
          )} 
          {/* Renderiza la pestaña flotante para capturar ingresos según el periodo */}
          {!showFloatingTab && !showFloatingTabIncome && <IncomeChart />} {/* Renderiza la gráfica cuando no hay ventanas flotantes */}
        </main>
      </div>
    </div>
  );
};

export default NewLayout;
