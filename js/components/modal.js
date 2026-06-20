const Modal = {
  show(options) {
    const { title = '', body = '', actions = [], onClose } = options;
    const container = DomUtils.byId('modal-container');
    container.innerHTML = '';

    const overlay = DomUtils.el('div', { className: 'modal-overlay' });
    const modal = DomUtils.el('div', { className: 'modal animate-bounce-in' });

    if (title) {
      modal.appendChild(DomUtils.el('h2', { className: 'modal-title' }, title));
    }

    if (body) {
      modal.appendChild(DomUtils.el('div', { className: 'modal-body' }, body));
    }

    const closeBtn = DomUtils.el('button', {
      className: 'modal-close',
      innerHTML: '✕',
      onclick: () => this.close()
    });
    modal.appendChild(closeBtn);

    if (actions.length > 0) {
      const actionsDiv = DomUtils.el('div', { className: 'modal-actions' });
      actions.forEach(action => {
        const btn = DomUtils.el('button', {
          className: `btn ${action.variant || 'btn-primary'} ${action.size || ''}`,
          innerHTML: action.text,
          onclick: () => {
            if (action.callback) action.callback();
            if (action.close !== false) this.close();
          }
        });
        actionsDiv.appendChild(btn);
      });
      modal.appendChild(actionsDiv);
    }

    overlay.appendChild(modal);
    container.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (onClose) onClose();
        this.close();
      }
    });

    // Focus trap
    modal.querySelector('button')?.focus();
  },

  close() {
    const container = DomUtils.byId('modal-container');
    container.innerHTML = '';
  },

  confirm(options) {
    const { title, message, confirmText = 'Yes', cancelText = 'No', onConfirm, variant = 'btn-primary' } = options;
    this.show({
      title,
      body: message,
      actions: [
        { text: cancelText, variant: 'btn-ghost', callback: () => {} },
        { text: confirmText, variant, callback: onConfirm }
      ]
    });
  }
};
