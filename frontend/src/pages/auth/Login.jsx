import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SignIn } from './RetinaAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (fields) => {
    try {
      const res = await login({
        email: fields.email,
        password: fields.password,
      });
      return res;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please verify your credentials.';
      throw new Error(msg);
    }
  };

  const handleSuccess = () => {
    toast.success('Welcome back to RetinaAI!');
    navigate(from, { replace: true });
  };

  return (
    <SignIn
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      onNavigate={(path) => navigate(path)}
    />
  );
}
