const Platform = require('../models/Platform');
const Question = require('../models/Question');
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Calculates the best platform based on user answers using a scoring heuristic
 * and generates a personalized explanation using Gemini AI.
 * @param {Array<{questionId: String, value: String}>} answers 
 * @returns {Promise<Object>} The recommended platform
 */
async function getRecommendation(answers) {
  try {
    const platforms = await Platform.find({});
    const questions = await Question.find({});

    if (!platforms.length) {
      throw new Error("No platforms found in database");
    }

    // 1. Initialize scores for tags based on user answers
    const tagScores = {};
    const userSummary = [];

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return;

      const selectedOption = question.options.find(o => o.value === answer.value);
      if (!selectedOption) return;

      userSummary.push({
        question: question.text,
        answer: selectedOption.text
      });

      if (!selectedOption.scoreAdjustments) return;

      const adjustments = selectedOption.scoreAdjustments instanceof Map 
        ? Object.fromEntries(selectedOption.scoreAdjustments) 
        : selectedOption.scoreAdjustments;

      for (const [tag, score] of Object.entries(adjustments)) {
        tagScores[tag] = (tagScores[tag] || 0) + score;
      }
    });

    // 2. Score each platform based on its tags
    const platformsWithScores = platforms.map(platform => {
      let score = 0;
      platform.tags.forEach(tag => {
        if (tagScores[tag]) {
          score += tagScores[tag];
        }
      });
      return { platform, score };
    });

    // 3. Sort by score (descending)
    platformsWithScores.sort((a, b) => b.score - a.score);

    const winner = platformsWithScores[0].platform;

    // 4. Generate a personalized reason using Gemini
    let reason = `Based on your needs, ${winner.name} is the best match for you.`;
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        You are a SaaS advisor expert. Based on the user's answers to a questionnaire and the selected tool, provide a concise (2-3 sentences) personalized explanation of why this tool is the best fit for them.
        
        User Answers:
        ${userSummary.map(s => `- ${s.question}: ${s.answer}`).join('\n')}
        
        Recommended Tool:
        Name: ${winner.name}
        Description: ${winner.description}
        Features: ${winner.features.join(', ')}
        
        Provide the explanation in a friendly, professional tone.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        reason = text.trim();
      }
    } catch (aiError) {
      console.error("Gemini AI Error:", aiError);
      // Fallback to simple reason if AI fails
    }

    return { 
      ...winner.toObject(), 
      reason: reason 
    };

  } catch (error) {
    console.error("Error in recommendation engine:", error);
    const fallbackPlatforms = await Platform.find({});
    if (fallbackPlatforms.length > 0) {
      return { 
        ...fallbackPlatforms[0].toObject(), 
        reason: "We used a default matching algorithm to find this platform for you." 
      };
    }
    throw error;
  }
}

module.exports = {
  getRecommendation
};
