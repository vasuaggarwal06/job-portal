import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ApplicantWorkspace({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/applications')
      .then(({ data }) => setApplications(data.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="applicant-workspace">
      <div className="workspace-panel full-width">
        <div className="panel-header">
          <p className="eyebrow">MY APPLICATIONS</p>
          <h2>Roles you've applied to</h2>
          <p className="lead-sub">
            Track the status of your applications and interview processes.
          </p>
        </div>

        <hr className="panel-divider" />

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <p>You haven't applied to any roles yet.</p>
            <p className="muted-small">
              Browse the open positions board and send your first application.
            </p>
            <Link
              to="/jobs"
              className="button small"
              style={{ display: 'inline-block', marginTop: '16px' }}
            >
              Explore open roles
            </Link>
          </div>
        ) : (
          <div className="applicant-applications-grid">
            {applications.map(app => (
              <div key={app._id} className="applicant-app-card">
                <div className="app-card-main">
                  <span className={`status-pill status-${app.status}`}>
                    {app.status.toUpperCase()}
                  </span>
                  <h3>
                    {app.job?._id ? (
                      <Link to={`/jobs/${app.job._id}`} className="app-job-title-link">
                        {app.job.title}
                      </Link>
                    ) : (
                      app.job?.title || 'Role'
                    )}
                  </h3>
                  <p className="company-text">
                    {app.job?.companyName || 'Company'} · {app.job?.location || 'Location'}
                  </p>
                  <p className="app-date">
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
