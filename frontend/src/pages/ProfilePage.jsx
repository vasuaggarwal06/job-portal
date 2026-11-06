import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  if (!user) return null;

  const isRecruiter = user.role === 'recruiter' || user.role === 'admin';

  // Personal Details state
  const [personalForm, setPersonalForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || '',
    bio: user.bio || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar?.url || '');
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalMessage, setPersonalMessage] = useState({ type: '', text: '' });

  // Recruiter fields state
  const [recruiterForm, setRecruiterForm] = useState({
    companyName: user.companyName || '',
    designation: user.designation || '',
    companyWebsite: user.companyWebsite || '',
    companyLogo: user.companyLogo || '',
    companyAbout: user.companyAbout || '',
    linkedin: user.linkedin || '',
  });
  const [savingRecruiter, setSavingRecruiter] = useState(false);
  const [recruiterMessage, setRecruiterMessage] = useState({ type: '', text: '' });

  // Applicant fields state
  const [applicantForm, setApplicantForm] = useState({
    headline: user.headline || '',
    skills: Array.isArray(user.skills) ? user.skills.join(', ') : user.skills || '',
    experience: user.experience || '',
    education: user.education || '',
    resumeUrl: user.resumeUrl || '',
    portfolio: user.portfolio || '',
    github: user.github || '',
    linkedin: user.linkedin || '',
  });
  const [savingApplicant, setSavingApplicant] = useState(false);
  const [applicantMessage, setApplicantMessage] = useState({ type: '', text: '' });

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Handle avatar file selection
  const handleAvatarChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPersonalMessage({
        type: 'error',
        text: 'Image size exceeds 2 MB limit. Please select a smaller photo.',
      });
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  // Submit Personal Details (matching the user's reference image card)
  const handlePersonalSubmit = async e => {
    e.preventDefault();
    setSavingPersonal(true);
    setPersonalMessage({ type: '', text: '' });

    try {
      const dataToSend = new FormData();
      dataToSend.append('name', personalForm.name.trim());
      dataToSend.append('email', personalForm.email.trim());
      dataToSend.append('phone', personalForm.phone.trim());
      dataToSend.append('location', personalForm.location.trim());
      dataToSend.append('bio', personalForm.bio.trim());

      if (avatarFile) {
        dataToSend.append('avatar', avatarFile);
      }

      const { data } = await client.patch('/auth/profile', dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(data.user);
      setPersonalMessage({ type: 'success', text: 'Personal details saved successfully!' });
      setAvatarFile(null);
    } catch (err) {
      setPersonalMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update personal details.',
      });
    } finally {
      setSavingPersonal(false);
    }
  };

  // Submit Recruiter Company Details
  const handleRecruiterSubmit = async e => {
    e.preventDefault();
    setSavingRecruiter(true);
    setRecruiterMessage({ type: '', text: '' });

    try {
      const payload = {
        companyName: recruiterForm.companyName.trim(),
        designation: recruiterForm.designation.trim(),
        companyWebsite: recruiterForm.companyWebsite.trim(),
        companyLogo: recruiterForm.companyLogo.trim(),
        companyAbout: recruiterForm.companyAbout.trim(),
        linkedin: recruiterForm.linkedin.trim(),
      };

      const { data } = await client.patch('/auth/profile', payload);
      updateUser(data.user);
      setRecruiterMessage({ type: 'success', text: 'Company details updated successfully!' });
    } catch (err) {
      setRecruiterMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update company details.',
      });
    } finally {
      setSavingRecruiter(false);
    }
  };

  // Submit Applicant Career Details
  const handleApplicantSubmit = async e => {
    e.preventDefault();
    setSavingApplicant(true);
    setApplicantMessage({ type: '', text: '' });

    try {
      const payload = {
        headline: applicantForm.headline.trim(),
        skills: applicantForm.skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        experience: applicantForm.experience.trim(),
        education: applicantForm.education.trim(),
        resumeUrl: applicantForm.resumeUrl.trim(),
        portfolio: applicantForm.portfolio.trim(),
        github: applicantForm.github.trim(),
        linkedin: applicantForm.linkedin.trim(),
      };

      const { data } = await client.patch('/auth/profile', payload);
      updateUser(data.user);
      setApplicantMessage({ type: 'success', text: 'Career profile updated successfully!' });
    } catch (err) {
      setApplicantMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update career profile.',
      });
    } finally {
      setSavingApplicant(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      await client.patch('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="profile-page-wrapper">
      {/* Page Header */}
      <div className="profile-page-header">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <div className="profile-heading-row">
          <h1>Profile</h1>
          <span className="profile-role-badge">
            {isRecruiter ? 'Recruiter account' : 'Applicant account'}
          </span>
        </div>
        <p className="lead-sub">Keep your details current to get the most from CareerNest.</p>
      </div>

      <div className="profile-cards-stack">
        {/* CARD 1: Personal Details (Exact match to reference image) */}
        <section className="workspace-panel profile-card">
          <div className="profile-card-header">
            <h2>Personal details</h2>
            {avatarPreview ? (
              <img src={avatarPreview} alt={user.name} className="avatar-preview-circle" />
            ) : (
              <div className="avatar-initials-circle">{initials}</div>
            )}
          </div>

          {personalMessage.text && (
            <div className={`status-banner ${personalMessage.type}`}>
              {personalMessage.text}
            </div>
          )}

          <form onSubmit={handlePersonalSubmit} className="profile-form">
            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="profile-name" className="field-label">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={personalForm.name}
                  onChange={e =>
                    setPersonalForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Rohit Jain"
                  className="field-input"
                />
              </div>
            </div>

            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="profile-email" className="field-label">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={personalForm.email}
                  onChange={e =>
                    setPersonalForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="e.g. rohitjaintrainer@gmail.com"
                  className="field-input"
                />
              </div>
            </div>

            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="profile-avatar" className="field-label">
                  Profile image <span className="label-hint">optional · max 2 MB</span>
                </label>
                <input
                  id="profile-avatar"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleAvatarChange}
                  className="field-file-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="profile-phone" className="field-label">
                  Phone number <span className="label-hint">optional</span>
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={personalForm.phone}
                  onChange={e =>
                    setPersonalForm(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="e.g. +91 98765 43210"
                  className="field-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="profile-location" className="field-label">
                  Location <span className="label-hint">optional</span>
                </label>
                <input
                  id="profile-location"
                  type="text"
                  value={personalForm.location}
                  onChange={e =>
                    setPersonalForm(prev => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g. Gurugram, India"
                  className="field-input"
                />
              </div>
            </div>

            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="profile-bio" className="field-label">
                  About you <span className="label-hint">optional</span>
                </label>
                <textarea
                  id="profile-bio"
                  rows={3}
                  value={personalForm.bio}
                  onChange={e =>
                    setPersonalForm(prev => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="A short summary of who you are and what you care about..."
                  className="field-textarea"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={savingPersonal}
                className="button-publish"
              >
                {savingPersonal ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </section>

        {/* CARD 2: Role-Specific Details (Recruiter OR Applicant) */}
        {isRecruiter ? (
          /* RECRUITER COMPANY DETAILS */
          <section className="workspace-panel profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Company & Recruiter details</h2>
                <p className="lead-sub">These details appear automatically on your job postings.</p>
              </div>
            </div>

            {recruiterMessage.text && (
              <div className={`status-banner ${recruiterMessage.type}`}>
                {recruiterMessage.text}
              </div>
            )}

            <form onSubmit={handleRecruiterSubmit} className="profile-form">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="company-name" className="field-label">
                    Company name
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    value={recruiterForm.companyName}
                    onChange={e =>
                      setRecruiterForm(prev => ({ ...prev, companyName: e.target.value }))
                    }
                    placeholder="e.g. Apple"
                    className="field-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="recruiter-designation" className="field-label">
                    Your designation / title
                  </label>
                  <input
                    id="recruiter-designation"
                    type="text"
                    value={recruiterForm.designation}
                    onChange={e =>
                      setRecruiterForm(prev => ({ ...prev, designation: e.target.value }))
                    }
                    placeholder="e.g. Lead Talent Partner"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="company-website" className="field-label">
                    Company website <span className="label-hint">optional</span>
                  </label>
                  <input
                    id="company-website"
                    type="url"
                    value={recruiterForm.companyWebsite}
                    onChange={e =>
                      setRecruiterForm(prev => ({ ...prev, companyWebsite: e.target.value }))
                    }
                    placeholder="https://apple.com"
                    className="field-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="company-logo" className="field-label">
                    Company logo URL <span className="label-hint">optional</span>
                  </label>
                  <input
                    id="company-logo"
                    type="url"
                    value={recruiterForm.companyLogo}
                    onChange={e =>
                      setRecruiterForm(prev => ({ ...prev, companyLogo: e.target.value }))
                    }
                    placeholder="https://example.com/logo.png"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="company-about" className="field-label">
                    About the company <span className="label-hint">mission & culture</span>
                  </label>
                  <textarea
                    id="company-about"
                    rows={4}
                    value={recruiterForm.companyAbout}
                    onChange={e =>
                      setRecruiterForm(prev => ({ ...prev, companyAbout: e.target.value }))
                    }
                    placeholder="Describe what your organization builds and the culture you foster..."
                    className="field-textarea"
                  />
                </div>
              </div>

              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="recruiter-linkedin" className="field-label">
                    LinkedIn profile <span className="label-hint">optional</span>
                  </label>
                  <input
                    id="recruiter-linkedin"
                    type="url"
                    value={recruiterForm.linkedin}
                    onChange={e =>
                      setRecruiterForm(prev => ({ ...prev, linkedin: e.target.value }))
                    }
                    placeholder="https://linkedin.com/in/username"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={savingRecruiter}
                  className="button-publish"
                >
                  {savingRecruiter ? 'Saving...' : 'Save company details'}
                </button>
              </div>
            </form>
          </section>
        ) : (
          /* APPLICANT CAREER DETAILS */
          <section className="workspace-panel profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Professional & Career details</h2>
                <p className="lead-sub">Showcase your skills and background to recruiters.</p>
              </div>
            </div>

            {applicantMessage.text && (
              <div className={`status-banner ${applicantMessage.type}`}>
                {applicantMessage.text}
              </div>
            )}

            <form onSubmit={handleApplicantSubmit} className="profile-form">
              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="applicant-headline" className="field-label">
                    Professional headline
                  </label>
                  <input
                    id="applicant-headline"
                    type="text"
                    value={applicantForm.headline}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, headline: e.target.value }))
                    }
                    placeholder="e.g. Senior Frontend Engineer | React, TypeScript & CSS Architecture"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="applicant-skills" className="field-label">
                    Skills <span className="label-hint">comma-separated</span>
                  </label>
                  <input
                    id="applicant-skills"
                    type="text"
                    value={applicantForm.skills}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, skills: e.target.value }))
                    }
                    placeholder="e.g. React, JavaScript, TypeScript, CSS, Node.js, Next.js"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="applicant-experience" className="field-label">
                    Experience summary
                  </label>
                  <textarea
                    id="applicant-experience"
                    rows={4}
                    value={applicantForm.experience}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, experience: e.target.value }))
                    }
                    placeholder="Outline your work history, key achievements, and responsibilities..."
                    className="field-textarea"
                  />
                </div>
              </div>

              <div className="form-grid-1">
                <div className="form-field">
                  <label htmlFor="applicant-education" className="field-label">
                    Education
                  </label>
                  <input
                    id="applicant-education"
                    type="text"
                    value={applicantForm.education}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, education: e.target.value }))
                    }
                    placeholder="e.g. B.Tech in Computer Science, KRMU (2022 - 2026)"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="applicant-portfolio" className="field-label">
                    Portfolio website <span className="label-hint">optional</span>
                  </label>
                  <input
                    id="applicant-portfolio"
                    type="url"
                    value={applicantForm.portfolio}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, portfolio: e.target.value }))
                    }
                    placeholder="https://yourportfolio.dev"
                    className="field-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="applicant-github" className="field-label">
                    GitHub profile <span className="label-hint">optional</span>
                  </label>
                  <input
                    id="applicant-github"
                    type="url"
                    value={applicantForm.github}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, github: e.target.value }))
                    }
                    placeholder="https://github.com/username"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="applicant-linkedin" className="field-label">
                    LinkedIn profile <span className="label-hint">optional</span>
                  </label>
                  <input
                    id="applicant-linkedin"
                    type="url"
                    value={applicantForm.linkedin}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, linkedin: e.target.value }))
                    }
                    placeholder="https://linkedin.com/in/username"
                    className="field-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="applicant-resume" className="field-label">
                    Resume URL <span className="label-hint">optional</span>
                  </label>
                  <input
                    id="applicant-resume"
                    type="url"
                    value={applicantForm.resumeUrl}
                    onChange={e =>
                      setApplicantForm(prev => ({ ...prev, resumeUrl: e.target.value }))
                    }
                    placeholder="https://drive.google.com/your-resume"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={savingApplicant}
                  className="button-publish"
                >
                  {savingApplicant ? 'Saving...' : 'Save career details'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* CARD 3: Account Security */}
        <section className="workspace-panel profile-card">
          <div className="profile-card-header">
            <div>
              <h2>Account security</h2>
              <p className="lead-sub">Update your password to keep your account safe.</p>
            </div>
          </div>

          {passwordMessage.text && (
            <div className={`status-banner ${passwordMessage.type}`}>
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="current-password" className="field-label">
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={e =>
                    setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="field-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="new-password" className="field-label">
                  New password <span className="label-hint">min 8 characters</span>
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={passwords.newPassword}
                  onChange={e =>
                    setPasswords(prev => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="field-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="confirm-password" className="field-label">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={passwords.confirmPassword}
                  onChange={e =>
                    setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="field-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={savingPassword}
                className="button-publish"
              >
                {savingPassword ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
