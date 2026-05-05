const mongoose = require('mongoose');

const PlatformSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['CRM', 'Email Marketing', 'All-in-One'], required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  pricingUrl: { type: String },
  startingPrice: { type: Number, required: true },
  features: [{ type: String }],
  tags: {
    // Tags that match scoreAdjustments from questions
    // Example: ["budget_low", "ecommerce", "easy_setup"]
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('Platform', PlatformSchema);
