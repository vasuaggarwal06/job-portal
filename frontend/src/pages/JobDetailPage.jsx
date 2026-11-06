import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import ApplyJobWidget from '../components/ApplyJobWidget';
import {
  getCompanyMonogram,
  formatTimeAgo,
  formatSalary,
  markJobViewed,
} from '../utils/helpers';

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    markJobViewed(id);

    client
      .get(`/jobs/${id}`)
      .then(({ data }) => {
        setJob(data.job);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Could not load job details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="job-detail-loading-wrap">
        <div className="loading-spinner"></div>
        <p>Loading position details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-error-wrap">
        <h2>Position not found</h2>
        <p>{error || 'This job posting may have expired or been removed.'}</p>
        <Link to="/jobs" className="button small">
          ← Back to all open roles
        </Link>
      </div>
    );
  }

  const monogram = getCompanyMonogram(job.companyName);
  const timeAgo = formatTimeAgo(job.createdAt);
  const salaryString = formatSalary(job.salary);

  const skillsList = Array.isArray(job.skills)
    ? job.skills
    : typeof job.skills === 'string' && job.skills
      ? job.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  return (
    <div className="job-detail-page-container">
      {/* Back Navigation Bar */}
      <div className="job-detail-nav-bar">
        <Link to="/jobs" className="job-back-link">
          ← Back to open roles
        </Link>
      </div>

      <div className="job-detail-layout-grid">
        {/* LEFT COLUMN: Comprehensive Job Overview */}
        <article className="workspace-panel job-detail-main-panel">
          <div className="job-detail-header-block">
            <div className="job-detail-branding-row">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="job-company-logo-view"
                />
              ) : (
                <div className="job-detail-monogram">
                  {monogram}
                </div>
              )}

              <div className="job-detail-header-meta">
                <h1 className="job-detail-title-heading">{job.title}</h1>
                <p className="job-detail-company-sub">
                  <span className="company-name-bold">{job.companyName}</span>
                  <span className="dot-sep">·</span>
                  <span>{job.location}</span>
                </p>
                <p className="job-detail-posted-sub">
                  Posted {timeAgo} · {job.employmentType}
                </p>
              </div>
            </div>

            {/* Pill Highlights */}
            <div className="job-detail-pill-tags">
              <span className="pill job-type-pill">{job.employmentType}</span>
              {salaryString && (
                <span className="pill salary-pill">{salaryString}</span>
              )}
              <span className="pill hiring-pill">Actively Recruiting</span>
            </div>
          </div>

          <hr className="panel-divider" />

          {/* Role Summary Grid */}
          <div className="job-overview-summary-grid">
            <div className="summary-metric-card">
              <span className="metric-label">Location</span>
              <span className="metric-val">{job.location}</span>
            </div>
            <div className="summary-metric-card">
              <span className="metric-label">Employment Type</span>
              <span className="metric-val">{job.employmentType}</span>
            </div>
            <div className="summary-metric-card">
              <span className="metric-label">Compensation</span>
              <span className="metric-val">{salaryString || 'Competitive'}</span>
            </div>
            <div className="summary-metric-card">
              <span className="metric-label">Hiring Contact</span>
              <span className="metric-val">{job.recruiter?.name || 'Recruitment Team'}</span>
            </div>
          </div>

          {/* Description Section */}
          <section className="job-spec-section">
            <h2 className="spec-section-title">About this opportunity</h2>
            <div className="job-text-content">
              {job.description ? (
                job.description.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p>No description provided.</p>
              )}
            </div>
          </section>

          {/* Skills Section */}
          {skillsList.length > 0 && (
            <section className="job-spec-section">
              <h2 className="spec-section-title">Required skills & qualifications</h2>
              <div className="skills-badge-collection">
                {skillsList.map((skill, idx) => (
                  <span key={idx} className="spec-skill-chip">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* About Company Section */}
          <section className="job-spec-section">
            <h2 className="spec-section-title">About {job.companyName}</h2>
            <div className="job-text-content">
              {job.aboutCompany ? (
                <p>{job.aboutCompany}</p>
              ) : (
                <p>
                  {job.companyName} is an innovative organization building impactful products and services. Apply to join their growing team.
                </p>
              )}
            </div>
          </section>
        </article>

        {/* RIGHT COLUMN: The Apply Widget from user screenshot */}
        <aside className="job-detail-sidebar-wrap">
          <ApplyJobWidget job={job} />
        </aside>
      </div>
    </div>
  );
}
