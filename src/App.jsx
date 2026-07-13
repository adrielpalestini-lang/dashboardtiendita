import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import LiveSalesPage from './pages/LiveSalesPage';
import SalesReportPage from './pages/SalesReportPage';
import CashCutsPage from './pages/CashCutsPage';
import ProductsPage from './pages/ProductsPage';
import CafeProductsPage from './pages/CafeProductsPage';
import ModifiersPage from './pages/ModifiersPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><LiveSalesPage /></PrivateRoute>} />
      <Route path="/reportes" element={<PrivateRoute><SalesReportPage /></PrivateRoute>} />
      <Route path="/cortes" element={<PrivateRoute><CashCutsPage /></PrivateRoute>} />
      <Route path="/productos" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
      <Route path="/cafe" element={<PrivateRoute><CafeProductsPage /></PrivateRoute>} />
      <Route path="/modificadores" element={<PrivateRoute><ModifiersPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
