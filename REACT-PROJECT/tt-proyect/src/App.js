import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import EmailStep from './components/EmailStep';
import VerificationStep from './components/VerificationStep';
import NewPasswordStep from './components/NewPasswordStep';
import NewLayout from './components/NewLayout';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import EmailVerification from './components/EmailVerification';
import IncomeChart from './components/IncomeChart';  // Importa el componente de IncomeChart
import EditIncome from './components/EditIncome';  // Importa el componente de edición de ingresos
import IncomeDashboard from './components/IncomeDashboard';
import AddIncome from './components/AddIncomeModal';  // Componente de agregar ingreso



function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/recover-email" element={<EmailStep />} />
          <Route path="/recover-code" element={<VerificationStep />} />
          <Route path="/new-password" element={<NewPasswordStep />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-verified" element={<EmailVerification />} />
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <NewLayout />
            </PrivateRoute>
          }>
            <Route path="inicio" element={<IncomeChart />} /> 
            <Route path="ingresos" element={<IncomeDashboard />} /> {/* Nuevo componente */}
            <Route path="/dashboard/edit-income/:id" element={<EditIncome />} />
            <Route path="/dashboard/add-income" element={<AddIncome />} />  
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
