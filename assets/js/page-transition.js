(function () {
  'use strict';

  var duration = 650;
  var pageDir = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
  var shutter = document.createElement('div');
  shutter.className = 'page-shutter';
  shutter.setAttribute('aria-hidden', 'true');
  document.documentElement.appendChild(shutter);

  var currentUrl;
  var openingAnimationEnd;
  try { currentUrl = new URL(location.href); } catch (e) {}
  if (currentUrl && currentUrl.searchParams.get('pageTransition') === '1') {
    currentUrl.searchParams.delete('pageTransition');
    try { history.replaceState(null, '', currentUrl.pathname + currentUrl.search + currentUrl.hash); } catch (e) {}
    shutter.classList.add('is-opening');
    openingAnimationEnd = function (event) {
      if (event.target !== shutter || event.animationName !== 'page-shutter-up') return;
      shutter.removeEventListener('animationend', openingAnimationEnd);
      shutter.classList.remove('is-opening');
      openingAnimationEnd = null;
    };
    shutter.addEventListener('animationend', openingAnimationEnd);
  }

  var navigating = false;
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

    var destination;
    try { destination = new URL(link.href, location.href); } catch (e) { return; }
    if (!/\.html?$/i.test(destination.pathname)) return;
    var samePage = destination.pathname === location.pathname;
    var activeContactNav = samePage && /\/contact\.html$/i.test(destination.pathname) && link.closest('.nav-pill');
    if (samePage && !activeContactNav) return;
    if (destination.pathname.slice(0, destination.pathname.lastIndexOf('/') + 1) !== pageDir) return;

    event.preventDefault();
    if (navigating) return;
    navigating = true;
    destination.searchParams.set('pageTransition', '1');

    var finished = false;
    function navigate() {
      if (finished) return;
      finished = true;
      location.assign(destination.href);
    }
    function onClosingAnimationEnd(animationEvent) {
      if (animationEvent.target !== shutter || animationEvent.animationName !== 'page-shutter-down') return;
      shutter.removeEventListener('animationend', onClosingAnimationEnd);
      navigate();
    }
    if (openingAnimationEnd) shutter.removeEventListener('animationend', openingAnimationEnd);
    shutter.removeEventListener('animationend', onClosingAnimationEnd);
    shutter.addEventListener('animationend', onClosingAnimationEnd);
    shutter.classList.remove('is-opening');
    void shutter.offsetHeight;
    shutter.classList.add('is-closing');
    window.setTimeout(navigate, duration + 180);
  }, true);
})();
