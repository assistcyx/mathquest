const AdaptiveEngine = {
  TOPICS: {
    'limits': { subject: 'calculus', label: 'Limits', prerequisites: [], difficultyOrder: ['easy', 'medium', 'hard'] },
    'derivatives': { subject: 'calculus', label: 'Derivatives', prerequisites: ['limits'], difficultyOrder: ['easy', 'medium', 'hard'] },
    'basic-integration': { subject: 'calculus', label: 'Basic Integration', prerequisites: ['derivatives'], difficultyOrder: ['easy', 'medium', 'hard'] },
    'chain-rule': { subject: 'calculus', label: 'Chain Rule', prerequisites: ['derivatives'], difficultyOrder: ['medium', 'hard'] },
    'product-quotient': { subject: 'calculus', label: 'Product & Quotient Rules', prerequisites: ['derivatives'], difficultyOrder: ['medium', 'hard'] },
    'derivative-apps': { subject: 'calculus', label: 'Applications of Derivatives', prerequisites: ['derivatives'], difficultyOrder: ['hard'] },
    'variables': { subject: 'python', label: 'Variables & Data Types', prerequisites: [], difficultyOrder: ['easy'] },
    'lists-loops': { subject: 'python', label: 'Lists & Loops', prerequisites: ['variables'], difficultyOrder: ['easy', 'medium'] },
    'functions': { subject: 'python', label: 'Functions', prerequisites: ['variables', 'lists-loops'], difficultyOrder: ['easy', 'medium', 'hard'] },
    'dicts-sets': { subject: 'python', label: 'Dictionaries & Sets', prerequisites: ['lists-loops'], difficultyOrder: ['medium', 'hard'] },
    'error-handling': { subject: 'python', label: 'Error Handling', prerequisites: ['functions'], difficultyOrder: ['medium', 'hard'] },
    'classes-oop': { subject: 'python', label: 'Classes & OOP', prerequisites: ['functions', 'error-handling'], difficultyOrder: ['hard'] },
    'linear-equations': { subject: 'algebra', label: 'Linear Equations', prerequisites: [], difficultyOrder: ['easy'] },
    'quadratics': { subject: 'algebra', label: 'Quadratics', prerequisites: ['linear-equations'], difficultyOrder: ['easy', 'medium'] },
    'systems-equations': { subject: 'algebra', label: 'Systems of Equations', prerequisites: ['linear-equations'], difficultyOrder: ['medium', 'hard'] }
  },

  // Topic-to-lesson mapping
  TOPIC_LESSON_MAP: {
    'limits': { subject: 'calculus', id: 1 },
    'derivatives': { subject: 'calculus', id: 2 },
    'basic-integration': { subject: 'calculus', id: 3 },
    'chain-rule': { subject: 'calculus', id: 4 },
    'product-quotient': { subject: 'calculus', id: 5 },
    'derivative-apps': { subject: 'calculus', id: 6 },
    'variables': { subject: 'python', id: 1 },
    'lists-loops': { subject: 'python', id: 2 },
    'functions': { subject: 'python', id: 3 },
    'dicts-sets': { subject: 'python', id: 4 },
    'error-handling': { subject: 'python', id: 5 },
    'classes-oop': { subject: 'python', id: 6 },
    'linear-equations': { subject: 'algebra', id: 1 },
    'quadratics': { subject: 'algebra', id: 2 },
    'systems-equations': { subject: 'algebra', id: 3 }
  },

  // Get mastery for a topic (0.0 - 1.0)
  getMastery(topicId) {
    const mastery = GameState.get('mastery') || {};
    return mastery[topicId] || 0;
  },

  // Update mastery after a quiz/game result
  updateMastery(topicId, correct, total) {
    if (!total || total === 0) return;
    const currentMastery = this.getMastery(topicId);
    const score = correct / total;
    // Weighted moving average: new mastery = 0.7 * old + 0.3 * new score
    const newMastery = currentMastery * 0.7 + score * 0.3;
    const mastery = GameState.get('mastery') || {};
    mastery[topicId] = Math.round(newMastery * 100) / 100;
    GameState.set('mastery', mastery);
    AchievementEngine.check();
  },

  // Update mastery from a lesson completion
  updateMasteryFromLesson(subject, lessonId) {
    for (const [topicId, mapping] of Object.entries(this.TOPIC_LESSON_MAP)) {
      if (mapping.subject === subject && mapping.id === lessonId) {
        this.updateMastery(topicId, 1, 1);
        return;
      }
    }
  },

  // Get recommended difficulty for a topic
  getRecommendedDifficulty(topicId) {
    const mastery = this.getMastery(topicId);
    const topic = this.TOPICS[topicId];
    if (!topic) return 'easy';
    if (mastery >= 0.8) return 'hard';
    if (mastery >= 0.4) return 'medium';
    return 'easy';
  },

  // Get next recommended lesson to study
  getNextRecommendedLesson() {
    const subjects = ['calculus', 'python', 'algebra'];

    for (const subject of subjects) {
      const completed = GameState.get(`progress.${subject}.completed`) || [];

      // Try to find first incomplete lesson with prerequisites met
      for (const [topicId, mapping] of Object.entries(this.TOPIC_LESSON_MAP)) {
        if (mapping.subject !== subject) continue;
        if (completed.includes(mapping.id)) continue;

        // Check prerequisites
        const topic = this.TOPICS[topicId];
        if (!topic) continue;
        const prereqsMet = topic.prerequisites.every(preReqTopic => {
          const preReqMap = this.TOPIC_LESSON_MAP[preReqTopic];
          if (!preReqMap) return true;
          const preReqCompleted = GameState.get(`progress.${preReqMap.subject}.completed`) || [];
          return preReqCompleted.includes(preReqMap.id);
        });

        if (prereqsMet) {
          return { subject, lessonId: mapping.id, topicId };
        }
      }
    }
    return null;
  },

  // Get overall mastery for a subject (average of all topic masteries)
  getSubjectMastery(subject) {
    const topics = Object.entries(this.TOPICS).filter(([_, t]) => t.subject === subject);
    if (topics.length === 0) return 0;
    const sum = topics.reduce((acc, [id]) => acc + this.getMastery(id), 0);
    return Math.round((sum / topics.length) * 100) / 100;
  },

  // Get the top mastery topic
  getTopMasteryTopic() {
    const mastery = GameState.get('mastery') || {};
    let bestTopic = null;
    let bestScore = 0;
    for (const [topicId, score] of Object.entries(mastery)) {
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topicId;
      }
    }
    if (bestTopic && this.TOPICS[bestTopic]) {
      return { topicId: bestTopic, label: this.TOPICS[bestTopic].label, score: bestScore };
    }
    return null;
  },

  // Filter questions by recommended difficulty for a topic
  filterQuestionsByDifficulty(questions, topicId) {
    const recommendedDiff = this.getRecommendedDifficulty(topicId);
    const filtered = questions.filter(q => q.difficulty === recommendedDiff);
    // If no questions at recommended difficulty, fall back to all
    return filtered.length > 0 ? filtered : questions;
  },

  // Check if adaptive learning is enabled
  isEnabled() {
    return GameState.get('settings.adaptiveLearning') !== false;
  }
};
