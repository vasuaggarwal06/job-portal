import { useAuth } from '../context/AuthContext';
import RecruiterWorkspace from '../components/RecruiterWorkspace';
import { Navigate } from 'react-router-dom';

export default function PostJobPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role !== 'recruiter' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="post-job-page-container">
      <RecruiterWorkspace user={user} />
    </div>
  );
}
