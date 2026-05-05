const Platform = require('../models/Platform');
const Question = require('../models/Question');

/**
 * Calculates the best platform based on user answers using a scoring heuristic
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

    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return;

      const selectedOption = question.options.find(o => o.value === answer.value);
      if (!selectedOption || !selectedOption.scoreAdjustments) return;

      // selectedOption.scoreAdjustments is a Map in Mongoose, but we can treat it like an object/iterator
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
    const secondPlace = platformsWithScores[1]?.platform;

    // 4. Generate a simple reason
    let reason = `Based on your needs, ${winner.name} scored the highest match (${platformsWithScores[0].score} points).`;
    if (secondPlace) {
      reason += ` It narrowly beat out ${secondPlace.name} to be your top choice.`;
    }

    return { 
      ...winner.toObject(), 
      reason: reason 
    };

  } catch (error) {
    console.error("Error in heuristic recommendation engine:", error);
    // Ultimate fallback if something fails
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
