import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SignUp } from './RetinaAuth';
import toast from 'react-hot-toast';

const ROLE_MAP = {
  'Clinician': 'doctor',
  'Health worker': 'healthworker',
  'Programme admin': 'admin',
  'doctor': 'doctor',
  'healthworker': 'healthworker',
  'admin': 'admin',
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (fields) => {
    try {
      const role = ROLE_MAP[fields.role] || 'healthworker';
      const res = await register({
        name: fields.fullName,
        email: fields.email,
        organization: fields.organization,
        role,
        password: fields.password,
      });
      return res;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Account creation failed. Please check your information.';
      throw new Error(msg);
    }
  };

  const handleSuccess = () => {
    toast.success('Account created successfully! Welcome to RetinaAI.');
    navigate('/dashboard', { replace: true });
  };

  return (
    <SignUp
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      onNavigate={(path) => navigate(path)}
      roles={['Clinician', 'Health worker', 'Programme admin']}
    />
  );
}
