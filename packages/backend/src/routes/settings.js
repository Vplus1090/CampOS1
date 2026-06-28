import { Router } from 'express';
import { getSetting, setSetting } from '../utils/settings.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Default status for tabs
const DEFAULT_TABS = {
  notices: { enabled: true, message: '' },
  student_dashboard: { enabled: true, message: '' },
  timetable: { enabled: true, message: '' },
  calendar: { enabled: true, message: '' },
  canteen: { enabled: true, message: '' },
  mess: { enabled: true, message: '' },
  materials: { enabled: true, message: '' },
  skillgigs: { enabled: true, message: '' }
};

/**
 * @route   GET /api/settings/tabs
 * @desc    Get control settings for campus applications
 * @access  Public
 */
router.get('/tabs', async (req, res, next) => {
  try {
    const tabControls = await getSetting('tabControls', DEFAULT_TABS);
    
    // Ensure all default keys exist in the returned settings
    const merged = {};
    for (const key of Object.keys(DEFAULT_TABS)) {
      merged[key] = {
        ...DEFAULT_TABS[key],
        ...(tabControls && tabControls[key] ? tabControls[key] : {})
      };
    }
    res.json({ success: true, tabControls: merged });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PATCH /api/settings/tabs
 * @desc    Update control settings for campus applications
 * @access  Authenticated Super Admin
 */
router.patch('/tabs', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { tabControls } = req.body;
    if (!tabControls || typeof tabControls !== 'object') {
      const error = new Error('Field "tabControls" object is required');
      error.statusCode = 400;
      return next(error);
    }

    const currentSettings = await getSetting('tabControls', DEFAULT_TABS);
    
    // Merge updates dynamically
    const updated = {};
    for (const key of Object.keys(DEFAULT_TABS)) {
      updated[key] = {
        ...DEFAULT_TABS[key],
        ...(currentSettings[key] || {}),
        ...(tabControls[key] || {})
      };
    }

    await setSetting('tabControls', updated);
    res.json({ success: true, tabControls: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
