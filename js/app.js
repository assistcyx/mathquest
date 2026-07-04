(function() {
  'use strict';

  // Initialize state
  GameState.init();
  AudioManager.init();
  MemoryEngine.init();

  // Initialize Phase 2 engines
  if (typeof MathQuestDB !== 'undefined') {
    MathQuestDB.init().then(function() {
      if (typeof KBEngine !== 'undefined') KBEngine.init();
    }).catch(function(e) {
      console.warn('IndexedDB not available, KB features disabled', e);
    });
  }
  if (typeof PathEngine !== 'undefined') {
    PathEngine.load();
  }

  // Load data
  Promise.all([
    PartnerRenderer.load(),
    AchievementEngine.load()
  ]).then(() => {
    // Check achievements on load
    AchievementEngine.check();
  });

  // Hook into GameState for automatic memory tracing
  GameState.on('lesson:completed', function(subject, lessonId) {
    MemoryEngine.trace('lesson', 'completed', { subject: subject, lessonId: lessonId });
    // Also store as a fact
    var key = 'mastery.' + subject + '.' + lessonId;
    MemoryEngine.rememberFact(key, 0.6, 0.5);
  });

  // Register routes
  Router.register('/', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    LandingPage.render(main);
  });

  Router.register('/lessons', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    LessonsHub.render(main, {});
  });

  Router.register('/lessons/calculus/:id', (app, params) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    LessonViewer.render(main, { subject: 'calculus', id: params.id });
  });

  Router.register('/lessons/python/:id', (app, params) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    LessonViewer.render(main, { subject: 'python', id: params.id });
  });

  Router.register('/games', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    GamesHub.render(main);
  });

  Router.register('/games/quiz', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    QuizGame.render(main);
  });

  Router.register('/games/code', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    CodeChallengeGame.render(main);
  });

  Router.register('/games/match', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    MatchingGame.render(main);
  });

  Router.register('/games/speedmath', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    SpeedMathGame.render(main);
  });

  Router.register('/games/wordproblems', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    WordProblemsGame.render(main);
  });

  Router.register('/games/bossbattle', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    BossBattleGame.render(main);
  });

  Router.register('/ai-tutor', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    AiTutor.render(main);
  });

  Router.register('/memory', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    MemoryInspector.render(main);
  });

  Router.register('/knowledge-base', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    KBManager.render(main);
  });

  Router.register('/mastery-path', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    MasteryPathPage.render(main);
  });

  Router.register('/lessons/algebra/:id', (app, params) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    LessonViewer.render(main, { subject: 'algebra', id: params.id });
  });

  Router.register('/lessons/trigonometry/:id', (app, params) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    LessonViewer.render(main, { subject: 'trigonometry', id: params.id });
  });

  Router.register('/partner', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    PartnerPage.render(main);
  });

  Router.register('/shop', (app) => {
    app.innerHTML = '';
    app.appendChild(Header.render());
    const main = document.createElement('main');
    main.className = 'main-content';
    app.appendChild(main);
    ShopPage.render(main);
  });

  // Initialize the router
  Router.init();

  // Handle page visibility for audio context
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      AudioManager.ensureContext();
    }
  });

  // Handle first click to init audio context
  document.addEventListener('click', () => {
    AudioManager.ensureContext();
  }, { once: true });

  console.log('🌟 MathQuest loaded! Happy learning!');
})();
