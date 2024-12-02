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
import DetalleMeta from './components/DetalleMeta';
import GroupFinanceDashboard from './components/GroupFinanceDashboard'; // Importa el componente
import AddGroupExpense from './components/AddGroupExpense'; // Importa el componente
import RegisterGroupGoal from './components/RegisterGroupGoal';
import GroupConfig from './components/GroupConfig'; // Importa el componente de configuración del grupo
import VisualizarMetasGrupales from './components/VisualizarMetasGrupales'; // Importa el componente de configuración del grupo
import AddGroupMembers from './components/AddGroupMembers'; // Importa el componente de configuración del grupo
import EditExpenseModal from './components/EditExpenseModal'; // Importa el componente de configuración del grupo
import DetalleMetaGrupal from './components/DetalleMetaGrupal';



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
            <Route path="/dashboard/edit-expense/:idGasto" element={<EditExpenseModal />} />
            <Route path="grupo/crear" element={<CreateGroup />} /> {/* Nueva ruta */}
            <Route path="listado_grupos" element={<Grupos />} /> {/* Ruta de Grupos */}
            <Route path="/dashboard/validar-datos-financieros" element={<CheckFinancialData />} /> 
            <Route path="/dashboard/metas-financieras" element={<FinancialGoals />} />
            <Route path="/dashboard/registrar-meta" element={<RegisterGoal />} />
            <Route path="/dashboard/metas/:idMeta" element={<DetalleMeta />} />
            <Route path="/dashboard/grupo/:grupoId" element={<GroupFinanceDashboard />}/>
            <Route path="/dashboard/grupo/:grupoId/add-expense" element={<AddGroupExpense />} />
            <Route path="/dashboard/grupo/:grupoId/registrar-meta-grupo" element={<RegisterGroupGoal />} />
            <Route path="/dashboard/grupo/:grupoId/metas-grupales" element={<VisualizarMetasGrupales />} />
            <Route path="/dashboard/grupo/:grupoId/agregar-miembro" element={<AddGroupMembers />} />
            <Route path="/dashboard/grupo/configurar/:grupoId" element={<GroupConfig />} /> {/* Ruta de configuración del grupo */}
            <Route path="/dashboard/grupo/:grupoId/metas/:metaId" element={<DetalleMetaGrupal />}/>

            </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
