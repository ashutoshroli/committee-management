import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Loans from './pages/Loans';
import LoanDetail from './pages/LoanDetail';
import CreateLoan from './pages/CreateLoan';
import Instalments from './pages/Instalments';
import Settings from './pages/Settings';
import Users from './pages/Users';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="loans" element={<Loans />} />
        <Route path="loans/create" element={<CreateLoan />} />
        <Route path="loans/:id" element={<LoanDetail />} />
        <Route path="instalments" element={<Instalments />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
