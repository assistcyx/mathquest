const PartnerRenderer = {
  _config: null,
  _loaded: false,

  // Base face parts as SVG paths
  EYES: {
    normal: `<ellipse cx="0" cy="0" rx="6" ry="7" fill="%COLOR%"/><circle cx="3" cy="-2" r="2.5" fill="white"/>`,
    happy_closed: `<path d="M-7,0 Q0,-8 7,0" stroke="%COLOR%" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    determined: `<ellipse cx="0" cy="0" rx="5" ry="5" fill="%COLOR%"/><circle cx="2" cy="-1" r="2" fill="white"/><ellipse cx="-2" cy="-1" rx="1" ry="1.5" fill="white"/>`,
    star_eyes: `<polygon points="0,-8 2,-2 8,-2 3,1 5,7 0,3 -5,7 -3,1 -8,-2 -2,-2" fill="%COLOR%"/>`,
    teary: `<ellipse cx="0" cy="0" rx="6" ry="7" fill="%COLOR%"/><circle cx="3" cy="-2" r="2.5" fill="white"/><path d="M-3,6 Q-5,10 -3,13" stroke="#60A5FA" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6"/>`,
    looking_up: `<ellipse cx="0" cy="-2" rx="6" ry="6" fill="%COLOR%"/><circle cx="2" cy="-4" r="2" fill="white"/>`
  },

  MOUTHS: {
    smile: `<path d="M-5,0 Q0,5 5,0" stroke="%COLOR%" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    big_smile: `<path d="M-7,0 Q0,8 7,0" stroke="%COLOR%" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    warm_smile: `<path d="M-4,0 Q0,4 4,0" stroke="%COLOR%" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    open_happy: `<ellipse cx="0" cy="0" rx="4" ry="5" fill="#FF6B8A"/>`,
    frown: `<path d="M-4,0 Q0,-4 4,0" stroke="%COLOR%" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    tiny_o: `<circle cx="0" cy="0" r="3" fill="%COLOR%" opacity="0.7"/>`
  },

  MOOD_ANIMATIONS: {
    idle: 'partner-idle-float 3s ease-in-out infinite',
    happy: 'partner-bounce 0.6s ease-in-out 3',
    encouraging: 'partner-gentle-sway 2s ease-in-out infinite',
    celebrating: 'partner-jump-spin 0.8s ease-in-out 3',
    sad: 'partner-droop 2s ease-in-out infinite',
    thinking: 'partner-tilt 1.5s ease-in-out infinite'
  },

  async load() {
    try {
      const res = await fetch('data/partner-config.json');
      this._config = await res.json();
      this._loaded = true;
    } catch (e) {
      console.warn('Failed to load partner config');
      this._config = this._getDefaultConfig();
    }
  },

  _getDefaultConfig() {
    return {
      base: {
        skinColor: '#FFE0D0',
        eyeColor: '#4A90D9',
        hairColor: '#FF9EC4',
        height: 200,
        width: 150
      },
      slots: {
        outfit: { default: 'default', options: ['default'] },
        accessory: { default: 'none', options: ['none'] },
        background: { default: 'classroom', options: ['classroom'] }
      },
      moods: {
        idle: { eyes: 'normal', mouth: 'smile' },
        happy: { eyes: 'happy_closed', mouth: 'big_smile', animation: 'bounce' },
        encouraging: { eyes: 'determined', mouth: 'warm_smile', animation: 'gentle_sway' },
        celebrating: { eyes: 'star_eyes', mouth: 'open_happy', animation: 'jump_spin' },
        sad: { eyes: 'teary', mouth: 'frown', animation: 'droop' },
        thinking: { eyes: 'looking_up', mouth: 'tiny_o', animation: 'tilt' }
      }
    };
  },

  render(options = {}) {
    const config = this._config || this._getDefaultConfig();
    const mood = options.mood || GameState.get('partner.currentMood') || 'idle';
    const outfit = options.outfit || GameState.get('partner.outfit') || 'default';
    const accessory = options.accessory || GameState.get('partner.accessory') || 'none';
    const background = options.background || GameState.get('partner.background') || 'classroom';
    const size = options.size || 'normal';

    const moodConfig = config.moods[mood] || config.moods.idle;
    const skinColor = options.skinColor || config.base.skinColor || '#FFE0D0';
    const eyeColor = options.eyeColor || config.base.eyeColor || '#4A90D9';
    const hairColor = options.hairColor || config.base.hairColor || '#FF9EC4';
    const mouthColor = '#CC6B8A';

    const dimensions = size === 'mini' ? { w: 50, h: 60 } : size === 'landing' ? { w: 200, h: 260 } : { w: 200, h: 260 };
    if (size === 'normal') { dimensions.w = 200; dimensions.h = 260; }

    const eyes = this.EYES[moodConfig.eyes] || this.EYES.normal;
    const mouth = this.MOUTHS[moodConfig.mouth] || this.MOUTHS.smile;
    const animation = this.MOOD_ANIMATIONS[mood] || '';

    const leftEye = eyes.replace(/%COLOR%/g, eyeColor);
    const rightEye = eyes.replace(/%COLOR%/g, eyeColor);
    const mouthRendered = mouth.replace(/%COLOR%/g, mouthColor);

    const bgColors = {
      classroom: { color: '#FFF5F9', pattern: 'none' },
      starry: { color: '#1a1a3e', pattern: 'stars' },
      beach: { color: '#E0F7FA', pattern: 'none' },
      library: { color: '#F3E5F5', pattern: 'none' },
      magical: { color: 'linear-gradient(135deg, #667eea, #764ba2)', pattern: 'sparkles' },
      garden: { color: '#E8F5E9', pattern: 'none' }
    };
    const bg = bgColors[background] || bgColors.classroom;

    const outfitColors = {
      default: { body: '#FFB5C2', trim: '#FF9EAA' },
      casual: { body: '#FFB5D2', trim: '#FF6B9D' },
      magical: { body: '#C084FC', trim: '#FF69B4' },
      sporty: { body: '#60A5FA', trim: '#34D399' },
      formal: { body: '#8B5CF6', trim: '#FBBF24' },
      cozy: { body: '#F97316', trim: '#FDE68A' }
    };
    const outfitCol = outfitColors[outfit] || outfitColors.default;

    return `
      <svg viewBox="0 0 ${dimensions.w} ${dimensions.h}" xmlns="http://www.w3.org/2000/svg" style="${animation ? 'animation: ' + animation : ''}">
        <defs>
          <clipPath id="partnerClip">
            <rect x="0" y="0" width="${dimensions.w}" height="${dimensions.h}" rx="16"/>
          </clipPath>
        </defs>
        <g clip-path="url(#partnerClip)">
          <!-- Background -->
          <rect x="0" y="0" width="${dimensions.w}" height="${dimensions.h}" fill="${bg.color}" rx="16"/>
          ${bg.pattern === 'stars' ? this._renderStars(dimensions.w, dimensions.h) : ''}
          ${bg.pattern === 'sparkles' ? this._renderSparkles(dimensions.w, dimensions.h) : ''}

          <!-- Body / Outfit -->
          <g transform="translate(${dimensions.w/2}, ${dimensions.h * 0.55})">
            <path d="M-30,10 Q-35,-10 -25,-20 L-20,-15 L20,-15 L25,-20 Q35,-10 30,10 Q35,45 30,50 L-30,50 Q-35,45 -30,10Z" fill="${outfitCol.body}" stroke="${outfitCol.trim}" stroke-width="1.5"/>
            ${outfit === 'magical' ? this._renderMagicalTrim() : ''}
            ${outfit === 'sporty' ? this._renderSportyTrim() : ''}
          </g>

          <!-- Arms -->
          <g transform="translate(${dimensions.w/2}, ${dimensions.h * 0.52})">
            <path d="M-30,5 Q-45,0 -48,15 Q-48,20 -42,18" stroke="${skinColor}" stroke-width="8" stroke-linecap="round" fill="none"/>
            <path d="M30,5 Q45,0 48,15 Q48,20 42,18" stroke="${skinColor}" stroke-width="8" stroke-linecap="round" fill="none"/>
          </g>

          <!-- Head -->
          <g transform="translate(${dimensions.w/2}, ${dimensions.h * 0.3})">
            <!-- Hair -->
            <ellipse cx="0" cy="-5" rx="38" ry="35" fill="${hairColor}"/>
            <path d="M-35,-5 Q-38,-25 -25,-35 Q-15,-40 0,-38 Q15,-40 25,-35 Q38,-25 35,-5" fill="${hairColor}"/>
            <!-- Side hair -->
            <path d="M-35,-5 Q-40,10 -38,25 Q-36,30 -32,28" fill="${hairColor}" stroke="${hairColor}" stroke-width="2"/>
            <path d="M35,-5 Q40,10 38,25 Q36,30 32,28" fill="${hairColor}" stroke="${hairColor}" stroke-width="2"/>

            <!-- Face -->
            <ellipse cx="0" cy="5" rx="30" ry="28" fill="${skinColor}"/>

            <!-- Blush -->
            <ellipse cx="-18" cy="12" rx="7" ry="4" fill="#FFB5C2" opacity="0.5"/>
            <ellipse cx="18" cy="12" rx="7" ry="4" fill="#FFB5C2" opacity="0.5"/>

            <!-- Eyes -->
            <g transform="translate(-12, 2)">${leftEye}</g>
            <g transform="translate(12, 2)">${rightEye}</g>

            <!-- Mouth -->
            <g transform="translate(0, 15)">${mouthRendered}</g>
          </g>

          <!-- Accessories -->
          ${accessory === 'cat_ears' ? this._renderCatEars(dimensions.w, dimensions.h, hairColor) : ''}
          ${accessory === 'bow' ? this._renderBow(dimensions.w, dimensions.h) : ''}
          ${accessory === 'glasses' ? this._renderGlasses(dimensions.w, dimensions.h) : ''}
          ${accessory === 'crown' ? this._renderCrown(dimensions.w, dimensions.h) : ''}
          ${accessory === 'ribbon' ? this._renderRibbon(dimensions.w, dimensions.h, hairColor) : ''}
          ${accessory === 'star_headband' ? this._renderStarHeadband(dimensions.w, dimensions.h) : ''}

          <!-- Sparkle effects for celebration -->
          ${mood === 'celebrating' ? this._renderCelebrationEffects(dimensions.w, dimensions.h) : ''}
        </g>
      </svg>
    `;
  },

  _renderCatEars(w, h, color) {
    return `
      <g transform="translate(${w/2}, ${h * 0.12})">
        <polygon points="-25,-18 -18,-38 -8,-18" fill="${color}" stroke="#E88EAC" stroke-width="1"/>
        <polygon points="-22,-22 -18,-33 -12,-22" fill="#FFB5C2" opacity="0.6"/>
        <polygon points="8,-18 18,-38 25,-18" fill="${color}" stroke="#E88EAC" stroke-width="1"/>
        <polygon points="12,-22 18,-33 22,-22" fill="#FFB5C2" opacity="0.6"/>
      </g>
    `;
  },

  _renderBow(w, h) {
    return `
      <g transform="translate(${w/2 + 5}, ${h * 0.18})">
        <path d="M0,0 Q-15,-12 -20,-5 Q-15,2 0,0Z" fill="#FF6B9D"/>
        <path d="M0,0 Q15,-12 20,-5 Q15,2 0,0Z" fill="#FF6B9D"/>
        <path d="M0,0 Q-10,8 -8,12 Q-4,10 0,0Z" fill="#E55A8A"/>
        <path d="M0,0 Q10,8 8,12 Q4,10 0,0Z" fill="#E55A8A"/>
        <circle cx="0" cy="0" r="3" fill="#FFB5D2"/>
      </g>
    `;
  },

  _renderGlasses(w, h) {
    return `
      <g transform="translate(${w/2}, ${h * 0.3})">
        <ellipse cx="-14" cy="4" rx="12" ry="9" fill="none" stroke="#60A5FA" stroke-width="2"/>
        <ellipse cx="14" cy="4" rx="12" ry="9" fill="none" stroke="#60A5FA" stroke-width="2"/>
        <line x1="-2" y1="4" x2="2" y2="4" stroke="#60A5FA" stroke-width="2"/>
        <line x1="-26" y1="4" x2="-32" y2="0" stroke="#60A5FA" stroke-width="2"/>
        <line x1="26" y1="4" x2="32" y2="0" stroke="#60A5FA" stroke-width="2"/>
      </g>
    `;
  },

  _renderCrown(w, h) {
    return `
      <g transform="translate(${w/2}, ${h * 0.13})">
        <polygon points="-22,-8 -18,-28 -10,-15 0,-32 10,-15 18,-28 22,-8" fill="#FBBF24" stroke="#F59E0B" stroke-width="1"/>
        <circle cx="-18" cy="-28" r="2" fill="#EF4444"/>
        <circle cx="0" cy="-32" r="2.5" fill="#3B82F6"/>
        <circle cx="18" cy="-28" r="2" fill="#34D399"/>
        <rect x="-22" y="-8" width="44" height="6" rx="2" fill="#FBBF24"/>
      </g>
    `;
  },

  _renderRibbon(w, h, color) {
    return `
      <g transform="translate(${w/2}, ${h * 0.12})">
        <path d="M-5,-20 Q0,-30 5,-20 Q0,-15 -5,-20Z" fill="#FF69B4"/>
        <path d="M-3,-18 L-15,-10 L-8,-8Z" fill="#FF69B4"/>
        <path d="M3,-18 L15,-10 L8,-8Z" fill="#FF69B4"/>
      </g>
    `;
  },

  _renderStarHeadband(w, h) {
    return `
      <g transform="translate(${w/2}, ${h * 0.12})">
        <path d="M-30,-5 Q0,-15 30,-5" stroke="#C084FC" stroke-width="3" fill="none"/>
        <polygon points="-15,-18 -13,-12 -7,-12 -12,-8 -10,-2 -15,-6 -20,-2 -18,-8 -23,-12 -17,-12" fill="#FBBF24"/>
        <polygon points="15,-18 17,-12 23,-12 18,-8 20,-2 15,-6 10,-2 12,-8 7,-12 13,-12" fill="#FBBF24"/>
      </g>
    `;
  },

  _renderMagicalTrim() {
    return `
      <path d="M-25,-18 L0,-25 L25,-18" stroke="#FFD700" stroke-width="2" fill="none" opacity="0.8"/>
      <circle cx="-15" cy="-15" r="2" fill="#FFD700" opacity="0.6"/>
      <circle cx="0" cy="-20" r="2" fill="#FFD700" opacity="0.6"/>
      <circle cx="15" cy="-15" r="2" fill="#FFD700" opacity="0.6"/>
    `;
  },

  _renderSportyTrim() {
    return `
      <line x1="-20" y1="-10" x2="20" y2="-10" stroke="white" stroke-width="3" opacity="0.4"/>
      <line x1="-15" y1="-5" x2="15" y2="-5" stroke="white" stroke-width="2" opacity="0.3"/>
    `;
  },

  _renderStars(w, h) {
    let stars = '';
    const positions = [
      [20, 15], [w-25, 25], [35, h-30], [w-30, h-20],
      [w/2, 10], [15, h/2], [w-15, h/2], [w/3, h-15]
    ];
    positions.forEach(([x, y]) => {
      const size = 2 + Math.random() * 2;
      stars += `<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="${0.3 + Math.random() * 0.4}"/>`;
    });
    return stars;
  },

  _renderSparkles(w, h) {
    let sparkles = '';
    const positions = [
      [15, 20], [w-20, 15], [w/2, h-10], [10, h-15]
    ];
    positions.forEach(([x, y]) => {
      sparkles += `<polygon points="${x},${y-4} ${x+1},${y-1} ${x+4},${y} ${x+1},${y+1} ${x},${y+4} ${x-1},${y+1} ${x-4},${y} ${x-1},${y-1}" fill="#FFD700" opacity="0.7"/>`;
    });
    return sparkles;
  },

  _renderCelebrationEffects(w, h) {
    return `
      <g opacity="0.8">
        <text x="10" y="20" font-size="10" fill="#FBBF24">✦</text>
        <text x="${w-20}" y="30" font-size="8" fill="#FF6B9D">✦</text>
        <text x="${w/2 - 5}" y="${h-5}" font-size="10" fill="#C084FC">✦</text>
        <text x="20" y="${h-15}" font-size="7" fill="#60A5FA">✦</text>
        <text x="${w-30}" y="${h-10}" font-size="9" fill="#34D399">✦</text>
        <text x="${w/3}" y="15" font-size="6" fill="#FBBF24">✦</text>
        <text x="${w*0.7}" y="${h-8}" font-size="7" fill="#FF6B9D">✦</text>
      </g>
    `;
  },

  getSpeech(mood) {
    const messages = {
      idle: ["Ready to learn?", "Let's study together!", "*humming quietly*", "I wonder what we'll learn today..."],
      happy: ["You're doing amazing!", "I knew you could do it!", "Yay! ☆*:.｡.o(≧▽≦)o.｡.:*☆", "Great work!"],
      encouraging: ["Don't give up!", "Try again, you got this!", "Mistakes help us learn!", "I believe in you! 💪"],
      celebrating: ["AMAZING!! ☆*:.｡.o(≧▽≦)o.｡.:*☆", "PERFECT SCORE!", "You're a genius!", "UNBELIEVABLE! 🎉"],
      sad: ["I miss studying with you...", "Come back soon, okay?", "Let's learn together again..."],
      thinking: ["Hmm, let me think...", "Oh! I know this one!", "The answer is...!"]
    };
    const pool = messages[mood] || messages.idle;
    return pool[Math.floor(Math.random() * pool.length)];
  }
};
