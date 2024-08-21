import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import logo1 from '../assets/images/logo1.png';
import userIcon from '../assets/images/user01.png';
import '../styles/MainLayout.css';

const MainLayout = () => {
  const [gastosOpen, setGastosOpen] = useState(false);
  const [finanzasOpen, setFinanzasOpen] = useState(false);
  const [grupoOpen, setGrupoOpen] = useState(false);
  const [metasOpen, setMetasOpen] = useState(false);

  return (
    <div className="main-layout">
      <aside className="navbar-lateral">
        <div className="navbar-top"></div>
        <div className="logo-container">
          <img src={logo1} alt="Logo" className="logo-img" />
          <p className="logo-text">Sistema financiero</p>
        </div>
        <nav className="nav-menu">
          <ul>
            <li>
              <Link to="/dashboard"><i className="bi bi-house-door"></i> Inicio</Link>
            </li>
            <li>
              <div className="dropdown-menu-button" onClick={() => setGastosOpen(!gastosOpen)}>
                <i className="bi bi-cash-stack"></i> Gastos <i className={`bi ${gastosOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </div>
              {gastosOpen && (
                <ul className="dropdown-menu">
                  <li><Link to="/registro-gasto"><i className="bi bi-journal-plus"></i> Registrar gasto</Link></li>
                  <li><Link to="/editar-gasto"><i className="bi bi-pencil-square"></i> Editar o eliminar gasto</Link></li>
                </ul>
              )}
            </li>
            <li>
              <div className="dropdown-menu-button" onClick={() => setFinanzasOpen(!finanzasOpen)}>
                <i className="bi bi-graph-up"></i> Tus finanzas <i className={`bi ${finanzasOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </div>
              {finanzasOpen && (
                <ul className="dropdown-menu">
                  <li><Link to="/finanzas-personales"><i className="bi bi-person"></i> Personales</Link></li>
                  <li><Link to="/finanzas-grupales"><i className="bi bi-people"></i> Grupales</Link></li>
                </ul>
              )}
            </li>
            <li>
              <div className="dropdown-menu-button" onClick={() => setGrupoOpen(!grupoOpen)}>
                <i className="bi bi-people"></i> Grupo <i className={`bi ${grupoOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </div>
              {grupoOpen && (
                <ul className="dropdown-menu">
                  <li><Link to="/nuevo-grupo"><i className="bi bi-person-plus"></i> Nuevo grupo</Link></li>
                  <li><Link to="/mis-grupos"><i className="bi bi-people-fill"></i> Mis grupos</Link></li>
                  <li><Link to="/unirse-grupo"><i className="bi bi-person-plus-fill"></i> Unirse a grupo</Link></li>
                </ul>
              )}
            </li>
            <li>
              <div className="dropdown-menu-button" onClick={() => setMetasOpen(!metasOpen)}>
                <i className="bi bi-calendar-check"></i> Metas financieras <i className={`bi ${metasOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </div>
              {metasOpen && (
                <ul className="dropdown-menu">
                  <li><Link to="/registro-metas"><i className="bi bi-check2-all"></i> Registro de metas financieras</Link></li>
                  <li><Link to="/recomendaciones"><i className="bi bi-chat-dots"></i> Recomendaciones</Link></li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <a href="/user"><img src={userIcon} alt="User" className="user-img" /></a>
          <a href="/logout"><i className="bi bi-box-arrow-right"></i> Salir</a>
        </div>
      </aside>

      <div className="content-page-container">
        <nav className="navbar-user-top">
          <ul className="list-unstyled">
            <li><a href="/user">Usuario</a></li>
            <li className="exit-system-button"><a href="/"><i className="bi bi-power"></i> Salir del sistema</a></li>
          </ul>
        </nav>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
