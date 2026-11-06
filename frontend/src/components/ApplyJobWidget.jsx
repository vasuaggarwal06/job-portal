import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function ApplyJobWidget({ job, onApplied }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [showForm, setShowForm] = useState(true);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [checkingApp, setCheckingApp] = useState(false);

  // Check if current applicant has already applied to this specific job
  useEffect(() => {
    if (user && user.role === 'applicant' && job?._id) {
      setCheckingApp(true);
      client
        .get('/applications', { params: { jobId: job._id } })
        .then(({ data }) => {
          if (data.applications && data.applications.length > 0) {
            setHasApplied(true);
            setExistingApp(data.applications[0]);
          }
        })
        .catch(err => {
          console.warn('Could not check existing application status:', err);
        })
        .finally(() => {
          setCheckingApp(false);
        });
    }
  }, [user, job?._id]);

  const handleApplyNowClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowForm(true);
    setTimeout(() => {
      fileInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'File size exceeds 5 MB. Please choose a smaller résumé file.',
      });
      e.target.value = '';
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'recruiter') {
      setMessage({
        type: 'error',
        text: 'Recruiter accounts cannot apply to roles. Please log in as an applicant.',
      });
      return;
    }

    if (!resumeFile && !user.resumeUrl) {
      setMessage({
        type: 'error',
        text: 'Please choose your résumé file (PDF, DOC, or DOCX).',
      });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('jobId', job._id);
      if (coverLetter.trim()) {
        formData.append('coverLetter', coverLetter.trim());
      }
      if (resumeFile) {
        formData.append('resume', resumeFile);
      } else if (user.resumeUrl) {
        formData.append('resumeUrl', user.resumeUrl);
      }

      const { data } = await client.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setHasApplied(true);
      setExistingApp(data.application || { status: 'submitted', createdAt: new Date().toISOString() });
      setMessage({
        type: 'success',
        text: 'Application submitted successfully! Track its status in your dashboard.',
      });
      if (onApplied) onApplied();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not submit application. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="apply-widget-card">
      {/* Top Header section matching user screenshot */}
      <div className="apply-widget-top">
        <p className="eyebrow">INTERESTED?</p>
        <h2 className="apply-widget-title">Make your move.</h2>
        <p className="apply-widget-lead">
          Apply directly and keep track of your application from your workspace.
        </p>

        {!hasApplied && !showForm && (
          <button
            type="button"
            className="button-apply-now"
            onClick={handleApplyNowClick}
          >
            Apply now
          </button>
        )}
      </div>

      {/* When user has already applied */}
      {hasApplied ? (
        <div className="apply-widget-applied-state">
          <hr className="apply-widget-divider" />
          <div className="applied-badge-row">
            <span className="applied-check-icon">✓</span>
            <div>
              <h3 className="applied-heading">Application submitted</h3>
              <p className="applied-sub">
                Status: <span className="status-highlight">{existingApp?.status || 'In review'}</span>
              </p>
            </div>
          </div>
          <p className="applied-note">
            Your materials have been safely delivered to {job.companyName}. You can track responses in your workspace.
          </p>
          <Link to="/dashboard" className="button-view-dashboard">
            View in Applicant Dashboard →
          </Link>
        </div>
      ) : showForm ? (
        <>
          <hr className="apply-widget-divider" />

          {message.text && (
            <div className={`status-banner ${message.type}`}>
              {message.text}
            </div>
          )}

          {user?.role === 'recruiter' ? (
            <div className="recruiter-notice-box">
              <p>You are logged in as a recruiter.</p>
              <p className="muted-small">
                Recruiters cannot apply to job postings. To apply as a candidate, switch to an applicant account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="apply-widget-form">
              {/* Cover letter optional */}
              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="apply-cover-letter" className="field-label">
                    Cover letter <span className="label-hint">optional</span>
                  </label>
                  <textarea
                    id="apply-cover-letter"
                    rows={4}
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    placeholder="Brief note on why you're a great fit for this role..."
                    className="field-textarea apply-textarea"
                  />
                </div>
              </div>

              {/* Résumé PDF, DOC, or DOCX · 5 MB max */}
              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="apply-resume" className="field-label">
                    Résumé <span className="label-hint">PDF, DOC, or DOCX · 5 MB max</span>
                  </label>

                  <div className="file-input-custom-wrapper">
                    <input
                      id="apply-resume"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="field-file-input apply-file-input"
                    />
                    {resumeFile && (
                      <div className="file-selected-badge">
                        📎 {resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)
                      </div>
                    )}
                  </div>

                  {user?.resumeUrl && !resumeFile && (
                    <p className="saved-resume-note">
                      ✓ Using your profile résumé. Choose a file above to replace it.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit application button */}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={submitting}
                  className="button-submit-application"
                >
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              </div>
            </form>
          )}
        </>
      ) : null}
    </aside>
  );
}

