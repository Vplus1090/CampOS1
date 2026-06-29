import { Router } from 'express';
import StudyMaterial from '../models/StudyMaterial.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Helper validation for Google Drive link format
const isValidDriveLink = (link) => {
  if (!link) return false;
  const drivePattern = /^https?:\/\/(drive|docs)\.google\.com\/(file\/d\/[a-zA-Z0-9_-]+|folders\/[a-zA-Z0-9_-]+|open\?id=[a-zA-Z0-9_-]+|drive\/folders\/[a-zA-Z0-9_-]+)/;
  return drivePattern.test(link);
};


/**
 * @route   GET /api/studymaterials
 * @desc    Get all study materials
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { branch, semester, type, search } = req.query;
    const filter = {};

    if (branch) {
      filter.branch = branch;
    }
    if (semester) {
      filter.semester = parseInt(semester, 10);
    }
    if (type) {
      filter.type = type;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const materials = await StudyMaterial.find(filter).sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/studymaterials
 * @desc    Create a new study material
 * @access  Authenticated (Requires super_admin role)
 */
router.post('/', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name, driveLink, branch, semester, type, code, size, subject } = req.body;

    if (!name || !driveLink || !branch || !semester) {
      const error = new Error('name, driveLink, branch, and semester are required.');
      error.statusCode = 400;
      return next(error);
    }

    if (!isValidDriveLink(driveLink)) {
      const error = new Error('Invalid Google Drive link format.');
      error.statusCode = 400;
      return next(error);
    }

    const semNum = parseInt(semester, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      const error = new Error('Semester must be an integer between 1 and 8.');
      error.statusCode = 400;
      return next(error);
    }

    const material = await StudyMaterial.create({
      name,
      driveLink,
      branch,
      semester,
      type: type || 'Notes',
      subject: subject || 'General',
      code: code || 'GEN-101',
      size: size || '1.2 MB',
    });

    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/studymaterials/:id
 * @desc    Update an existing study material
 * @access  Authenticated (Requires super_admin role)
 */
router.put('/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { name, driveLink, branch, semester, type, code, size, subject } = req.body;

    if (driveLink !== undefined && !isValidDriveLink(driveLink)) {
      const error = new Error('Invalid Google Drive link format.');
      error.statusCode = 400;
      return next(error);
    }

    if (semester !== undefined) {
      const semNum = parseInt(semester, 10);
      if (isNaN(semNum) || semNum < 1 || semNum > 8) {
        const error = new Error('Semester must be an integer between 1 and 8.');
        error.statusCode = 400;
        return next(error);
      }
    }

    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      return next(error);
    }

    if (name !== undefined) material.name = name;
    if (driveLink !== undefined) material.driveLink = driveLink;
    if (branch !== undefined) material.branch = branch;
    if (semester !== undefined) material.semester = semester;
    if (type !== undefined) material.type = type;
    if (subject !== undefined) material.subject = subject;
    if (code !== undefined) material.code = code;
    if (size !== undefined) material.size = size;

    await material.save();
    res.json(material);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/studymaterials/:id
 * @desc    Delete a study material
 * @access  Authenticated (Requires super_admin role)
 */
router.delete('/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const material = await StudyMaterial.findByIdAndDelete(req.params.id);
    if (!material) {
      const error = new Error('Study material not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Study material successfully deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
