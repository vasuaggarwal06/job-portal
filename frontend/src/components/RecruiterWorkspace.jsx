import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import client from '../api/client';

const initialForm = {
  title: '',
  companyName: '',
  companyLogo: '',
  aboutCompany: '',
  location: '',
  employmentType: 'Full-time',
  skills: '',
  minSalary: '',
  maxSalary: '',
  description: '',
};

export default function RecruiterWorkspace({ user }) {
  const { id: routeJobId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetEditId = routeJobId || searchParams.get('edit');

  const getCleanForm = () => ({
    title: '',
    companyName: user?.companyName || '',
    companyLogo: user?.companyLogo || '',
    aboutCompany: user?.companyAbout || '',
    location: '',
    employmentType: 'Full-time',
    skills: '',
    minSalary: '',
    maxSalary: '',
    description: '',
  });

  const [form, setForm] = useState(getCleanForm);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const formRef = useRef(null);

  useEffect(() => {
    if (user && !editingJobId && !form.companyName) {
      setForm(prev => ({
        ...prev,
        companyName: prev.companyName || user.companyName || '',
        companyLogo: prev.companyLogo || user.companyLogo || '',
        aboutCompany: prev.aboutCompany || user.companyAbout || '',
      }));
    }
  }, [user, editingJobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      let myJobs = [];
      try {
        const { data } = await client.get('/jobs/mine');
        myJobs = data.jobs || [];
      } catch {
        const { data } = await client.get('/jobs');
        myJobs = (data.jobs || []).filter(
          j => j.recruiter?._id === user?._id || j.recruiter === user?._id || user?.role === 'admin'
        );
      }
      setJobs(myJobs);

      try {
        const { data: appData } = await client.get('/applications');
        setApplications(appData.applications || []);
      } catch {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to load recruiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (targetEditId && jobs.length > 0) {
      const existing = jobs.find(j => j._id === targetEditId);
      if (existing) {
        handleEditClick(existing);
      } else {
        client
          .get(`/jobs/${targetEditId}`)
          .then(({ data }) => {
            if (data?.job) handleEditClick(data.job);
          })
          .catch(err => {
            console.error('Failed to load job for edit:', err);
          });
      }
    }
  }, [targetEditId, jobs]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = job => {
    setEditingJobId(job._id);
    setStatusMessage({ type: '', text: '' });
    setForm({
      title: job.title || '',
      companyName: job.companyName || '',
      companyLogo: job.companyLogo || '',
      aboutCompany: job.aboutCompany || '',
      location: job.location || '',
      employmentType: job.employmentType || 'Full-time',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '',
      minSalary: job.salary?.min ?? '',
      maxSalary: job.salary?.max ?? '',
      description: job.description || '',
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    setForm(getCleanForm());
    setStatusMessage({ type: '', text: '' });
    if (routeJobId) {
      navigate('/post-job', { replace: true });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const payload = {
        title: form.title.trim(),
        companyName: form.companyName.trim(),
        companyLogo: form.companyLogo.trim(),
        aboutCompany: form.aboutCompany.trim(),
        location: form.location.trim(),
        employmentType: form.employmentType,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        salary: {
          min: form.minSalary ? Number(form.minSalary) : undefined,
          max: form.maxSalary ? Number(form.maxSalary) : undefined,
          currency: 'INR',
        },
        description: form.description.trim(),
      };

      if (editingJobId) {
        await client.patch(`/jobs/${editingJobId}`, payload);
        setStatusMessage({ type: 'success', text: 'Job post updated successfully!' });
        setEditingJobId(null);
        if (routeJobId) {
          navigate('/post-job', { replace: true });
        }
      } else {
        await client.post('/jobs', payload);
        setStatusMessage({ type: 'success', text: 'Job role published successfully!' });
      }

      setForm(getCleanForm());
      await loadData();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save job. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to delete the role "${jobTitle}"?`)) return;
    try {
      await client.delete(`/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      if (selectedJob?._id === jobId) setSelectedJob(null);
      if (editingJobId === jobId) handleCancelEdit();
      setStatusMessage({ type: 'success', text: 'Role deleted.' });
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete role');
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await client.patch(`/applications/${appId}/status`, { status: newStatus });
      setApplications(prev =>
        prev.map(a => (a._id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update application status');
    }
  };

  const selectedRoleApplications = selectedJob
    ? applications.filter(a => a.job?._id === selectedJob._id || a.job === selectedJob._id)
    : [];

  return (
    <div className="recruiter-workspace">
      {/* LEFT PANEL: Job Management */}
      <section className="workspace-panel job-management-panel" ref={formRef}>
        <div className="panel-header">
          <div className="eyebrow-row">
            <p className="eyebrow">JOB MANAGEMENT</p>
            {editingJobId && (
              <button
                type="button"
                className="cancel-edit-btn"
                onClick={handleCancelEdit}
              >
                Cancel edit
              </button>
            )}
          </div>
          <h2>{editingJobId ? 'Edit job post' : 'Post a new role'}</h2>
        </div>

        {statusMessage.text && (
          <div className={`status-banner ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="job-form">
          {/* Row 1: Job title & Company name */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="job-title" className="field-label">
                Job title
              </label>
              <input
                id="job-title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer"
                className="field-input"
              />
            </div>
            <div className="form-field">
              <label htmlFor="company-name" className="field-label">
                Company name
              </label>
              <input
                id="company-name"
                name="companyName"
                type="text"
                required
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Apple"
                className="field-input"
              />
            </div>
          </div>

          {/* Row 2: Company logo URL optional */}
          <div className="form-grid-1">
            <div className="form-field">
              <label htmlFor="company-logo" className="field-label">
                Company logo URL <span className="label-hint">optional</span>
              </label>
              <input
                id="company-logo"
                name="companyLogo"
                type="url"
                value={form.companyLogo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="field-input"
              />
            </div>
          </div>

          {/* Row 3: About the company shown on job detail page */}
          <div className="form-grid-1">
            <div className="form-field">
              <label htmlFor="about-company" className="field-label">
                About the company <span className="label-hint">shown on job detail page</span>
              </label>
              <textarea
                id="about-company"
                name="aboutCompany"
                rows={3}
                value={form.aboutCompany}
                onChange={handleChange}
                placeholder="Brief description of company culture and mission..."
                className="field-textarea"
              />
            </div>
          </div>

          {/* Row 4: Location & Employment type */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="location" className="field-label">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Hyderabad"
                className="field-input"
              />
            </div>
            <div className="form-field">
              <label htmlFor="employment-type" className="field-label">
                Employment type
              </label>
              <select
                id="employment-type"
                name="employmentType"
                value={form.employmentType}
                onChange={handleChange}
                className="field-select"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Row 5: Skills comma-separated */}
          <div className="form-grid-1">
            <div className="form-field">
              <label htmlFor="skills" className="field-label">
                Skills <span className="label-hint">comma-separated</span>
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. React, JavaScript, CSS, HTML"
                className="field-input"
              />
            </div>
          </div>

          {/* Row 6: Minimum salary & Maximum salary */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="min-salary" className="field-label">
                Minimum salary
              </label>
              <input
                id="min-salary"
                name="minSalary"
                type="number"
                value={form.minSalary}
                onChange={handleChange}
                placeholder="e.g. 1200000"
                className="field-input"
              />
            </div>
            <div className="form-field">
              <label htmlFor="max-salary" className="field-label">
                Maximum salary
              </label>
              <input
                id="max-salary"
                name="maxSalary"
                type="number"
                value={form.maxSalary}
                onChange={handleChange}
                placeholder="e.g. 2400000"
                className="field-input"
              />
            </div>
          </div>

          {/* Row 7: Role description */}
          <div className="form-grid-1">
            <div className="form-field">
              <label htmlFor="role-description" className="field-label">
                Role description
              </label>
              <textarea
                id="role-description"
                name="description"
                rows={4}
                required
                value={form.description}
                onChange={handleChange}
                placeholder="Responsibilities, requirements, and qualifications..."
                className="field-textarea"
              />
            </div>
          </div>

          {/* Row 8: Action button */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={submitting}
              className="button-publish"
            >
              {submitting
                ? 'Processing...'
                : editingJobId
                  ? 'Save changes'
                  : 'Publish job'}
            </button>
          </div>
        </form>
      </section>

      {/* RIGHT PANEL: Applications / Job Submissions */}
      <section className="workspace-panel applications-panel">
        <div className="panel-header">
          <p className="eyebrow">APPLICATIONS</p>
          <h2>Job submissions</h2>
          {!selectedJob ? (
            <p className="lead-sub">Choose a role to see its applicants.</p>
          ) : (
            <div className="selected-role-bar">
              <button
                type="button"
                className="back-link-btn"
                onClick={() => setSelectedJob(null)}
              >
                ← Back to roles
              </button>
              <span className="selected-role-name">
                {selectedJob.title} · {selectedRoleApplications.length}{' '}
                {selectedRoleApplications.length === 1 ? 'applicant' : 'applicants'}
              </span>
            </div>
          )}
        </div>

        <hr className="panel-divider" />

        {/* ROLE LIST VIEW */}
        {!selectedJob ? (
          <div className="roles-list">
            {jobs.length === 0 ? (
              <div className="empty-state">
                <p>No roles posted yet.</p>
                <p className="muted-small">
                  Fill out the form on the left to publish your first role.
                </p>
              </div>
            ) : (
              jobs.map(job => {
                const jobAppCount = applications.filter(
                  a => a.job?._id === job._id || a.job === job._id
                ).length;
                const isEditing = editingJobId === job._id;

                return (
                  <div
                    key={job._id}
                    className={`role-item ${isEditing ? 'active-editing' : ''}`}
                  >
                    <div className="role-item-info">
                      <h3 className="role-title">{job.title}</h3>
                      <p className="role-meta">
                        {job.companyName} · {job.location}
                      </p>
                    </div>

                    <div className="role-actions">
                      <button
                        type="button"
                        className={`action-edit ${isEditing ? 'active-editing-btn' : ''}`}
                        onClick={() => handleEditClick(job)}
                        title="Edit this role"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="action-submissions"
                        onClick={() => setSelectedJob(job)}
                      >
                        Submissions{jobAppCount > 0 ? ` (${jobAppCount})` : ''}
                      </button>

                      <button
                        type="button"
                        className="action-delete"
                        onClick={() => handleDeleteJob(job._id, job.title)}
                        title="Delete role"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* SUBMISSIONS FOR SELECTED ROLE */
          <div className="submissions-detail-view">
            {selectedRoleApplications.length === 0 ? (
              <div className="empty-state">
                <p>No applicants have applied to this role yet.</p>
                <p className="muted-small">
                  Applications will appear here once job seekers submit their resumes.
                </p>
                <button
                  type="button"
                  className="button secondary small"
                  style={{ marginTop: '14px' }}
                  onClick={() => setSelectedJob(null)}
                >
                  View all roles
                </button>
              </div>
            ) : (
              <div className="applicants-list">
                {selectedRoleApplications.map(app => (
                  <div key={app._id} className="applicant-card">
                    <div className="applicant-card-header">
                      <div>
                        <h4 className="applicant-name">
                          {app.applicant?.name || 'Anonymous Applicant'}
                        </h4>
                        <p className="applicant-email">
                          {app.applicant?.email || 'No email provided'}
                        </p>
                        <span className="applicant-date">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="applicant-status-wrap">
                        <label htmlFor={`status-${app._id}`} className="sr-only">
                          Status
                        </label>
                        <select
                          id={`status-${app._id}`}
                          value={app.status}
                          onChange={e => handleStatusChange(app._id, e.target.value)}
                          className={`status-select status-${app.status}`}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                      </div>
                    </div>

                    {app.coverLetter && (
                      <div className="applicant-cover-letter">
                        <p className="cover-letter-label">Cover letter:</p>
                        <p className="cover-letter-text">{app.coverLetter}</p>
                      </div>
                    )}

                    {app.resume?.url && (
                      <div className="applicant-resume">
                        <a
                          href={app.resume.url}
                          target="_blank"
                          rel="noreferrer"
                          className="resume-link"
                        >
                          📄 View Resume
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
