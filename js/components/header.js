const Header = {
  render() {
    const credits = GameState.get('player.credits') || 0;
    const level = GameState.get('player.level') || 1;
    const partnerMood = GameState.get('partner.currentMood') || 'idle';
    const playerName = GameState.get('player.name') || '';

    const header = DomUtils.el('header', { className: 'header' });
    const inner = DomUtils.el('div', { className: 'header-inner' });

    // Logo
    const logo = DomUtils.el('a', {
      className: 'header-logo',
      href: '#/',
      innerHTML: `
        <svg viewBox="0 0 32 32" width="32" height="32">
          <circle cx="16" cy="16" r="15" fill="#FF6B9D"/>
          <text x="16" y="22" text-anchor="middle" font-size="18" fill="white" font-family="Fredoka One">M</text>
        </svg>
        MathQuest
      `
    });
    inner.appendChild(logo);

    // Navigation
    const nav = DomUtils.el('nav', { className: 'header-nav' });
    const links = [
      { href: '#/lessons', text: '📚 Lessons' },
      { href: '#/games', text: '🎮 Games' },
      { href: '#/ai-tutor', text: '🤖 AI Tutor' },
      { href: '#/mastery-path', text: '🎯 Mastery' },
      { href: '#/knowledge-base', text: '📚 Knowledge' },
      { href: '#/memory', text: '🧠 Memory' },
      { href: '#/partner', text: '🌟 Partner' },
      { href: '#/shop', text: '🛍️ Shop' }
    ];
    links.forEach(link => {
      const a = DomUtils.el('a', { href: link.href, innerHTML: link.text });
      nav.appendChild(a);
    });
    inner.appendChild(nav);

    // Stats
    const stats = DomUtils.el('div', { className: 'header-stats' });

    const creditsStat = DomUtils.el('span', {
      className: 'header-stat',
      innerHTML: `<span class="icon">⭐</span> ${credits}`
    });
    stats.appendChild(creditsStat);

    const levelStat = DomUtils.el('span', {
      className: 'header-stat',
      innerHTML: `<span class="icon">📊</span> Lv.${level}`
    });
    stats.appendChild(levelStat);

    // Mini partner
    const partnerMini = DomUtils.el('div', {
      className: 'header-partner-mini',
      onclick: () => Router.navigate('/partner'),
      innerHTML: PartnerRenderer.render({ mood: partnerMood, size: 'mini' })
    });
    stats.appendChild(partnerMini);

    inner.appendChild(stats);

    // Hamburger
    const hamburger = DomUtils.el('div', {
      className: 'hamburger',
      onclick: function() {
        nav.classList.toggle('open');
      }
    });
    hamburger.appendChild(DomUtils.el('span'));
    hamburger.appendChild(DomUtils.el('span'));
    hamburger.appendChild(DomUtils.el('span'));
    inner.appendChild(hamburger);

    header.appendChild(inner);
    return header;
  },

  updateStats() {
    const header = document.querySelector('.header');
    if (header) {
      header.replaceWith(this.render());
    }
  }
};
