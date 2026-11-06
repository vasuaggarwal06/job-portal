import User from "../models/User.js";
import bcrypt from "bcrypt";
import { cookieOptions, createToken } from "../utils/token.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
const safeUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone || '',
  location: user.location || '',
  bio: user.bio || '',
  headline: user.headline || '',
  skills: user.skills || [],
  experience: user.experience || '',
  education: user.education || '',
  resumeUrl: user.resumeUrl || '',
  portfolio: user.portfolio || '',
  github: user.github || '',
  linkedin: user.linkedin || '',
  companyName: user.companyName || '',
  companyLogo: user.companyLogo || '',
  companyWebsite: user.companyWebsite || '',
  companyAbout: user.companyAbout || '',
  designation: user.designation || '',
  createdAt: user.createdAt,
});
export async function register(req, res, next) {
  try {
    const { name, email, password, role = "applicant" } = req.body;
    if (!["applicant", "recruiter"].includes(role))
      return res.status(400).json({
        message: "Only applicant or recruiter registration is allowed",
      });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "That email is already registered" });
    next(error);
  }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchesPassword(password)))
      return res.status(401).json({ message: "Incorrect email or password" });
    res
      .cookie("token", createToken(user._id), cookieOptions)
      .json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
}
export function logout(req, res) {
  res
    .clearCookie("token", { ...cookieOptions, maxAge: undefined })
    .status(204)
    .send();
}
export const currentUser = (req, res) => res.json({ user: safeUser(req.user) });

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Handle email change
    if (req.body.email && req.body.email.trim().toLowerCase() !== user.email) {
      const emailExists = await User.findOne({
        email: req.body.email.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (emailExists) {
        return res.status(409).json({ message: 'That email is already registered.' });
      }
      user.email = req.body.email.trim().toLowerCase();
    }

    // Handle avatar file upload
    if (req.file) {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name'
      ) {
        try {
          const file = await uploadToCloudinary(
            req.file.buffer,
            'job-portal/avatars',
            'image'
          );
          user.avatar = { url: file.secure_url, publicId: file.public_id };
        } catch {
          user.avatar = {
            url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          };
        }
      } else {
        user.avatar = {
          url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        };
      }
    } else if (req.body.avatar && typeof req.body.avatar === 'string') {
      user.avatar = { url: req.body.avatar.trim() };
    }

    const allowedFields = [
      'name',
      'phone',
      'location',
      'bio',
      'headline',
      'skills',
      'experience',
      'education',
      'resumeUrl',
      'portfolio',
      'github',
      'linkedin',
      'companyName',
      'companyLogo',
      'companyWebsite',
      'companyAbout',
      'designation',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'skills' && typeof req.body.skills === 'string') {
          user.skills = req.body.skills.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          user[field] = req.body[field];
        }
      }
    }

    await user.save();
    res.json({ user: safeUser(user), message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.matchesPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

