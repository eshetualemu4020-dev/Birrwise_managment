import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentBudgets from './pages/StudentBudgets';
import StudentSavingsGoals from './pages/StudentSavingsGoals';
import StudentTransactions from './pages/StudentTransactions';
import StudentReports from './pages/StudentReports';
import ForgotPassword from './pages/ForgotPassword';
import './index.css';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/budgets" element={<StudentBudgets />} />
        <Route path="/student/savings-goals" element={<StudentSavingsGoals />} />
        <Route path="/student/transactions" element={<StudentTransactions />} />
        <Route path="/student/reports" element={<StudentReports />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
