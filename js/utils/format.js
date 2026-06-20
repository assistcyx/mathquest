const FormatUtils = {
  number(n) {
    return n.toLocaleString();
  },

  time(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  percentage(n, total) {
    if (total === 0) return '0%';
    return Math.round((n / total) * 100) + '%';
  },

  pluralize(n, singular, plural) {
    return n === 1 ? singular : (plural || singular + 's');
  },

  ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },

  shorten(n, decimals = 1) {
    if (n >= 1000000) return (n / 1000000).toFixed(decimals) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(decimals) + 'K';
    return n.toString();
  }
};
