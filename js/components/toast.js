const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = DomUtils.byId('toast-container');
    const toast = DomUtils.el('div', {
      className: `toast toast-${type}`,
      innerHTML: message
    });
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
