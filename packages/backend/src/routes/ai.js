import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  chatWithCampAi,
  generateFlashcards,
  getDecks,
  deleteDeck
} from '../controllers/aiController.js';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Only PDF files are supported.'));
    }
    cb(undefined, true);
  }
});

const router = Router();

router.post('/chat', authenticate, chatWithCampAi);
router.post('/flashcards/generate', authenticate, upload.single('pdf'), generateFlashcards);
router.get('/flashcards', authenticate, getDecks);
router.delete('/flashcards/:id', authenticate, deleteDeck);

export default router;
