import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PrivateRoute from './components/PrivateRoute'; // <-- 1. IMPORT

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* 2. WRAP THE DASHBOARD ROUTE */}
        <Route path="/" element={<PrivateRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;