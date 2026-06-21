const PartnerPage = {
  _activeTab: 'appearance',

  render(container) {
    const mood = GameState.get('partner.currentMood') || 'idle';
    const affection = GameState.get('partner.affection') || 0;
    const outfit = GameState.get('partner.outfit') || 'default';
    const accessory = GameState.get('partner.accessory') || 'none';
    const background = GameState.get('partner.background') || 'classroom';

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>🌟 Learning Partner</h1>
          <p>Customize your companion and see your bond grow!</p>
        </div>

        <div class="partner-page">
          <!-- Partner Display -->
          <div class="partner-display-area">
            <div class="partner-canvas" id="partner-canvas">
              ${PartnerRenderer.render({ mood, outfit, accessory, background })}
            </div>

            <div class="partner-mood-badge">
              ${this._getMoodEmoji(mood)} ${mood.charAt(0).toUpperCase() + mood.slice(1)}
            </div>

            <div class="partner-speech" id="partner-speech">
              ${PartnerRenderer.getSpeech(mood)}
            </div>

            <div class="affection-meter">
              <div class="affection-label">
                <span>💕 Bond Level</span>
                <span>${Math.min(Math.floor(affection / 100), 10)}</span>
              </div>
              <div class="affection-bar">
                <div class="affection-fill" style="width: ${Math.min(affection % 100, 100)}%"></div>
              </div>
            </div>
          </div>

          <!-- Customization Panel -->
          <div class="partner-customize">
            <div class="partner-tabs">
              <button class="partner-tab ${this._activeTab === 'appearance' ? 'active' : ''}" onclick="PartnerPage._switchTab('appearance')">👗 Appearance</button>
              <button class="partner-tab ${this._activeTab === 'backgrounds' ? 'active' : ''}" onclick="PartnerPage._switchTab('backgrounds')">🎨 Backgrounds</button>
              <button class="partner-tab ${this._activeTab === 'about' ? 'active' : ''}" onclick="PartnerPage._switchTab('about')">ℹ️ About</button>
            </div>

            <div id="partner-tab-content">
              ${this._activeTab === 'appearance' ? this._renderAppearanceTab() :
                this._activeTab === 'backgrounds' ? this._renderBackgroundsTab() :
                this._renderAboutTab()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _getMoodEmoji(mood) {
    const emojis = { idle: '😊', happy: '😄', encouraging: '💪', celebrating: '🎉', sad: '😢', thinking: '🤔' };
    return emojis[mood] || '😊';
  },

  _switchTab(tab) {
    this._activeTab = tab;
    Router.navigate('/partner');
  },

  _renderAppearanceTab() {
    const outfits = [
      { id: 'default', name: 'Classic Pink', price: 0 },
      { id: 'casual', name: 'Casual Hoodie', price: 50 },
      { id: 'magical', name: 'Magical Girl', price: 200 },
      { id: 'sporty', name: 'Sporty Look', price: 100 },
      { id: 'formal', name: 'Formal Wear', price: 150 },
      { id: 'cozy', name: 'Cozy Sweater', price: 80 }
    ];

    const accessories = [
      { id: 'none', name: 'None', price: 0 },
      { id: 'cat_ears', name: 'Cat Ears', price: 30 },
      { id: 'bow', name: 'Cute Bow', price: 40 },
      { id: 'glasses', name: 'Smart Glasses', price: 60 },
      { id: 'crown', name: 'Little Crown', price: 120 },
      { id: 'ribbon', name: 'Hair Ribbon', price: 25 },
      { id: 'star_headband', name: 'Star Headband', price: 55 }
    ];

    const currentOutfit = GameState.get('partner.outfit') || 'default';
    const currentAccessory = GameState.get('partner.accessory') || 'none';

    return `
      <div class="partner-tab-content active">
        <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-md);">👗 Outfits</h3>
        <div class="item-grid">
          ${outfits.map(item => this._itemCard(item, 'outfit', currentOutfit)).join('')}
        </div>

        <h3 style="font-size: var(--text-lg); margin: var(--space-xl) 0 var(--space-md);">🎀 Accessories</h3>
        <div class="item-grid">
          ${accessories.map(item => this._itemCard(item, 'accessory', currentAccessory)).join('')}
        </div>
      </div>
    `;
  },

  _renderBackgroundsTab() {
    const backgrounds = [
      { id: 'classroom', name: 'Classroom', price: 0 },
      { id: 'starry', name: 'Starry Night', price: 75 },
      { id: 'beach', name: 'Sunny Beach', price: 100 },
      { id: 'library', name: 'Cozy Library', price: 60 },
      { id: 'magical', name: 'Magical Realm', price: 180 },
      { id: 'garden', name: 'Flower Garden', price: 90 }
    ];

    const currentBg = GameState.get('partner.background') || 'classroom';

    return `
      <div class="partner-tab-content active">
        <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-md);">🎨 Backgrounds</h3>
        <div class="item-grid">
          ${backgrounds.map(item => this._itemCard(item, 'background', currentBg)).join('')}
        </div>
      </div>
    `;
  },

  _renderAboutTab() {
    const name = GameState.get('player.name') || 'Adventurer';
    const level = GameState.get('player.level') || 1;
    const xp = GameState.get('player.xp') || 0;
    const credits = GameState.get('player.credits') || 0;
    const completedCalc = (GameState.get('progress.calculus.completed') || []).length;
    const completedPy = (GameState.get('progress.python.completed') || []).length;
    const completedAlg = (GameState.get('progress.algebra.completed') || []).length;
    const quizzesPlayed = GameState.get('gameStats.quizzesPlayed') || 0;
    const matchesCompleted = GameState.get('gameStats.matchesCompleted') || 0;
    const speedMathPlayed = GameState.get('gameStats.speedMathPlayed') || 0;
    const wpPlayed = GameState.get('gameStats.wordProblemsPlayed') || 0;
    const bossWon = GameState.get('gameStats.bossBattlesWon') || 0;
    const aiQuestions = GameState.get('_aiQuestionsAsked') || 0;
    const achievements = (GameState.get('achievements.unlocked') || []).length;
    const affection = GameState.get('partner.affection') || 0;
    const topMastery = typeof AdaptiveEngine !== 'undefined' ? AdaptiveEngine.getTopMasteryTopic() : null;

    return `
      <div class="partner-tab-content active">
        <div class="card" style="margin-bottom: var(--space-md);">
          <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-md);">📊 Your Stats</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div><strong>Name:</strong> ${name}</div>
            <div><strong>Level:</strong> ${level}</div>
            <div><strong>XP:</strong> ${xp}</div>
            <div><strong>Credits:</strong> ${credits}</div>
            <div><strong>Calc Lessons:</strong> ${completedCalc}</div>
            <div><strong>Python Lessons:</strong> ${completedPy}</div>
            <div><strong>Algebra Lessons:</strong> ${completedAlg}</div>
            <div><strong>Quizzes Played:</strong> ${quizzesPlayed}</div>
            <div><strong>Speed Math:</strong> ${speedMathPlayed}</div>
            <div><strong>Word Problems:</strong> ${wpPlayed}</div>
            <div><strong>Bosses Defeated:</strong> ${bossWon}</div>
            <div><strong>AI Questions:</strong> ${aiQuestions}</div>
            <div><strong>Achievements:</strong> ${achievements}</div>
            <div><strong>Bond Level:</strong> ${Math.floor(affection / 100)}</div>
            ${topMastery ? `<div><strong>Best Topic:</strong> ${topMastery.label} (${Math.round(topMastery.score * 100)}%)</div>` : ''}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Modal.confirm({
          title: '⚠️ Reset All Progress?',
          message: 'This will delete all your progress, credits, and items. This cannot be undone!',
          confirmText: '🔄 Reset',
          onConfirm: () => GameState.reset()
        })" style="color: var(--color-error);">Reset Progress</button>
      </div>
    `;
  },

  _itemCard(item, type, currentId) {
    const owned = item.price === 0 || GameState.hasItem(item.id);
    const isEquipped = currentId === item.id;
    const credits = GameState.get('player.credits') || 0;
    const canAfford = credits >= item.price;
    const previewEmojis = {
      default: '👚', casual: '🧥', magical: '✨', sporty: '🏃', formal: '👔', cozy: '🧶',
      none: '➖', cat_ears: '🐱', bow: '🎀', glasses: '👓', crown: '👑', ribbon: '🎗️', star_headband: '⭐',
      classroom: '🏫', starry: '🌌', beach: '🏖️', library: '📚', magical: '🔮', garden: '🌸'
    };

    const classes = [];
    if (isEquipped) classes.push('equipped');
    else if (owned) classes.push('owned');
    else if (!canAfford) classes.push('locked');

    return `
      <div class="item-card ${classes.join(' ')}" onclick="PartnerPage._handleItemClick('${type}', '${item.id}', ${item.price}, ${owned})">
        <div class="item-preview">${previewEmojis[item.id] || '❓'}</div>
        <div class="item-name">${item.name}</div>
        ${owned ? (isEquipped ? '<div style="font-size: var(--text-xs); color: var(--color-primary); font-weight: 700;">✨ Equipped</div>' : '<div style="font-size: var(--text-xs); color: var(--color-success); font-weight: 600;">Owned</div>') : `<div class="item-price">🪙 ${item.price}</div>`}
      </div>
    `;
  },

  _handleItemClick(type, itemId, price, owned) {
    if (owned) {
      GameState.set(`partner.${type}`, itemId);
      Toast.show(`✨ ${type} updated!`, 'success');
      Router.navigate('/partner');
      return;
    }

    const credits = GameState.get('player.credits') || 0;
    if (credits < price) {
      Toast.show(`Not enough credits! Need ${price - credits} more.`, 'error');
      return;
    }

    Modal.confirm({
      title: '🛍️ Buy this item?',
      message: `Cost: 🪙 ${price} credits`,
      confirmText: '🛒 Buy',
      onConfirm: () => {
        const success = GameState.purchaseItem(itemId, price);
        if (success) {
          GameState.set(`partner.${type}`, itemId);
          GameState.set('partner.currentMood', 'happy');
          Toast.show(`🎉 Purchased!`, 'success');
          Router.navigate('/partner');
        }
      }
    });
  }
};
