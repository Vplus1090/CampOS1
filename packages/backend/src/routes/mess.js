import { Router } from 'express';
import MessToken from '../models/MessToken.js';
import MessDailyMenu from '../models/MessDailyMenu.js';
import MessWeeklyMenu from '../models/MessWeeklyMenu.js';
import { authenticate, authenticateOptional, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/mess/buy-mess-ticket
 * @desc    Buy a mess ticket (₹80) expiring in 90 minutes
 * @access  Public / Authenticated
 */
router.post('/buy-mess-ticket', authenticateOptional, async (req, res, next) => {
  try {
    const quantity = parseInt(req.body.quantity, 10) || 1;
    if (quantity < 1) {
      const error = new Error('Quantity must be at least 1');
      error.statusCode = 400;
      return next(error);
    }

    const studentName = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Guest Student';
    
    const now = new Date();
    // Expiry set to exactly 90 minutes from now
    const expiry = new Date(now.getTime() + 90 * 60 * 1000);

    const token = await MessToken.create({
      StudentName: studentName,
      PassType: 'Guest',
      IssuedAt: now,
      ExpiryTime: expiry,
      Quantity: quantity,
    });

    res.status(201).json({
      success: true,
      message: 'Mess ticket purchased successfully',
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/mess/daily
 * @desc    Get daily mess menu
 * @access  Public
 */
router.get('/daily', async (req, res, next) => {
  try {
    const daily = await MessDailyMenu.find({}).sort({ createdAt: 1 });
    res.json(daily);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/mess/daily/:id
 * @desc    Update a daily mess meal item/time
 * @access  Authenticated (Requires admin or super_admin role)
 */
router.put('/daily/:id', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { items, time, title } = req.body;
    
    // Allow lookup by MongoDB ID or mealId string
    let meal = await MessDailyMenu.findById(req.params.id);
    if (!meal) {
      meal = await MessDailyMenu.findOne({ mealId: req.params.id });
    }

    if (!meal) {
      const error = new Error('Daily meal record not found');
      error.statusCode = 404;
      return next(error);
    }

    if (items !== undefined) meal.items = items;
    if (time !== undefined) meal.time = time;
    if (title !== undefined) meal.title = title;

    await meal.save();
    res.json(meal);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/mess/weekly
 * @desc    Get weekly mess menu
 * @access  Public
 */
router.get('/weekly', async (req, res, next) => {
  try {
    const weekly = await MessWeeklyMenu.find({});
    res.json(weekly);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/mess/weekly/:id
 * @desc    Update weekly menu day meals
 * @access  Authenticated (Requires super_admin role)
 */
router.put('/weekly/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { breakfast, lunch, dinner } = req.body;

    // Allow lookup by MongoDB ID or day name string
    let weeklyDay = await MessWeeklyMenu.findById(req.params.id);
    if (!weeklyDay) {
      weeklyDay = await MessWeeklyMenu.findOne({ day: req.params.id });
    }

    if (!weeklyDay) {
      const error = new Error('Weekly menu record not found');
      error.statusCode = 404;
      return next(error);
    }

    if (breakfast !== undefined) weeklyDay.breakfast = breakfast;
    if (lunch !== undefined) weeklyDay.lunch = lunch;
    if (dinner !== undefined) weeklyDay.dinner = dinner;

    await weeklyDay.save();
    res.json(weeklyDay);
  } catch (err) {
    next(err);
  }
});

export default router;
