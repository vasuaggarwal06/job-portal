import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import {
  getCompanyMonogram,
  formatTimeAgo,
  getViewedJobIds,
  markJobViewed,
} from '../utils/helpers';

export default function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    employmentType: '',
  });
  const [viewedIds, setViewedIds] = useState([]);

  // Fetch jobs with active filters
  const loadJobs = async (customFilters = filters) => {
    setLoading(true);
    try {
      const { data } = await client.get('/jobs', { params: customFilters });
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    setViewedIds(getViewedJobIds());
  }, []);

  const handleFilterSubmit = e => {
    e.preventDefault();
    loadJobs();
  };

  const handleCardClick = jobId => {
    markJobViewed(jobId);
    if (!viewedIds.includes(jobId)) {
      setViewedIds(prev => [...prev, jobId]);
    }
    navigate(`/jobs/${jobId}`);
  };

  return (
    <div className="jobs-page-container">
      {/* Editorial Header Section matching screenshot */}
      <div className="jobs-header-section">
        <p className="jobs-eyebrow">OPEN ROLES</p>
        <h1 className="jobs-main-title">Find your next opportunity</h1>
      </div>

      {/* Horizontal Search & Filter Bar matching screenshot */}
      <form className="jobs-filter-bar" onSubmit={handleFilterSubmit}>
        <div className="filter-field-cell filter-keyword-cell">
          <input
            type="text"
            placeholder="Title, skill, or company"
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            className="filter-input-element"
            aria-label="Title, skill, or company"
          />
        </div>

        <div className="filter-field-cell filter-location-cell">
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={e => setFilters({ ...filters, location: e.target.value })}
            className="filter-input-element"
            aria-label="Location"
          />
        </div>

        <div className="filter-field-cell filter-type-cell">
          <select
            value={filters.employmentType}
            onChange={e => setFilters({ ...filters, employmentType: e.target.value })}
            className="filter-select-element"
            aria-label="Employment type"
          >
            <option value="">Any type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        <button type="submit" className="button-search-submit">
          Search
        </button>
      </form>

      {/* Roles List matching screenshot card layout */}
      {loading ? (
        <div className="jobs-loading-container">
          <div className="loading-spinner"></div>
          <p>Finding open roles...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="jobs-empty-state">
          <h3>No roles match your search</h3>
          <p>Try different keywords or clear your location/type filters.</p>
          <button
            type="button"
            className="button secondary small"
            onClick={() => {
              const reset = { keyword: '', location: '', employmentType: '' };
              setFilters(reset);
              loadJobs(reset);
            }}
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="jobs-list-layout">
          {jobs.map(job => {
            const isViewed = viewedIds.includes(job._id);
            const monogram = getCompanyMonogram(job.companyName);
            const timeAgo = formatTimeAgo(job.createdAt);

            return (
              <div
                key={job._id}
                className="job-opportunity-card"
                onClick={() => handleCardClick(job._id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(job._id);
                  }
                }}
              >
                {/* Monogram Box matching AP square badge */}
                <div className="job-monogram-box">
                  {monogram}
                </div>

                {/* Main Content Area */}
                <div className="job-card-details">
                  <div className="job-card-title-row">
                    <span className="job-card-title-text">{job.title}</span>
                    {isViewed && (
                      <span className="job-card-viewed-pill">Viewed</span>
                    )}
                  </div>

                  <div className="job-card-company-row">
                    {job.companyName} · {job.location}
                  </div>

                  <div className="job-card-meta-row">
                    {timeAgo} · {job.employmentType}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
