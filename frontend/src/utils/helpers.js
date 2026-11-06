/**
 * Generates a 2-letter company monogram avatar text matching design:
 * Apple -> AP
 * Google Cloud -> GC
 * Meta -> ME
 * Netflix -> NE
 */
export function getCompanyMonogram(companyName) {
  if (!companyName) return 'CO';
  const clean = companyName.trim();
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Formats timestamps into natural relative time strings:
 * "15 hours ago", "2 days ago", "Just now"
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  const past = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - past.getTime();
  
  if (isNaN(diffMs) || diffMs < 0) return 'Recently';

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    if (diffMinutes <= 1) return 'Just now';
    return `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  }
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Formats salary ranges in INR or provided currency
 */
export function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return null;
  const curr = salary.currency === 'USD' ? '$' : '₹';
  const minStr = salary.min ? Number(salary.min).toLocaleString('en-IN') : null;
  const maxStr = salary.max ? Number(salary.max).toLocaleString('en-IN') : null;

  if (minStr && maxStr) {
    return `${curr}${minStr} - ${curr}${maxStr}`;
  }
  if (minStr) return `${curr}${minStr}+`;
  return `Up to ${curr}${maxStr}`;
}

const VIEWED_KEY = 'viewed_job_ids';

export function getViewedJobIds() {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markJobViewed(jobId) {
  if (!jobId) return;
  try {
    const ids = getViewedJobIds();
    if (!ids.includes(jobId)) {
      ids.push(jobId);
      localStorage.setItem(VIEWED_KEY, JSON.stringify(ids));
    }
  } catch (err) {
    console.error('Failed to save viewed job:', err);
  }
}
