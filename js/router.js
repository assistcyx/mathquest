const Router = {
  routes: [],
  currentHandler: null,
  currentParams: null,

  init() {
    window.addEventListener('hashchange', () => this._handleRoute());
    this._handleRoute();
  },

  register(pattern, handler) {
    const parts = pattern.split('/').filter(Boolean);
    this.routes.push({ pattern, parts, handler });
  },

  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : '#' + path;
  },

  getCurrentPath() {
    return window.location.hash.slice(1) || '/';
  },

  _handleRoute() {
    const hash = this.getCurrentPath();
    const hashParts = hash.split('/').filter(Boolean);

    for (const route of this.routes) {
      if (route.pattern === hash) {
        this._execute(route.handler, {});
        return;
      }
    }

    // Try parameterized routes
    for (const route of this.routes) {
      if (route.parts.length !== hashParts.length) continue;
      const params = {};
      let match = true;

      for (let i = 0; i < route.parts.length; i++) {
        const rp = route.parts[i];
        const hp = hashParts[i];
        if (rp.startsWith(':')) {
          params[rp.slice(1)] = hp;
        } else if (rp !== hp) {
          match = false;
          break;
        }
      }

      if (match) {
        this._execute(route.handler, params);
        return;
      }
    }

    // Fallback to landing
    this._execute(this.routes.find(r => r.pattern === '/')?.handler, {});
  },

  _execute(handler, params) {
    this.currentHandler = handler;
    this.currentParams = params;
    if (handler) {
      const app = DomUtils.byId('app');
      handler(app, params);
      // Update active nav
      this._updateNav();
    }
  },

  _updateNav() {
    const path = this.getCurrentPath();
    document.querySelectorAll('.header-nav a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === '#' + path || (path.startsWith(href.slice(1)) && href !== '#')) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }
};
