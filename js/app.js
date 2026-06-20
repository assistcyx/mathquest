(function() {
  'use strict';

  // Initialize state
  GameState.init();
  AudioManager.init();

  // Load data
  Promise.all([
    PartnerRenderer.load(),
    AchievementEngine.load()
  ]).then(() => {
    // Check achievements on load
    AchievementEngine.check();
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
