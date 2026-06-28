import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Flashcard question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Flashcard answer is required'],
      trim: true,
    },
  },
  { _id: true }
);

const flashcardDeckSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Deck title is required'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cards: [flashcardSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index user for fast lookups
flashcardDeckSchema.index({ user: 1 });

const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);

export default FlashcardDeck;
