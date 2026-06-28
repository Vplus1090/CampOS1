import { Router } from 'express';
import Message from '../models/Message.js';
import ChatReport from '../models/ChatReport.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/messages/report
 * @desc    Report a chat conversation
 * @access  Authenticated
 */
router.post('/report', authenticate, async (req, res, next) => {
  try {
    const { ReportedName, Reason } = req.body;
    const ReporterName = `${req.user.firstName} ${req.user.lastName}`;

    if (!ReportedName || !Reason) {
      const error = new Error('ReportedName and Reason are required');
      error.statusCode = 400;
      return next(error);
    }

    const newReport = await ChatReport.create({
      ReporterName,
      ReportedName,
      Reason,
      Status: 'Pending',
    });

    res.status(201).json(newReport);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/messages/reports
 * @desc    Fetch all pending chat reports
 * @access  super_admin
 */
router.get('/reports', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const reports = await ChatReport.find({ Status: 'Pending' }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/messages/reports/:id
 * @desc    Dismiss or resolve a chat report
 * @access  super_admin
 */
router.delete('/reports/:id', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const report = await ChatReport.findById(req.params.id);
    if (!report) {
      const error = new Error('Report not found');
      error.statusCode = 404;
      return next(error);
    }
    report.Status = 'Resolved';
    await report.save();
    res.json({ success: true, message: 'Report resolved successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/messages/reported-history
 * @desc    Fetch message conversation history between reporter and reported user
 * @access  super_admin
 */
router.get('/reported-history', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { reporter, reported } = req.query;
    if (!reporter || !reported) {
      const error = new Error('Both reporter and reported names are required');
      error.statusCode = 400;
      return next(error);
    }

    const messages = await Message.find({
      $or: [
        { SenderName: reporter, ReceiverName: reported },
        { SenderName: reported, ReceiverName: reporter },
      ],
    }).sort({ Timestamp: 1 });

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/messages/partners
 * @desc    Get all distinct chat partners for the authenticated student
 * @access  Authenticated
 */
router.get('/partners', authenticate, async (req, res, next) => {
  try {
    const userName = req.user.firstName;
    if (!userName) {
      return res.json([]);
    }
    
    // Find all unique peer names conversed with
    const sentTo = await Message.distinct('ReceiverName', { SenderName: userName });
    const receivedFrom = await Message.distinct('SenderName', { ReceiverName: userName });
    
    const partners = Array.from(new Set([...sentTo, ...receivedFrom]))
      .filter(name => name && name !== userName);
      
    res.json(partners);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/messages/conversation
 * @desc    Delete all messages in the conversation between the user and a partner
 * @access  Authenticated
 */
router.delete('/conversation', authenticate, async (req, res, next) => {
  try {
    const { partner } = req.query;
    const userName = req.user.firstName;
    
    if (!partner) {
      const error = new Error('Partner query parameter is required');
      error.statusCode = 400;
      return next(error);
    }
    
    const result = await Message.deleteMany({
      $or: [
        { SenderName: userName, ReceiverName: partner },
        { SenderName: partner, ReceiverName: userName },
      ],
    });
    
    res.json({ success: true, message: `Deleted ${result.deletedCount} messages between ${userName} and ${partner}` });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/messages
 * @desc    Fetch message conversation history between two users (e.g. userA=Kunal&userB=Sanya)
 * @access  Public
 */
router.get('/', async (req, res, next) => {

  try {
    const { userA, userB } = req.query;

    if (!userA || !userB) {
      const error = new Error('Both userA and userB names are required in queries');
      error.statusCode = 400;
      return next(error);
    }

    // Query messages sent A -> B OR B -> A
    const messages = await Message.find({
      $or: [
        { SenderName: userA, ReceiverName: userB },
        { SenderName: userB, ReceiverName: userA },
      ],
    }).sort({ Timestamp: 1 }); // Sort chronologically

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/messages
 * @desc    Send a new chat message to a peer
 * @access  Public
 */
router.post('/', async (req, res, next) => {
  try {
    const { SenderName, ReceiverName, Content } = req.body;

    if (!SenderName || !ReceiverName || !Content) {
      const error = new Error('SenderName, ReceiverName, and Content are required');
      error.statusCode = 400;
      return next(error);
    }

    const newMessage = await Message.create({
      SenderName,
      ReceiverName,
      Content,
      Timestamp: new Date(),
    });

    res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
});

export default router;
