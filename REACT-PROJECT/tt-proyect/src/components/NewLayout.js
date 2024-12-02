import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/NewLayout.css';
import logo1 from '../assets/images/logo1.png';
import FloatingTab from './FloatingTab';
import FloatingTabIncome from './FloatingTabIncome';
import ConfirmationModal from './ConfirmationModal';
import JoinGroupModal from './JoinGroupModal'; // Importar el nuevo modal
import { Link, Outlet, useNavigate } from 'react-router-dom';

const NewLayout = () => {
  const [showFloatingTab, setShowFloatingTab] = useState(false);
  const [showFloatingTabIncome, setShowFloatingTabIncome] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [descripcionIngreso, setDescripcionIngreso] = useState('');
  const [fechaUltimoIngreso, setFechaUltimoIngreso] = useState('');
  const [perteneceAGrupo, setPerteneceAGrupo] = useState(false);
  const [misGrupos, setMisGrupos] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false); // Estado para mostrar el modal de unirse a un grupo
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
    const perteneceAGrupoLocal = localStorage.getItem('pertenece_a_grupo') === 'true';

    setPerteneceAGrupo(perteneceAGrupoLocal);

    const gruposUsuario = JSON.parse(localStorage.getItem('mis_grupos') || '[]');
    setMisGrupos(gruposUsuario);

    if (!hasIncome) {
      setShowFloatingTab(true);
    } else if (showIncomeTab) {
      setDescripcionIngreso(localStorage.getItem('descripcionIngreso') || '');
      setFechaUltimoIngreso(localStorage.getItem('fechaUltimoIngreso') || '');
      setShowFloatingTabIncome(true);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSettings = () => {
    navigate('/dashboard/configuracionCuennta');
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const confirmLogout = () => {
    handleLogout();
    closeLogoutModal();
  };

  const handleJoinGroup = async (groupCode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:5000/api/grupo/unirse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo_invitacion: groupCode }),
      });

      if (response.ok) {
        alert('Te has unido al grupo exitosamente.');
        // Actualiza los grupos del usuario si es necesario
        const gruposUsuario = [...misGrupos, groupCode];
        setMisGrupos(gruposUsuario);
        localStorage.setItem('mis_grupos', JSON.stringify(gruposUsuario));
        setShowJoinGroupModal(false);
      } else {
        alert('No se pudo unir al grupo. Verifica el código e intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error al unirse al grupo:', error);
    }
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
          <ul className="nav-menu">
            <li className={`menu-item ${activeMenu === 'inicio' ? 'active' : ''}`}>
              <Link to="/dashboard/inicio" onClick={() => setActiveMenu('inicio')}>
                <i className="bi bi-house"></i> Inicio
              </Link>
            </li>

            <li className={`menu-item ${activeMenu === 'finanzas' ? 'active' : ''}`} onClick={() => toggleMenu('finanzas')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-graph-up"></i> Tus Finanzas{' '}
                <i className={`bi bi-chevron-${activeMenu === 'finanzas' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'finanzas' ? 'show' : ''}`}>
                <li>
                  <Link to="/dashboard/ingresos">Ingresos</Link>
                </li>
                <li>
                  <Link to="/dashboard/gastos">Gastos</Link>
                </li>
              </ul>
            </li>

            <li className={`menu-item ${activeMenu === 'grupo' ? 'active' : ''}`} onClick={() => toggleMenu('grupo')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-people"></i> Grupos Financieros{' '}
                <i className={`bi bi-chevron-${activeMenu === 'grupo' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'grupo' ? 'show' : ''}`}>
                {perteneceAGrupo && (
                  <li>
                    <Link to="/dashboard/listado_grupos">Mis Grupos</Link>
                  </li>
                )}
                <li>
                  <Link to="/dashboard/grupo/crear">Crear Grupo</Link>
                </li>
                <li>
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault(); // Previene la recarga de página
                      setShowJoinGroupModal(true); // Llama al modal de unirse
                    }}
                  >
                    Unirse a un Grupo
                  </Link>
                </li>
              </ul>
            </li>

            <li className={`menu-item ${activeMenu === 'metas' ? 'active' : ''}`} onClick={() => toggleMenu('metas')}>
              <div className="dropdown-menu-button">
                <i className="bi bi-bar-chart"></i> Metas Financieras{' '}
                <i className={`bi bi-chevron-${activeMenu === 'metas' ? 'up' : 'down'}`}></i>
              </div>
              <ul className={`dropdown-menu ${activeMenu === 'metas' ? 'show' : ''}`}>
                <li>
                  <Link to="/dashboard/validar-datos-financieros">Registrar Meta</Link>
                </li>
                <li>
                  <Link to="/dashboard/metas-financieras">Metas Financieras</Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </aside>
      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-buttons">
            <button className="btn btn-outline-light" onClick={handleSettings}>
              <i className="bi bi-gear"></i>
            </button>
            <button className="btn btn-outline-light" onClick={openLogoutModal}>
              <i className="bi bi-power"></i>
            </button>
          </div>
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

      {/* Modal de confirmación para cerrar sesión */}
      {showLogoutModal && (
        <ConfirmationModal
          message="¿Estás seguro de que deseas cerrar sesión?"
          onConfirm={confirmLogout}
          onCancel={closeLogoutModal}
        />
      )}

      {/* Modal de unirse a un grupo */}
      {showJoinGroupModal && (
        <JoinGroupModal
          onJoinGroup={handleJoinGroup}
          onClose={() => setShowJoinGroupModal(false)}
        />
      )}
    </div>
  );
};

export default NewLayout;
