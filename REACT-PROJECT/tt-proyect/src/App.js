import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import EmailStep from './components/EmailStep';
import VerificationStep from './components/VerificationStep';
import NewPasswordStep from './components/NewPasswordStep';
import NewLayout from './components/NewLayout'; // Importación correcta de NewLayout

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/recover-email" element={<EmailStep />} />
          <Route path="/recover-code" element={<VerificationStep />} />
          <Route path="/new-password" element={<NewPasswordStep />} />

          {/* Ruta que utiliza el NewLayout después de iniciar sesión */}
          <Route path="/dashboard" element={<NewLayout />}>
            {/* Aquí puedes agregar más rutas o componentes */}
            {/* <Route index element={<TuComponente />} /> */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
