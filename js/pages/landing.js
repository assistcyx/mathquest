const LandingPage = {
  render(container) {
    const isNewPlayer = !GameState.get('player.name');
    const name = GameState.get('player.name') || 'Adventurer';
    const level = GameState.get('player.level') || 1;
    const credits = GameState.get('player.credits') || 0;
    const mood = GameState.get('partner.currentMood') || 'idle';

    container.innerHTML = `
      <div class="page">
        <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--space-2xl); position: relative; overflow: hidden;">
          <!-- Floating decorations -->
          <div class="float-element" style="top: 10%; left: 5%; animation-delay: 0s;">∫</div>
          <div class="float-element" style="top: 20%; right: 8%; animation-delay: 0.5s;">∑</div>
          <div class="float-element" style="bottom: 25%; left: 10%; animation-delay: 1s;">π</div>
          <div class="float-element" style="bottom: 20%; right: 5%; animation-delay: 1.5s;">λ</div>
          <div class="float-element" style="top: 45%; left: 3%; animation-delay: 2s;">def</div>
          <div class="float-element" style="top: 50%; right: 3%; animation-delay: 2.5s;">for</div>

          <div style="max-width: 600px; animation: fadeInUp 0.6s ease;">
            <div class="landing-partner" style="margin: 0 auto var(--space-lg);">
              ${PartnerRenderer.render({ mood, size: 'landing' })}
            </div>

            <h1 style="font-size: var(--text-4xl); background: var(--gradient-pink); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: var(--space-md);">
              ${isNewPlayer ? 'Welcome to MathQuest!' : `Welcome back, ${name}!`}
            </h1>

            <p style="font-size: var(--text-lg); color: var(--color-text-secondary); margin-bottom: var(--space-xl); line-height: 1.6;">
              ${isNewPlayer
                ? 'Learn calculus and Python through fun games and challenges with your very own learning partner!'
                : `${PartnerRenderer.getSpeech('happy')}`}
            </p>

            ${!isNewPlayer ? `
              <div style="display: flex; gap: var(--space-lg); justify-content: center; margin-bottom: var(--space-xl);">
                <div style="text-align: center;">
                  <div style="font-size: var(--text-3xl); font-weight: 800; color: var(--color-primary);">${level}</div>
                  <div style="font-size: var(--text-sm); color: var(--color-text-muted); font-weight: 600;">Level</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: var(--text-3xl); font-weight: 800; color: var(--color-warning-dark);">${credits}</div>
                  <div style="font-size: var(--text-sm); color: var(--color-text-muted); font-weight: 600;">Credits</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: var(--text-3xl); font-weight: 800; color: var(--color-success);">${GameState.get('progress.calculus.completed').length + GameState.get('progress.python.completed').length}</div>
                  <div style="font-size: var(--text-sm); color: var(--color-text-muted); font-weight: 600;">Lessons</div>
                </div>
              </div>
            ` : ''}

            <button class="btn btn-primary btn-lg" onclick="LandingPage._startLearning()">
              ${isNewPlayer ? '🚀 Start Your Adventure!' : '📚 Continue Learning'}
            </button>
          </div>
        </div>

        <!-- Feature Cards -->
        <div style="max-width: var(--max-width); margin: 0 auto; padding: var(--space-2xl) var(--space-md);">
          <div class="grid-3 stagger">
            <div class="card card-pink" onclick="Router.navigate('/lessons')" style="cursor: pointer;">
              <div style="font-size: 2.5rem; margin-bottom: var(--space-sm);">∫</div>
              <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-sm);">Calculus</h3>
              <p style="color: var(--color-text-secondary); font-size: var(--text-sm);">Master limits, derivatives, and integrals with interactive lessons.</p>
            </div>
            <div class="card card-green" onclick="Router.navigate('/lessons')" style="cursor: pointer;">
              <div style="font-size: 2.5rem; margin-bottom: var(--space-sm);">🐍</div>
              <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-sm);">Python</h3>
              <p style="color: var(--color-text-secondary); font-size: var(--text-sm);">Learn programming from variables to functions with hands-on challenges.</p>
            </div>
            <div class="card card-purple" onclick="Router.navigate('/games')" style="cursor: pointer;">
              <div style="font-size: 2.5rem; margin-bottom: var(--space-sm);">🎮</div>
              <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-sm);">Games</h3>
              <p style="color: var(--color-text-secondary); font-size: var(--text-sm);">Earn credits through quizzes, challenges, and matching games!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    if (isNewPlayer) {
      setTimeout(() => this._showNamePrompt(), 500);
    }
  },

  _showNamePrompt() {
    Modal.show({
      title: '🌟 What should I call you?',
      body: `
        <p style="margin-bottom: var(--space-md);">Enter your name to start your adventure!</p>
        <input class="input" id="name-input" placeholder="Your name..." maxlength="20" autofocus>
      `,
      actions: [
        {
          text: '✨ Start!',
          callback: () => {
            const name = document.getElementById('name-input')?.value.trim() || 'Adventurer';
            GameState.set('player.name', name);
            GameState.addCredits(20); // Welcome bonus
            Toast.show(`Welcome, ${name}! +20 bonus credits! 🎉`, 'success');
            Router.navigate('/');
          }
        }
      ],
      onClose: () => {
        const name = 'Adventurer';
        GameState.set('player.name', name);
        GameState.addCredits(20);
        Router.navigate('/');
      }
    });

    // Focus input after modal renders
    setTimeout(() => document.getElementById('name-input')?.focus(), 100);
  },

  _startLearning() {
    if (!GameState.get('player.name')) {
      this._showNamePrompt();
    } else {
      Router.navigate('/lessons');
    }
  }
};
