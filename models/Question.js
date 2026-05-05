const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  value: { type: String, required: true },
  scoreAdjustments: {
    // For mapping a user's answer to score adjustments for specific tags/criteria
    // Example: { "budget_low": 10, "budget_high": -10 }
    type: Map,
    of: Number,
    default: {}
  }
});

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['single', 'multiple'], default: 'single' },
  options: [OptionSchema],
  order: { type: Number, required: true }
});

module.exports = mongoose.model('Question', QuestionSchema);
