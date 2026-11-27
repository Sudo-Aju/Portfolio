/* Adds the carton grain as an extra background layer on elements with a solid background. */
(function () {
  var src = document.currentScript && document.currentScript.src;
  var GRAIN = 'url("' + (src ? new URL('../img/grain.png', src).href : 'assets/img/grain.png') + '")';
  var SKIP = /^(HTML|IMG|VIDEO|CANVAS|IFRAME|PICTURE|SOURCE|SCRIPT|STYLE|LINK|META|svg|path|g)$/;
  var done = new WeakSet();

  function eligible(el) {
    if (done.has(el) || SKIP.test(el.tagName) || el.closest('svg')) return false;
    if (el.classList.contains('grain') || el.classList.contains('hb-grain')) return false;
    var cs = getComputedStyle(el);
    if (cs.backgroundImage !== 'none') return false;
    return !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor);
  }

  function apply(els) {
    var targets = els.filter(eligible);
    targets.forEach(function (el) {
      el.style.backgroundImage = GRAIN;
      el.style.backgroundSize = '170px 170px';
      el.style.backgroundRepeat = 'repeat';
      done.add(el);
    });
  }

  function init() {
    apply(Array.from(document.querySelectorAll('body, body *')));
    var pending = [], scheduled = false;
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          pending.push(node);
          pending.push.apply(pending, node.querySelectorAll('*'));
        });
      });
      if (pending.length && !scheduled) {
        scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          var batch = pending;
          pending = [];
          apply(batch);
        });
      }
    }).observe(document.body, { subtree: true, childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
