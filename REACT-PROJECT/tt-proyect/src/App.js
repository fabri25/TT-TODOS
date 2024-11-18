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
import FinancialOverview from './components/FinancialOverview';  // Importa el nuevo componente
import EditIncome from './components/EditIncome'; 
import IncomeDashboard from './components/IncomeDashboard';
import AddIncome from './components/AddIncomeModal';
import ExpenseDashboard from './components/ExpenseDashboard';
import AddExpense from './components/AddExpenseModal';
import CreateGroup from './components/CreateGroup';
//import AddExpense from './components/AddExpenseModal';
import FinancialGoals from './components/FinancialGoals';
import RegisterGoal from './components/RegisterGoal';
import CheckFinancialData from './components/CheckFinancialData';
import Grupos from './components/Grupos'; // Importa el componente Grupos

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
            <Route path="inicio" element={<FinancialOverview />} /> {/* Cambia a FinancialOverview */}
            <Route path="ingresos" element={<IncomeDashboard />} />
            <Route path="gastos" element={<ExpenseDashboard />} />
            <Route path="edit-income/:id" element={<EditIncome />} />
            <Route path="add-income" element={<AddIncome />} />
            <Route path="add-expense" element={<AddExpense />} />
            <Route path="grupo/crear" element={<CreateGroup />} /> {/* Nueva ruta */}
            <Route path="listado_grupos" element={<Grupos />} /> {/* Ruta de Grupos */}
            <Route path="/dashboard/validar-datos-financieros" element={<CheckFinancialData />} /> 
            <Route path="/dashboard/metas-financieras" element={<FinancialGoals />} />
            <Route path="/dashboard/registrar-meta" element={<RegisterGoal />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
