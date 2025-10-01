import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user } = useAuth();

  // If a user is logged in, show the page. Otherwise, redirect to login.
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;