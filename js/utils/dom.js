/* DOM Helper Utilities */
const DomUtils = {
  el(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.assign(element.dataset, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    if (typeof children === 'string') {
      element.innerHTML = children;
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          element.appendChild(child);
        }
      });
    }
    return element;
  },

  byId(id) {
    return document.getElementById(id);
  },

  qs(sel, parent = document) {
    return parent.querySelector(sel);
  },

  qsa(sel, parent = document) {
    return [...parent.querySelectorAll(sel)];
  },

  clear(el) {
    el.innerHTML = '';
    return el;
  },

  show(el) {
    el.style.display = '';
  },

  hide(el) {
    el.style.display = 'none';
  },

  remove(el) {
    el.remove();
  },

  toggleClass(el, cls, force) {
    el.classList.toggle(cls, force);
  },

  html(strings, ...values) {
    let result = '';
    strings.forEach((str, i) => {
      result += str + (values[i] !== undefined ? values[i] : '');
    });
    return result;
  }
};
