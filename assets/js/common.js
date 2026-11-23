/* Shared helpers for the About folder (about.js): labels, fonts, transitions. */
window.Site = (function () {
  'use strict';

  var GOOGLE_FONTS = ['Anton', 'Archivo', 'Bebas Neue', 'DM Serif Display', 'IBM Plex Mono', 'Space Grotesk', 'Syne', 'Oswald', 'Playfair Display', 'Barlow Condensed', 'Unbounded', 'Caveat', 'Pacifico', 'Bricolage Grotesque', 'Libre Caslon Text', 'Special Elite'];
  var SYSTEM_FONTS = {
    'Helvetica': "'Helvetica Neue', Helvetica, Arial, sans-serif",
    'Georgia': "Georgia, 'Times New Roman', serif",
    'Courier New': "'Courier New', Courier, monospace",
    'Times New Roman': "'Times New Roman', Times, serif",
    'Verdana': 'Verdana, Geneva, sans-serif',
    'Trebuchet MS': "'Trebuchet MS', sans-serif",
    'Impact': 'Impact, Charcoal, sans-serif',
  };
  var SERIF_GF = { 'DM Serif Display': 1, 'Playfair Display': 1, 'Libre Caslon Text': 1 };
  var MONO_GF = { 'IBM Plex Mono': 1 };

  var LABELS = {
    'divider.close': 'Close',
    'about.tab.desc': 'About me',
    'about.tab.cv': 'CV / Experience',
    'about.tab.hobbies': 'Hobbies',
    'about.tab.content': 'Content creation',
    'about.how.a': 'How I',
    'about.how.b': 'to work',
    'about.followers': 'followers',
    'about.collab': 'Collab',
    'about.videos': 'Videos',
    'about.photos': 'Photos',
    'about.nophoto': 'NO PHOTO ON FILE',
    'about.empty': 'Nothing filed here yet…',
    'about.tablist': 'About me file',
  };

  function t(key) {
    return LABELS[key] || key;
  }

  // Text field with optional English twin (key + "_en").
  function tr(obj, key) {
    if (!obj) return '';
    var en = obj[key + '_en'];
    if (typeof en === 'string' && en.trim()) return en;
    return obj[key] || '';
  }

  function applyLang() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    var labels = document.querySelectorAll('[data-i18n-label]');
    for (var k = 0; k < labels.length; k++) {
      var label = t(labels[k].getAttribute('data-i18n-label'));
      labels[k].title = label;
      labels[k].setAttribute('aria-label', label);
    }
  }

  /* ---------- Fonts ---------- */
  function customFonts(content) {
    return (content && content.fonts && content.fonts.custom) || [];
  }
  function findCustom(content, name) {
    var list = customFonts(content);
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }
  function fontStack(name) {
    if (!name) return SYSTEM_FONTS['Helvetica'];
    if (SYSTEM_FONTS[name]) return SYSTEM_FONTS[name];
    var generic = SERIF_GF[name] ? 'serif' : MONO_GF[name] ? 'monospace' : 'sans-serif';
    return "'" + name.replace(/'/g, '') + "', " + generic;
  }
  var loadedGoogle = {};
  var loadedFace = {};
  function ensureFonts(names, content) {
    var google = [];
    var faces = [];
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      if (!n || SYSTEM_FONTS[n]) continue;
      var custom = findCustom(content, n);
      if (custom && custom.kind === 'file' && custom.url) {
        if (!loadedFace[n]) { loadedFace[n] = 1; faces.push(custom); }
      } else if (!loadedGoogle[n]) {
        loadedGoogle[n] = 1;
        google.push(n);
      }
    }
    if (google.length) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?' +
        google.map(function (g) { return 'family=' + encodeURIComponent(g).replace(/%20/g, '+'); }).join('&') +
        '&display=swap';
      document.head.appendChild(link);
    }
    if (faces.length) {
      var css = '';
      for (var j = 0; j < faces.length; j++) {
        css += "@font-face{font-family:'" + faces[j].name.replace(/'/g, '') + "';src:url('" +
          faces[j].url.replace(/'/g, '') + "');font-display:swap;}";
      }
      var st = document.createElement('style');
      st.textContent = css;
      document.head.appendChild(st);
    }
  }

  // Waits for a CSS transition to end, with a timeout fallback.
  function afterTransition(el, prop, cb, fallbackMs) {
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      el.removeEventListener('transitionend', onEnd);
      clearTimeout(timer);
      cb();
    }
    function onEnd(e) {
      if (e.target === el && e.propertyName === prop) finish();
    }
    el.addEventListener('transitionend', onEnd);
    var timer = setTimeout(finish, fallbackMs);
    return finish;
  }

  return {
    GOOGLE_FONTS: GOOGLE_FONTS,
    SYSTEM_FONTS: SYSTEM_FONTS,
    t: t,
    tr: tr,
    applyLang: applyLang,
    fontStack: fontStack,
    ensureFonts: ensureFonts,
    customFonts: customFonts,
    afterTransition: afterTransition,
  };
})();
