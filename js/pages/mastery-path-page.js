const MasteryPathPage = {

  async render(container) {
    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      await PathEngine.load();
      var paths = PathEngine.getAllPaths();
      this._render(container, paths);
    } catch (e) {
      container.innerHTML = '<div class="empty-state">Failed to load mastery paths</div>';
    }
  },

  _render(container, paths) {
    // Check for next recommended
    var nextRec = PathEngine.getNextRecommended();

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>🎯 Mastery Path</h1>
          <p>Follow structured learning paths and track your progress through each subject</p>
        </div>

        <div class="mp-page">
          ${nextRec ? this._renderNextRecommended(nextRec) : this._renderAllComplete()}

          <div class="mp-paths">
            ${paths.map(function(p) { return MasteryPathPage._renderPath(p); }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  _renderNextRecommended(nextRec) {
    var gate = nextRec.gate;
    var pct = Math.round((gate.mastery || 0) * 100);
    var reqPct = Math.round((gate.requiredMastery || 0.5) * 100);
    var progressStyle = 'width: ' + Math.min(gate.progress * 100, 100) + '%';
    var progressColor = gate.mastery >= gate.requiredMastery ? 'var(--color-success)' : 'var(--color-secondary)';

    return '<div class="mp-next-card card">' +
      '<div style="display: flex; align-items: flex-start; gap: var(--space-md); flex-wrap: wrap;">' +
        '<div style="flex: 1; min-width: 200px;">' +
          '<div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-bottom: var(--space-xs);">📌 Next Recommended</div>' +
          '<h3 style="margin-bottom: var(--space-xs);">' + nextRec.path.icon + ' ' + gate.title + '</h3>' +
          '<div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-sm);">' +
            'Path: ' + nextRec.path.title +
          '</div>' +
          '<div style="font-size: var(--text-sm);">' +
            'Mastery: ' + pct + '% / ' + reqPct + '% needed' +
          '</div>' +
          '<div style="margin-top: var(--space-xs); background: var(--color-border); border-radius: var(--radius-full); height: 8px; width: 100%; max-width: 300px; overflow: hidden;">' +
            '<div style="height: 100%; border-radius: var(--radius-full); background: ' + progressColor + '; transition: width 0.5s ease; ' + progressStyle + '"></div>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; gap: var(--space-sm); flex-shrink: 0;">' +
          (gate.lessons && gate.lessons.length > 0
            ? '<button class="btn btn-primary" onclick="MasteryPathPage._goToLesson(\'' + gate.lessons[0].subject + '\', ' + gate.lessons[0].id + ')">📖 Go to Lesson</button>'
            : '') +
          '<button class="btn btn-ghost" onclick="MasteryPathPage._goToPath(\'' + nextRec.path.id + '\')">View Path</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  _renderAllComplete() {
    return '<div class="mp-next-card card" style="background: var(--color-success-light); border-color: var(--color-success);">' +
      '<div style="text-align: center;">' +
        '<div style="font-size: 2rem; margin-bottom: var(--space-sm);">🏆</div>' +
        '<h3>All gates completed!</h3>' +
        '<p style="font-size: var(--text-sm); color: var(--color-text-secondary);">You\'ve mastered everything in your learning paths. Great work!</p>' +
      '</div>' +
    '</div>';
  },

  _renderPath(path) {
    var gates = PathEngine.getPathProgress(path.id);
    if (!gates) return '';

    var completion = PathEngine.getPathCompletion(path.id);
    var gateCount = gates.length;
    var completedCount = gates.filter(function(g) { return g.isCompleted; }).length;

    return '<div class="mp-path-card card" id="mp-path-' + path.id + '">' +
      '<div class="mp-path-header">' +
        '<div>' +
          '<h3 style="margin-bottom: var(--space-xs);">' + (path.icon || '📚') + ' ' + path.title + '</h3>' +
          '<p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0;">' + (path.description || '') + '</p>' +
        '</div>' +
        '<div class="mp-path-stats">' +
          '<div class="mp-path-pct">' + completion + '%</div>' +
          '<div style="font-size: var(--text-xs); color: var(--color-text-muted);">' + completedCount + '/' + gateCount + ' gates</div>' +
        '</div>' +
      '</div>' +

      '<div class="mp-progress-bar">' +
        '<div class="mp-progress-fill" style="width: ' + completion + '%;"></div>' +
      '</div>' +

      '<div class="mp-gates">' +
        gates.map(function(g, i) { return MasteryPathPage._renderGate(g, i, gates.length); }).join('') +
      '</div>' +
    '</div>';
  },

  _renderGate(gate, index, total) {
    var pct = Math.round((gate.mastery || 0) * 100);
    var reqPct = Math.round((gate.requiredMastery || 0.5) * 100);
    var progressStyle = 'width: ' + Math.min(gate.progress * 100, 100) + '%';

    var statusIcon, statusClass, statusLabel;
    if (gate.isCompleted) {
      statusIcon = '✅';
      statusClass = 'completed';
      statusLabel = 'Completed';
    } else if (gate.isUnlocked) {
      statusIcon = '📖';
      statusClass = 'unlocked';
      statusLabel = 'In Progress';
    } else {
      statusIcon = '🔒';
      statusClass = 'locked';
      statusLabel = 'Locked';
    }

    var progressColor = gate.isCompleted ? 'var(--color-success)' :
      gate.isUnlocked ? 'var(--color-secondary)' : 'var(--color-border)';

    return '<div class="mp-gate mp-gate-' + statusClass + '">' +
      // Connector line
      (index < total - 1 ? '<div class="mp-gate-connector mp-connector-' + statusClass + '"></div>' : '') +

      '<div class="mp-gate-content">' +
        '<div class="mp-gate-header">' +
          '<div style="display: flex; align-items: center; gap: var(--space-sm);">' +
            '<span class="mp-gate-icon">' + statusIcon + '</span>' +
            '<span class="mp-gate-title">' + gate.title + '</span>' +
            '<span class="mp-gate-badge mp-badge-' + statusClass + '">' + statusLabel + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="mp-gate-details">' +
          '<div class="mp-gate-mastery">' +
            '<span>Mastery: ' + pct + '% / ' + reqPct + '%</span>' +
            '<div class="mp-gate-bar">' +
              '<div class="mp-gate-fill" style="width: ' + Math.min(gate.progress * 100, 100) + '%; background: ' + progressColor + ';"></div>' +
            '</div>' +
          '</div>' +

          (!gate.isUnlocked && gate.prerequisites.length > 0
            ? '<div class="mp-gate-prereqs" style="font-size: var(--text-xs); color: var(--color-text-muted);">🔒 Requires: ' + gate.prerequisites.join(', ') + '</div>'
            : '') +
        '</div>' +

        (gate.isUnlocked && gate.lessons && gate.lessons.length > 0
          ? '<div style="margin-top: var(--space-sm);">' +
              '<button class="btn btn-sm ' + (gate.isCompleted ? 'btn-ghost' : 'btn-primary') + '" onclick="MasteryPathPage._goToLesson(\'' + gate.lessons[0].subject + '\', ' + gate.lessons[0].id + ')">' +
                (gate.isCompleted ? '📖 Review' : '📖 Start Lesson') +
              '</button>' +
            '</div>'
          : '') +
      '</div>' +
    '</div>';
  },

  _goToLesson(subject, lessonId) {
    Router.navigate('/lessons/' + subject + '/' + lessonId);
  },

  _goToPath(pathId) {
    var el = document.getElementById('mp-path-' + pathId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
};
