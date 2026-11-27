/* Adds the carton grain as an extra background layer on every element that has a background. */
(function () {
  var src = document.currentScript && document.currentScript.src;
  var URL_ = 'url("' + (src ? new URL('../img/grain.png', src).href : 'assets/img/grain.png') + '")';
  var SKIP = /^(HTML|IMG|VIDEO|CANVAS|IFRAME|PICTURE|SOURCE|SCRIPT|STYLE|LINK|META|svg|path|g)$/;
  var PROPS = {
    backgroundImage: URL_,
    backgroundSize: '170px 170px',
    backgroundRepeat: 'repeat',
    backgroundPosition: '0px 0px',
    backgroundBlendMode: 'normal',
    backgroundOrigin: 'border-box',
    backgroundClip: 'border-box',
    backgroundAttachment: 'scroll'
  };
  var KEYS = Object.keys(PROPS);
  var applied = new WeakMap();

  function split(s) {
    var out = [], depth = 0, last = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === ',' && !depth) { out.push(s.slice(last, i).trim()); last = i + 1; }
    }
    out.push(s.slice(last).trim());
    return out;
  }

  function expand(list, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(list[i % list.length]);
    return out;
  }

  function restore(el) {
    var rec = applied.get(el);
    if (!rec) return;
    KEYS.forEach(function (k) { if (el.style[k] === rec.set[k]) el.style[k] = rec.orig[k]; });
    applied.delete(el);
  }

  function plan(el) {
    if (SKIP.test(el.tagName) || el.closest('svg') || el.classList.contains('grain') || el.classList.contains('hb-grain')) return null;
    var cs = getComputedStyle(el);
    var img = cs.backgroundImage;
    var hasColor = !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor);
    var hasImg = img && img !== 'none';
    if (!hasColor && !hasImg) return null;
    if (hasImg && (/url\(/.test(img) || /text/.test(cs.backgroundClip))) return null;
    var vals = {};
    if (!hasImg) {
      KEYS.forEach(function (k) { vals[k] = PROPS[k]; });
    } else {
      var n = split(img).length;
      KEYS.forEach(function (k) {
        vals[k] = PROPS[k] + ', ' + (k === 'backgroundImage' ? img : expand(split(cs[k]), n).join(', '));
      });
    }
    return vals;
  }

  function write(el, vals) {
    var rec = { orig: {}, set: {} };
    KEYS.forEach(function (k) {
      rec.orig[k] = el.style[k];
      el.style[k] = vals[k];
      rec.set[k] = el.style[k];
    });
    applied.set(el, rec);
  }

  function run(els) {
    els.forEach(restore);
    var plans = els.map(plan);
    els.forEach(function (el, i) { if (plans[i]) write(el, plans[i]); });
  }

  var queue = new Set(), scheduled = false;
  function enqueue(el) {
    if (el.nodeType !== 1) return;
    queue.add(el);
    if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
  }
  function flush() {
    scheduled = false;
    var els = Array.from(queue);
    queue.clear();
    run(els);
  }

  function chain(el) {
    for (; el && el.nodeType === 1; el = el.parentElement) enqueue(el);
  }

  function init() {
    run(Array.from(document.querySelectorAll('body, body *')));
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'attributes') return enqueue(m.target);
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          enqueue(node);
          node.querySelectorAll('*').forEach(enqueue);
        });
      });
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    ['pointerover', 'pointerout', 'focusin', 'focusout'].forEach(function (t) {
      document.addEventListener(t, function (e) { chain(e.target); }, { passive: true });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
