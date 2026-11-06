import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['admin', 'recruiter', 'applicant'], default: 'applicant' },
    avatar: { url: String, publicId: String },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    // Applicant fields
    headline: { type: String, trim: true, default: '' },
    skills: { type: [String], default: [] },
    experience: { type: String, trim: true, default: '' },
    education: { type: String, trim: true, default: '' },
    resumeUrl: { type: String, trim: true, default: '' },
    portfolio: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    // Recruiter fields
    companyName: { type: String, trim: true, default: '' },
    companyLogo: { type: String, trim: true, default: '' },
    companyWebsite: { type: String, trim: true, default: '' },
    companyAbout: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);
userSchema.methods.matchesPassword = function matchesPassword(password) {
  return bcrypt.compare(password, this.password);
};
export default mongoose.model('User', userSchema);

