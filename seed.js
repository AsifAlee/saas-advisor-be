const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Platform = require('./models/Platform');
const Question = require('./models/Question');

dotenv.config();

const questions = [
  {
    id: "q1_industry",
    text: "What industry is your business in?",
    order: 1,
    type: "single",
    options: [
      { text: "E-commerce", value: "ecommerce", scoreAdjustments: { "ecommerce": 10 } },
      { text: "B2B SaaS / Tech", value: "b2b_saas", scoreAdjustments: { "b2b": 10 } },
      { text: "Agency / Services", value: "agency", scoreAdjustments: { "b2b": 5, "services": 5 } },
      { text: "Other", value: "other", scoreAdjustments: {} }
    ]
  },
  {
    id: "q2_budget",
    text: "What is your monthly budget for this tool?",
    order: 2,
    type: "single",
    options: [
      { text: "Under $50", value: "budget_low", scoreAdjustments: { "budget_low": 20 } },
      { text: "$50 - $200", value: "budget_med", scoreAdjustments: { "budget_med": 10 } },
      { text: "$200+", value: "budget_high", scoreAdjustments: { "budget_high": 10, "enterprise": 5 } }
    ]
  },
  {
    id: "q3_goal",
    text: "What is your primary goal?",
    order: 3,
    type: "single",
    options: [
      { text: "Send newsletters", value: "newsletters", scoreAdjustments: { "email_marketing": 15 } },
      { text: "Sales pipeline management", value: "pipeline", scoreAdjustments: { "crm": 15, "sales": 10 } },
      { text: "All-in-one automation", value: "automation", scoreAdjustments: { "all_in_one": 15, "automation": 10 } }
    ]
  }
];

const platforms = [
  {
    id: "p_mailchimp",
    name: "Mailchimp",
    category: "Email Marketing",
    description: "Great for beginners and small ecommerce shops sending simple newsletters.",
    startingPrice: 13,
    features: ["Email templates", "Basic automation", "Landing pages"],
    tags: ["email_marketing", "budget_low", "ecommerce", "newsletters"]
  },
  {
    id: "p_hubspot",
    name: "HubSpot",
    category: "All-in-One",
    description: "Powerful CRM and marketing automation platform for scaling businesses.",
    startingPrice: 45,
    features: ["Advanced CRM", "Marketing automation", "Sales pipeline", "Reporting"],
    tags: ["crm", "b2b", "sales", "budget_high", "budget_med", "all_in_one", "automation"]
  },
  {
    id: "p_activecampaign",
    name: "ActiveCampaign",
    category: "Email Marketing",
    description: "Advanced email marketing and automation for businesses that need complex workflows.",
    startingPrice: 29,
    features: ["Visual automation builder", "Site tracking", "CRM capabilities"],
    tags: ["email_marketing", "automation", "budget_med", "services"]
  },
  {
    id: "p_pipedrive",
    name: "Pipedrive",
    category: "CRM",
    description: "Sales-focused CRM designed to help small teams manage intricate or lengthy sales processes.",
    startingPrice: 15,
    features: ["Pipeline management", "Email integration", "Sales reporting"],
    tags: ["crm", "sales", "budget_low", "budget_med", "pipeline"]
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saas-advisory-tool');
    console.log("Connected to MongoDB");

    await Question.deleteMany({});
    await Platform.deleteMany({});
    console.log("Cleared existing data");

    await Question.insertMany(questions);
    await Platform.insertMany(platforms);
    console.log("Seed data inserted successfully");

    mongoose.connection.close();
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedDB();
