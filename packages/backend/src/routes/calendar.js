import { Router } from 'express';
import mongoose from 'mongoose';
import CalendarEvent from '../models/CalendarEvent.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Helper validation for date string format (ISO or standard parsable date)
const isValidDateString = (dateStr) => {
  if (!dateStr) return false;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
};

/**
 * @route   GET /api/calendar
 * @desc    Get all calendar events
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Return events matching the query filter, sorted by date
    const events = await CalendarEvent.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/calendar
 * @desc    Create a new calendar event
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.post('/', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { date, category, tags, desc, theme } = req.body;

    if (!date || !category || !desc) {
      const error = new Error('date, category, and desc are required.');
      error.statusCode = 400;
      return next(error);
    }

    if (!isValidDateString(date)) {
      const error = new Error('Invalid date format. Must be a valid date string.');
      error.statusCode = 400;
      return next(error);
    }

    if (theme && !['teal', 'rose', 'amber', 'magenta', 'purple'].includes(theme)) {
      const error = new Error('Invalid theme. Allowed values: teal, rose, amber, magenta, purple.');
      error.statusCode = 400;
      return next(error);
    }

    const event = await CalendarEvent.create({
      date,
      category,
      tags: tags || [],
      desc,
      theme: theme || 'teal',
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/calendar/:id
 * @desc    Update an existing calendar event
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.put('/:id', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { date, category, tags, desc, theme } = req.body;

    // Validate MongoDB ObjectId format to prevent CastErrors
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const error = new Error('Invalid calendar event ID format.');
      error.statusCode = 400;
      return next(error);
    }

    if (date !== undefined && !isValidDateString(date)) {
      const error = new Error('Invalid date format. Must be a valid date string.');
      error.statusCode = 400;
      return next(error);
    }

    if (theme !== undefined && !['teal', 'rose', 'amber', 'magenta', 'purple'].includes(theme)) {
      const error = new Error('Invalid theme. Allowed values: teal, rose, amber, magenta, purple.');
      error.statusCode = 400;
      return next(error);
    }

    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      const error = new Error('Calendar event not found');
      error.statusCode = 404;
      return next(error);
    }

    if (date !== undefined) event.date = date;
    if (category !== undefined) event.category = category;
    if (tags !== undefined) event.tags = tags;
    if (desc !== undefined) event.desc = desc;
    if (theme !== undefined) event.theme = theme;

    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/calendar/:id
 * @desc    Delete a calendar event
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    // Validate MongoDB ObjectId format to prevent CastErrors
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const error = new Error('Invalid calendar event ID format.');
      error.statusCode = 400;
      return next(error);
    }

    const event = await CalendarEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      const error = new Error('Calendar event not found');
      error.statusCode = 404;
      return next(error);
    }

    res.json({ message: 'Calendar event successfully deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
