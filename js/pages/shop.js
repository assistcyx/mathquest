const ShopPage = {
  _items: [],
  _activeCategory: 'outfit',

  async render(container) {
    container.innerHTML = `<div class="loading-spinner"></div>`;

    try {
      const res = await fetch('data/shop-items.json');
      this._items = await res.json();
    } catch (e) {
      this._items = this._getDefaultItems();
    }

    this._render(container);
  },

  _getDefaultItems() {
    return [
      { id: 'outfit_casual', type: 'outfit', name: 'Casual Hoodie', description: 'A comfy pink hoodie', price: 50, previewColor: '#FFB5C2', rarity: 'common' },
      { id: 'outfit_magical', type: 'outfit', name: 'Magical Girl Outfit', description: 'Sparkle with confidence!', price: 200, previewColor: '#FF69B4', rarity: 'epic' },
      { id: 'outfit_sporty', type: 'outfit', name: 'Sporty Look', description: 'Ready for action!', price: 100, previewColor: '#60A5FA', rarity: 'rare' },
      { id: 'outfit_formal', type: 'outfit', name: 'Formal Wear', description: 'Smart and sophisticated', price: 150, previewColor: '#8B5CF6', rarity: 'rare' },
      { id: 'outfit_cozy', type: 'outfit', name: 'Cozy Sweater', description: 'Warm and comfy', price: 80, previewColor: '#F97316', rarity: 'common' },
      { id: 'acc_cat_ears', type: 'accessory', name: 'Cat Ears', description: 'Nyaa~', price: 30, previewColor: '#FF9EAA', rarity: 'common' },
      { id: 'acc_bow', type: 'accessory', name: 'Cute Bow', description: 'Adds extra cuteness', price: 40, previewColor: '#FF6B9D', rarity: 'common' },
      { id: 'acc_glasses', type: 'accessory', name: 'Smart Glasses', description: 'Look studious!', price: 60, previewColor: '#60A5FA', rarity: 'common' },
      { id: 'acc_crown', type: 'accessory', name: 'Little Crown', description: 'You\'re royalty!', price: 120, previewColor: '#FBBF24', rarity: 'epic' },
      { id: 'acc_ribbon', type: 'accessory', name: 'Hair Ribbon', description: 'A sweet accessory', price: 25, previewColor: '#FF69B4', rarity: 'common' },
      { id: 'acc_star_headband', type: 'accessory', name: 'Star Headband', description: 'Reach for the stars!', price: 55, previewColor: '#C084FC', rarity: 'rare' },
      { id: 'bg_starry', type: 'background', name: 'Starry Night', description: 'A beautiful starry sky', price: 75, previewColor: '#1a1a3e', rarity: 'rare' },
      { id: 'bg_beach', type: 'background', name: 'Sunny Beach', description: 'Relax by the shore', price: 100, previewColor: '#E0F7FA', rarity: 'rare' },
      { id: 'bg_library', type: 'background', name: 'Cozy Library', description: 'Perfect for studying', price: 60, previewColor: '#F3E5F5', rarity: 'common' },
      { id: 'bg_magical', type: 'background', name: 'Magical Realm', description: 'A world of wonder', price: 180, previewColor: '#667eea', rarity: 'epic' },
      { id: 'bg_garden', type: 'background', name: 'Flower Garden', description: 'Bloom with knowledge', price: 90, previewColor: '#E8F5E9', rarity: 'common' }
    ];
  },

  _render(container) {
    const credits = GameState.get('player.credits') || 0;
    const filtered = this._items.filter(i => i.type === this._activeCategory);

    const categoryMap = { outfit: '👗 Outfits', accessory: '🎀 Accessories', background: '🎨 Backgrounds' };

    container.innerHTML = `
      <div class="page animate-fade-in">
        <div class="page-header">
          <h1>🛍️ Shop</h1>
          <p>Spend credits to customize your learning partner!</p>
        </div>

        <div class="shop-header">
          <div class="shop-tabs">
            ${Object.entries(categoryMap).map(([key, label]) => `
              <button class="shop-tab ${this._activeCategory === key ? 'active' : ''}" onclick="ShopPage._switchCategory('${key}')">${label}</button>
            `).join('')}
          </div>
          <div class="shop-balance">
            <span class="coin-icon">🪙</span>
            <span>${credits}</span>
          </div>
        </div>

        <!-- Featured item -->
        ${this._activeCategory === 'outfit' ? `
          <div class="shop-featured">
            <div style="font-size: 2rem;">✨</div>
            <div class="shop-featured-info">
              <span class="shop-featured-badge">Featured</span>
              <h3>Magical Girl Outfit</h3>
              <p>The most popular outfit! Transform your partner into a magical being!</p>
            </div>
            <button class="btn btn-primary" onclick="ShopPage._quickBuy('outfit_magical', 200)">🛒 200</button>
          </div>
        ` : ''}

        <div class="shop-items stagger">
          ${filtered.map(item => this._itemCard(item)).join('')}
        </div>
      </div>
    `;
  },

  _switchCategory(category) {
    this._activeCategory = category;
    this._render(document.getElementById('app'));
  },

  _itemCard(item) {
    const owned = item.price === 0 || GameState.hasItem(item.id);
    const equipped = this._isEquipped(item);
    const credits = GameState.get('player.credits') || 0;
    const canAfford = credits >= item.price;

    const previewEmojis = {
      outfit_casual: '🧥', outfit_magical: '✨', outfit_sporty: '🏃', outfit_formal: '👔', outfit_cozy: '🧶',
      acc_cat_ears: '🐱', acc_bow: '🎀', acc_glasses: '👓', acc_crown: '👑', acc_ribbon: '🎗️', acc_star_headband: '⭐',
      bg_starry: '🌌', bg_beach: '🏖️', bg_library: '📚', bg_magical: '🔮', bg_garden: '🌸'
    };

    return `
      <div class="shop-item ${owned ? (equipped ? 'equipped' : 'owned') : ''}">
        <span class="shop-item-rarity rarity-${item.rarity || 'common'}">${item.rarity || 'common'}</span>
        ${owned ? '<span class="shop-item-badge badge badge-green">✓ Owned</span>' : ''}
        ${equipped ? '<span class="shop-item-badge badge badge-pink">✨ Equipped</span>' : ''}
        <div class="shop-item-preview">${previewEmojis[item.id] || '❓'}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.description}</div>
        ${!owned ? `<div class="shop-item-price">🪙 ${item.price}</div>` : ''}
        ${owned && !equipped ? `<button class="btn btn-sm btn-secondary" onclick="ShopPage._equip('${item.type}', '${item.id}')">Equip</button>` : ''}
        ${!owned ? `<button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-ghost'}" ${canAfford ? `onclick="ShopPage._buy('${item.id}', ${item.price}, '${item.type}')"` : 'disabled'}>
          ${canAfford ? '🛒 Buy' : `Need ${item.price - credits} more`}
        </button>` : ''}
      </div>
    `;
  },

  _isEquipped(item) {
    const typeMap = {
      outfit: 'partner.outfit',
      accessory: 'partner.accessory',
      background: 'partner.background'
    };
    const path = typeMap[item.type];
    if (!path) return false;
    return GameState.get(path) === item.id;
  },

  _buy(itemId, price, type) {
    Modal.confirm({
      title: '🛍️ Confirm Purchase',
      message: `Buy this item for 🪙 ${price} credits?`,
      confirmText: '🛒 Buy Now',
      onConfirm: () => {
        const success = GameState.purchaseItem(itemId, price);
        if (success) {
          // Auto-equip if it's the first of its type
          const typeMap = { outfit: 'partner.outfit', accessory: 'partner.accessory', background: 'partner.background' };
          const path = typeMap[type];
          if (path && !GameState.get(path)) {
            GameState.set(path, itemId);
          }
          Toast.show(`🎉 ${itemId} purchased!`, 'success');
          ShopPage._render(document.getElementById('app'));
        } else {
          Toast.show('Purchase failed.', 'error');
        }
      }
    });
  },

  _quickBuy(itemId, price) {
    this._buy(itemId, price, 'outfit');
  },

  _equip(type, itemId) {
    GameState.set(`partner.${type}`, itemId);
    Toast.show(`✨ Equipped!`, 'success');
    ShopPage._render(document.getElementById('app'));
  }
};
