import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <section className="hero">
      <p className="eyebrow">Careers, made human</p>
      <h1>Find work that fits your next chapter.</h1>
      <p className="lead">
        Search thoughtful opportunities, apply with confidence, and keep every
        application in one calm workspace.
      </p>

      <div className="actions">
        <Link className="button" to="/jobs">
          Explore jobs
        </Link>
        {user ? (
          <Link className="button secondary" to="/dashboard">
            Go to dashboard
          </Link>
        ) : (
          <Link className="button secondary" to="/register">
            Create an account
          </Link>
        )}
      </div>

      <div className="stats">
        <span>
          <b>3 roles</b> tailored workspaces
        </span>
        <span>
          <b>1 profile</b> for every application
        </span>
        <span>
          <b>0 clutter</b> in your job search
        </span>
      </div>
    </section>
  );
}
