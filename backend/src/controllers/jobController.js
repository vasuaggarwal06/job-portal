import Job from '../models/Job.js';

function formatJobPayload(body) {
  const payload = { ...body };
  if (typeof payload.skills === 'string') {
    payload.skills = payload.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (payload.salary) {
    const minVal = payload.salary.min;
    const maxVal = payload.salary.max;
    const min =
      minVal !== '' && minVal !== null && minVal !== undefined && !isNaN(Number(minVal))
        ? Number(minVal)
        : undefined;
    const max =
      maxVal !== '' && maxVal !== null && maxVal !== undefined && !isNaN(Number(maxVal))
        ? Number(maxVal)
        : undefined;
    payload.salary = {
      currency: payload.salary.currency || 'INR',
      ...(min !== undefined ? { min } : {}),
      ...(max !== undefined ? { max } : {}),
    };
  }
  return payload;
}

export async function listJobs(req, res, next) {
  try {
    const { keyword, location, employmentType, recruiter } = req.query;
    const query = { status: 'open' };
    if (recruiter) query.recruiter = recruiter;
    if (keyword) {
      query.$or = ['title', 'companyName', 'description', 'skills'].map(field => ({
        [field]: { $regex: keyword, $options: 'i' },
      }));
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (employmentType) query.employmentType = employmentType;
    const jobs = await Job.find(query).sort({ createdAt: -1 }).populate('recruiter', 'name email');
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

export async function getMyJobs(req, res, next) {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name email');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const payload = formatJobPayload(req.body);
    if (!payload.title || !payload.companyName || !payload.location || !payload.description) {
      return res.status(400).json({
        message: 'Job title, company name, location, and role description are required.',
      });
    }
    const job = await Job.create({ ...payload, recruiter: req.user._id });
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not your job post' });
    }
    const payload = formatJobPayload(req.body);
    Object.assign(job, payload);
    await job.save();
    res.json({ job, message: 'Job post updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not your job post' });
    }
    await job.deleteOne();
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
}

