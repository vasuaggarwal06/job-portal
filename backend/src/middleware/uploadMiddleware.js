import multer from 'multer';

const storage = multer.memoryStorage();

const resumeFilter = (req, file, callback) => {
  const allowedExts = ['.pdf', '.doc', '.docx'];
  const ext = file.originalname
    ? file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase()
    : '';
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
  ];
  if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Only PDF, DOC, or DOCX files are allowed'), false);
  }
};

export const uploadResume = multer({
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('resume');

const imageFilter = (req, file, callback) => {
  if (
    file.mimetype &&
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype.toLowerCase())
  ) {
    callback(null, true);
  } else {
    callback(new Error('Only JPG, PNG, WEBP, and GIF images are allowed'), false);
  }
};

export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('avatar');

