import { useAuth } from '../context/AuthContext';
import RecruiterWorkspace from '../components/RecruiterWorkspace';
import ApplicantWorkspace from '../components/ApplicantWorkspace';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const message =
    user.role === 'applicant'
      ? 'Track applications and keep your profile ready for the next great role.'
      : user.role === 'recruiter'
        ? 'Manage openings and meet the people behind the applications.'
        : 'Oversee portal activity and manage access across your organization.';

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-hero">
        <p className="eyebrow">{user.role} workspace</p>
        <h1>Welcome back, {user.name.split(' ')[0]}.</h1>
        <p className="lead">{message}</p>
      </div>

      {user.role === 'recruiter' || user.role === 'admin' ? (
        <RecruiterWorkspace user={user} />
      ) : (
        <ApplicantWorkspace user={user} />
      )}
    </div>
  );
}
