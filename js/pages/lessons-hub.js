const LessonsHub = {
  _calculusData: null,
  _pythonData: null,
  _algebraData: null,
  _trigData: null,

  async render(container, params) {
    container.innerHTML = `<div class="loading-spinner"></div>`;

    if (!this._calculusData) {
      try {
        const [calc, py, alg, trig] = await Promise.all([
          fetch('data/lessons-calculus.json').then(r => r.json()),
          fetch('data/lessons-python.json').then(r => r.json()),
          fetch('data/lessons-algebra.json').then(r => r.json()),
          fetch('data/lessons-trigonometry.json').then(r => r.json())
        ]);
        this._calculusData = calc;
        this._pythonData = py;
        this._algebraData = alg;
        this._trigData = trig;
      } catch (e) {
        container.innerHTML = `<div class="empty-state"><div class="icon">😅</div><h3>Couldn't load lessons</h3><p>Please check the data files.</p></div>`;
        return;
      }
    }

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>📚 Lessons</h1>
          <p>Choose your subject and start learning!</p>
        </div>

        <div class="grid-2" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          ${this._renderSubjectCard('calculus', this._calculusData)}
          ${this._renderSubjectCard('python', this._pythonData)}
          ${this._renderSubjectCard('algebra', this._algebraData)}
          ${this._renderSubjectCard('trigonometry', this._trigData)}
        </div>
      </div>
    `;
  },

  _renderSubjectCard(subject, data) {
    if (!data) return '';
    const completed = GameState.get(`progress.${subject}.completed`) || [];
    const totalLessons = data.lessons?.length || 0;
    const progress = totalLessons > 0 ? completed.length / totalLessons : 0;

    const config = {
      calculus: { cardClass: 'card-pink', btnClass: 'btn-primary', color: '#FF6B9D' },
      python: { cardClass: 'card-green', btnClass: 'btn-success', color: '#34D399' },
      algebra: { cardClass: 'card-gold', btnClass: 'btn-warning', color: '#FBBF24' },
      trigonometry: { cardClass: 'card-purple', btnClass: 'btn-purple', color: '#60A5FA' }
    };
    const cfg = config[subject] || { cardClass: '', btnClass: 'btn-primary', color: '#FF6B9D' };
    const icon = data.icon || '📐';
    const title = data.title || subject.charAt(0).toUpperCase() + subject.slice(1);

    return `
      <div class="card ${cfg.cardClass}" onclick="LessonsHub._openSubject('${subject}')" style="cursor: pointer; text-align: center; padding: var(--space-2xl);">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">${icon}</div>
        <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm); color: ${cfg.color};">${title}</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">
          ${completed.length} / ${totalLessons} lessons completed
        </p>
        <div class="progress-bar" style="margin-bottom: var(--space-md);">
          <div class="progress-bar-fill" style="width: ${progress * 100}%${subject === 'algebra' ? '; background: var(--color-algebra);' : subject === 'trigonometry' ? '; background: var(--color-accent);' : ''}"></div>
        </div>
        <button class="btn ${cfg.btnClass}">
          ${progress === 0 ? '▶ Start Learning' : progress >= 1 ? '✅ Completed!' : '▶ Continue'}
        </button>
      </div>
    `;
  },

  _openSubject(subject) {
    const data = subject === 'calculus' ? this._calculusData
      : subject === 'python' ? this._pythonData
      : subject === 'algebra' ? this._algebraData
      : this._trigData;
    if (!data || !data.lessons || data.lessons.length === 0) return;

    const completed = GameState.get(`progress.${subject}.completed`) || [];
    const firstIncomplete = data.lessons.find(l => !completed.includes(l.id));
    const targetId = firstIncomplete ? firstIncomplete.id : data.lessons[0].id;

    Router.navigate(`/lessons/${subject}/${targetId}`);
  }
};
