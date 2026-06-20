const LessonViewer = {
  _calculusData: null,
  _pythonData: null,

  async render(container, params) {
    const { subject, id } = params;
    if (!subject || !id) {
      container.innerHTML = `<div class="empty-state"><div class="icon">😅</div><h3>Lesson not found</h3></div>`;
      return;
    }

    container.innerHTML = `<div class="loading-spinner"></div>`;

    // Load data if needed
    if (subject === 'calculus' && !this._calculusData) {
      try { this._calculusData = await fetch('data/lessons-calculus.json').then(r => r.json()); }
      catch (e) { container.innerHTML = '<div class="empty-state">Failed to load lessons</div>'; return; }
    }
    if (subject === 'python' && !this._pythonData) {
      try { this._pythonData = await fetch('data/lessons-python.json').then(r => r.json()); }
      catch (e) { container.innerHTML = '<div class="empty-state">Failed to load lessons</div>'; return; }
    }

    const data = subject === 'calculus' ? this._calculusData : this._pythonData;
    const lesson = data?.lessons?.find(l => l.id === parseInt(id));
    if (!lesson) {
      container.innerHTML = `<div class="empty-state"><div class="icon">📖</div><h3>Lesson not found</h3></div>`;
      return;
    }

    const completed = GameState.get(`progress.${subject}.completed`) || [];
    const isCompleted = completed.includes(lesson.id);
    const isPink = subject === 'calculus';
    const allLessons = data.lessons || [];
    const currentIndex = allLessons.findIndex(l => l.id === lesson.id);

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="two-col">
          <!-- Sidebar -->
          <div class="lesson-sidebar">
            <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-md); color: ${isPink ? 'var(--color-primary)' : 'var(--color-success)'};">
              ${data.icon || ''} ${data.title || subject}
            </h3>
            <div style="display: flex; flex-direction: column; gap: var(--space-xs);">
              ${allLessons.map((l, i) => `
                <button class="btn btn-sm ${l.id === lesson.id ? (isPink ? 'btn-primary' : 'btn-success') : completed.includes(l.id) ? 'btn-ghost' : 'btn-secondary'}"
                  onclick="LessonViewer._navigate('${subject}', ${l.id})"
                  style="text-align: left; justify-content: flex-start;">
                  ${completed.includes(l.id) ? '✅' : l.id === lesson.id ? '📖' : '📄'} ${l.title}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Main Content -->
          <div class="lesson-content">
            <div class="card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
                <div>
                  <span class="badge ${isPink ? 'badge-pink' : 'badge-green'}">${lesson.difficulty || 'beginner'}</span>
                  <span class="badge badge-gold" style="margin-left: var(--space-xs);">+${lesson.creditReward || 10} credits</span>
                </div>
                <span style="font-size: var(--text-sm); color: var(--color-text-muted);">Lesson ${currentIndex + 1} of ${allLessons.length}</span>
              </div>

              <h2 style="font-size: var(--text-2xl); margin-bottom: var(--space-xl);">${lesson.title}</h2>

              <div class="lesson-sections">
                ${(lesson.sections || []).map(s => this._renderSection(s)).join('')}
              </div>

              <div style="margin-top: var(--space-2xl); text-align: center;">
                ${isCompleted ? `
                  <div style="padding: var(--space-md); background: var(--color-success-light); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
                    ✅ You've completed this lesson!
                  </div>
                ` : `
                  <button class="btn btn-primary btn-lg" onclick="LessonViewer._completeLesson('${subject}', ${lesson.id})">
                    ✅ Complete Lesson
                  </button>
                `}

                <div style="margin-top: var(--space-md); display: flex; gap: var(--space-sm); justify-content: center;">
                  ${currentIndex > 0 ? `<button class="btn btn-ghost" onclick="LessonViewer._navigate('${subject}', ${allLessons[currentIndex - 1].id})">← Previous</button>` : ''}
                  ${currentIndex < allLessons.length - 1 ? `<button class="btn btn-ghost" onclick="LessonViewer._navigate('${subject}', ${allLessons[currentIndex + 1].id})">Next →</button>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderSection(section) {
    switch (section.type) {
      case 'text':
        return `<div class="lesson-text" style="font-size: var(--text-lg); line-height: 1.8; margin-bottom: var(--space-lg);">${section.content}</div>`;

      case 'math':
        return `<div class="math">${section.content}</div>`;

      case 'code-block':
        return `<pre class="code-block">${this._highlightCode(section.content, section.language || 'python')}</pre>`;

      case 'callout':
        return `<div class="callout callout-${section.kind || 'tip'}">${section.content}</div>`;

      case 'quiz-check':
        return `
          <div class="callout callout-info" style="margin-bottom: var(--space-md);">
            <strong>💡 Quick Check</strong>
          </div>
          <div class="inline-quiz" data-correct="${section.correctIndex}">
            <p style="font-weight: 700; margin-bottom: var(--space-md);">${section.question}</p>
            <div style="display: grid; gap: var(--space-sm);">
              ${section.options.map((opt, i) => `
                <button class="quiz-option" onclick="LessonViewer._checkAnswer(this, ${i}, ${section.correctIndex})">
                  <span class="option-letter">${'ABCD'[i]}</span> ${opt}
                </button>
              `).join('')}
            </div>
            <div class="quiz-explain" style="display: none;">${section.explanation || ''}</div>
          </div>
        `;

      case 'code-challenge':
        return `
          <div class="callout callout-tip" style="margin-bottom: var(--space-md);">
            <strong>✏️ Try it yourself!</strong>
          </div>
          <p style="margin-bottom: var(--space-sm);">${section.instructions || 'Complete the code:'}</p>
          <pre class="code-block">${this._highlightCode(section.starterCode || '', 'python')}</pre>
          <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md);">
            <input class="challenge-input" id="challenge-input-${section.id || '0'}" placeholder="Type your code here..." style="flex: 1;">
            <button class="btn btn-success" onclick="LessonViewer._checkCode('${section.id || '0'}', '${section.correctAnswer || ''}')">Check</button>
          </div>
          <div id="challenge-result-${section.id || '0'}" style="margin-top: var(--space-sm);"></div>
        `;

      default:
        return `<div style="margin-bottom: var(--space-lg);">${section.content || ''}</div>`;
    }
  },

  _highlightCode(code, language) {
    if (!code) return '';
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (language === 'python') {
      return escaped
        .replace(/\b(def|class|return|if|else|elif|for|while|import|from|as|try|except|finally|with|yield|lambda|pass|break|continue|and|or|not|in|is|True|False|None|print|range|len|int|str|float|list|dict|set|tuple)\b/g, '<span class="keyword">$1</span>')
        .replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
        .replace(/(#.*)$/gm, '<span class="comment">$1</span>');
    }
    return escaped;
  },

  _checkAnswer(btn, selected, correct) {
    const parent = btn.closest('.inline-quiz');
    const options = parent.querySelectorAll('.quiz-option');
    const explain = parent.querySelector('.quiz-explain');

    options.forEach(o => o.classList.add('disabled'));
    btn.classList.add(selected === correct ? 'correct' : 'incorrect');

    if (selected !== correct) {
      options[correct].classList.add('correct');
    }

    explain.style.display = 'block';
    AudioManager.play(selected === correct ? 'correct' : 'incorrect');
  },

  _checkCode(id, correctAnswer) {
    const input = document.getElementById(`challenge-input-${id}`);
    const result = document.getElementById(`challenge-result-${id}`);
    if (!input || !result) return;

    const answer = input.value.trim().toLowerCase();
    const acceptable = correctAnswer.toLowerCase().split('|').map(a => a.trim());

    if (acceptable.includes(answer)) {
      result.innerHTML = `<div style="padding: var(--space-sm); background: var(--color-success-light); border-radius: var(--radius-md); color: var(--color-success-dark); font-weight: 600;">✅ Correct! Great job!</div>`;
      AudioManager.play('correct');
      GameState.addCredits(3);
      GameState.addXp(10);
    } else {
      result.innerHTML = `<div style="padding: var(--space-sm); background: var(--color-error-light); border-radius: var(--radius-md); color: var(--color-error-dark); font-weight: 600;">❌ Not quite. Hint: ${correctAnswer}</div>`;
      AudioManager.play('incorrect');
    }
  },

  _completeLesson(subject, lessonId) {
    const completed = GameState.completeLesson(subject, lessonId);
    if (completed) {
      Toast.show(`🎉 Lesson complete! +10 credits, +50 XP`, 'success');
      AchievementEngine.check();
    }
    // Re-render to show completed state
    Router.navigate(`/lessons/${subject}/${lessonId}`);
  },

  _navigate(subject, lessonId) {
    Router.navigate(`/lessons/${subject}/${lessonId}`);
  }
};
