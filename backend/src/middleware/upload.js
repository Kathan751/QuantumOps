import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
    cb(null, `${Date.now()}-${safe}`);
  }
});

export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
