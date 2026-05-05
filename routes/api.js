const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Question = require('../models/Question');
const Platform = require('../models/Platform');
const { getRecommendation } = require('../services/recommendationEngine');

// Get all questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find({}).sort({ order: 1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Submit answers and get recommendation
router.post('/recommend', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    const recommendation = await getRecommendation(answers);
    res.json(recommendation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate recommendation' });
  }
});

// Create Stripe Checkout Session
router.post('/checkout/create-session', async (req, res) => {
  try {
    const { planId, successUrl, cancelUrl } = req.body;

    // Hardcode plans for now (in a real app, fetch from DB or Stripe)
    const plans = {
      'consultation': {
        name: '1-on-1 Expert Consultation',
        amount: 15000, // $150.00
        currency: 'usd',
      },
      'subscription': {
        name: 'Pro Advisory Subscription',
        amount: 4900, // $49.00
        currency: 'usd',
        recurring: true
      }
    };

    const selectedPlan = plans[planId];
    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const line_item = {
      price_data: {
        currency: selectedPlan.currency,
        product_data: {
          name: selectedPlan.name,
        },
        unit_amount: selectedPlan.amount,
      },
      quantity: 1,
    };

    if (selectedPlan.recurring) {
       line_item.price_data.recurring = { interval: 'month' };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [line_item],
      mode: selectedPlan.recurring ? 'subscription' : 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/pricing`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
