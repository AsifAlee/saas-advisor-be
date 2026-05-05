const Platform = require('../models/Platform');
const Question = require('../models/Question');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

/**
 * Calculates the best platform based on user answers using OpenAI
 * @param {Array<{questionId: String, value: String}>} answers 
 * @returns {Promise<Object>} The recommended platform
 */
async function getRecommendation(answers) {
  try {
    const platforms = await Platform.find({});
    const questions = await Question.find({});

    // Build the user profile from their answers
    let userProfile = "";
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        const answerValues = Array.isArray(answer.value) ? answer.value : [answer.value];
        const selectedOptionsText = answerValues.map(val => {
          const option = question.options.find(o => o.value === val);
          return option ? option.text : val;
        }).join(', ');
        userProfile += `Q: ${question.text}\nA: ${selectedOptionsText}\n\n`;
      }
    });

    // Build the available platforms list
    let platformsContext = platforms.map(p => {
      return `ID: ${p.id}
Name: ${p.name}
Category: ${p.category}
Description: ${p.description}
Starting Price: $${p.startingPrice}
Features: ${p.features.join(', ')}
`;
    }).join('\n---\n');

    const prompt = `You are an expert SaaS advisory tool. Your task is to recommend the single best platform from the available platforms list based on the user's answers to a questionnaire.

User Profile:
${userProfile}

Available Platforms:
${platformsContext}

Analyze the User Profile and the Available Platforms carefully. Select the ID of the single best platform that meets the user's needs.
You MUST respond with a valid JSON object in the following format, with NO markdown formatting or other text:
{
  "platformId": "the selected platform ID",
  "reason": "A short, 1-2 sentence explanation of why this platform is the best fit."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    let selectedPlatformId = null;
    let recommendationReason = "";
    
    try {
      const parsed = JSON.parse(responseContent);
      selectedPlatformId = parsed.platformId;
      recommendationReason = parsed.reason;
    } catch (e) {
      console.error("Failed to parse OpenAI response", responseContent);
    }

    if (!selectedPlatformId) {
      return platforms[0]; // Fallback to first if no clear winner
    }

    const recommendedPlatform = platforms.find(p => p.id === selectedPlatformId);
    
    if (recommendedPlatform) {
      // You could attach the reason if you wanted to display it on the frontend
      // For now, we return the platform model to match the existing API contract.
      // We can convert to lean object and add reason just in case
      return { ...recommendedPlatform.toObject(), reason: recommendationReason };
    }

    return platforms[0];
  } catch (error) {
    console.error("Error in recommendation engine:", error);
    throw error;
  }
}

module.exports = {
  getRecommendation
};
