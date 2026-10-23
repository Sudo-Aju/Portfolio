/* Page About me — la chemise kraft.
   Une pile de photos pincée à gauche, quatre fiches à onglets empilées à
   droite (la rouge porte le hub « créa de contenu » : handle, plateformes,
   vidéos, photos, collabs), un post-it en bas : tout est dessiné ici
   (createElement + textContent ; seuls les gabarits SVG statiques passent par
   innerHTML, jamais une valeur saisie). */
(function () {
  'use strict';

  // Les quatre fiches sont fixes : clés, ordre visuel des onglets, libellés i18n.
  var KEYS = ['desc', 'cv', 'hobbies', 'content'];
  // « 2024 — auj. — Poste · Client » ou « 2019 — Master » : ligne datée en deux colonnes.
  var DATED = /^(\d{4}(?:\s*[—–-]\s*(?:\d{4}|auj\.?|aujourd'hui|now))?)\s*[—–-]\s+(.+)$/i;
  // « - texte » ou « • texte » ; un tiret seul (puce laissée vide) est reconnu
  // aussi, pour être ignoré plutôt que rendu comme un paragraphe « - ».
  var BULLET = /^[-•](?:\s+|$)/;
  // Filet de sécurité si animationend ne vient pas (onglet mis en arrière-plan).
  var LIFT_FALLBACK_MS = 600;

  var wrap = document.getElementById('folder');
  var order = KEYS.slice();     // index = profondeur ; order[0] est devant
  var cards = {};
  var tabs = {};
  var bodies = {};
  var howText = null;
  var about = null;             // contenu fusionné (merge) affiché, relu au changement de langue
  var labelEls = {};            // clé de fiche -> { title, tab } (libellé de la fiche)
  var textEls = {};             // clé de fiche -> { box, body, hub } (texte de la fiche)
  var endLift = null;           // termine l'animation « on tire la fiche » en cours
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Même condition que le bloc @media « feuille verticale » de about.css (à
  // garder alignées) : dans ce mode les fiches ne glissent pas, une seule est
  // affichée. Largeur seule : une fenêtre large mais basse (MacBook + barre de
  // Safari, ≈ 1280 × 620) garde la mise en page bureau et défile.
  var phoneQuery = window.matchMedia ? matchMedia('(max-width: 1000px)') : null;
  function isPhone() { return !!(phoneQuery && phoneQuery.matches); }

  // Filet de sécurité si animationend ne vient pas (tirage envoyé derrière).
  var PRINT_FALLBACK_MS = 650;

  /* ---------- Données ---------- */
  function str(v) { return typeof v === 'string' ? v : ''; }
  function obj(v) { return v && typeof v === 'object' ? v : {}; }
  // Keep the optional typography settings; all displayed copy and media use local defaults/placeholders.
  function merge(a) {
    var f = obj(obj(a).fonts);
    return { fonts: { type: str(f.type), body: str(f.body), hand: str(f.hand) } };
  }

  // About copy and preview states for the video-editing portfolio.
  var DEFAULT_ABOUT = {
    name: 'AzmeerPirani',
    title: 'Video, design & hardware with intent',
    title_en: 'Video, design & hardware with intent',
    stamp: 'MAKE WITH PURPOSE.',
    stamp_en: 'MAKE WITH PURPOSE.',
    note: 'Creative work, practical builds, and community.',
    note_en: 'Creative work, practical builds, and community.',
    how: 'I move between video editing, graphic design, embedded electronics, and events that help other builders get started.',
    how_en: 'I move between video editing, graphic design, embedded electronics, and events that help other builders get started.',
    cards: {
      desc: {
        label: 'About Me', label_en: 'About Me',
        text: 'Azmeer Pirani is a video editor, graphic designer, and embedded-electronics builder. He organised three major Hyderabad events: Haven (300+), Blueprint (150+), and Boba Bash (100+).',
        text_en: 'Azmeer Pirani is a video editor, graphic designer, and embedded-electronics builder. He organised three major Hyderabad events: Haven (300+), Blueprint (150+), and Boba Bash (100+).',
      },
      cv: {
        label: 'Creative & Technical', label_en: 'Creative & Technical',
        text: '- Video editing and motion graphics\n- Graphic design and multimedia\n- Embedded electronics, PCB design, and firmware\n- $52K+ in freelance work since Grade 8',
        text_en: '- Video editing and motion graphics\n- Graphic design and multimedia\n- Embedded electronics, PCB design, and firmware\n- $52K+ in freelance work since Grade 8'
      },
      hobbies: {
        label: 'Community', label_en: 'Community',
        text: 'Hack Club event coordinator and hardware mentor. Founded a school electronics club for 40+ students and raised $2K+ for equipment.',
        text_en: 'Hack Club event coordinator and hardware mentor. Founded a school electronics club for 40+ students and raised $2K+ for equipment.'
      },
      content: {
        label: 'Highlights', label_en: 'Highlights',
        text: 'Four fully sponsored international hackathons across four countries. One of two international piano winners at Global Encounters — Jubilee Arts. Multimedia designer at Aga Khan Academy.',
        text_en: 'Four fully sponsored international hackathons across four countries. One of two international piano winners at Global Encounters — Jubilee Arts. Multimedia designer at Aga Khan Academy.'
      }
    }
  };

  function withDefaults(a) {
    a = obj(a);
    ['name', 'title', 'title_en', 'stamp', 'stamp_en', 'note', 'note_en', 'how', 'how_en']
      .forEach(function (key) { a[key] = DEFAULT_ABOUT[key]; });
    a.photo = '';
    a.photos = [];
    a.cards = {};
    KEYS.forEach(function (key) { a.cards[key] = DEFAULT_ABOUT.cards[key]; });
    return a;
  }

  /* ---------- Gabarits SVG (statiques) ---------- */
  // Pinces de bureau d'après la planche de références : pinces à dessin
  // (bulldog) en tôle colorée et pince double-clip (binder) à bras chromés.
  // La tôle est en currentColor — la couleur de chaque pince se règle en CSS
  // (color) ; le relief vient de dégradés translucides posés par-dessus.
  function layer(fill, shapes) { return '<g fill="' + fill + '">' + shapes + '</g>'; }
  // Bulldog, viewBox 0 0 96 72 : deux languettes de ressort, anse plate à
  // œillet (trou réel, fill-rule evenodd), face pliée, rouleau du ressort.
  var BD_LEVERS = '<rect x="11" y="22" width="17" height="16" rx="2.5" transform="rotate(-14 19.5 30)"/>' +
    '<rect x="68" y="22" width="17" height="16" rx="2.5" transform="rotate(14 76.5 30)"/>';
  var BD_TAB_D = 'M34 44V17a14 14 0 0 1 28 0v27zM43.5 17a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0z';
  var BD_TAB = '<path fill-rule="evenodd" d="' + BD_TAB_D + '"/>';
  var BD_FACE = '<rect x="4" y="40" width="88" height="28" rx="3"/>';
  var BD_ROLL = '<rect x="4" y="33" width="88" height="11" rx="5"/>';
  function bulldog(id, tabDecor, faceDecor) {
    return '<symbol id="' + id + '" viewBox="0 0 96 72" overflow="visible">' +
      layer('currentColor', BD_LEVERS) + layer('url(#ab-shade)', BD_LEVERS) +
      '<g fill="none" stroke="rgba(0,0,0,.28)">' + BD_LEVERS + '</g>' +
      layer('currentColor', BD_TAB) + (tabDecor || '') + layer('url(#ab-shade)', BD_TAB) +
      '<path fill="none" stroke="rgba(0,0,0,.3)" d="' + BD_TAB_D + '"/>' +
      layer('currentColor', BD_FACE) + (faceDecor || '') + layer('url(#ab-shade)', BD_FACE) +
      '<rect x="4.5" y="40.5" width="87" height="27" rx="3" fill="none" stroke="rgba(0,0,0,.3)"/>' +
      layer('currentColor', BD_ROLL) + layer('url(#ab-roll)', BD_ROLL) +
      '<rect x="4.5" y="33.5" width="87" height="10" rx="5" fill="none" stroke="rgba(0,0,0,.3)"/>' +
      '<path d="M5 44.5h86" stroke="rgba(0,0,0,.28)"/>' +                                    // ligne de pliage
      '<rect x="9" y="46" width="78" height="1.6" rx=".8" fill="#fff" fill-opacity=".5"/>' +  // reflet fin
      '</symbol>';
  }
  var DOTS_TAB = layer('url(#ab-dots)', BD_TAB);
  var DOTS_FACE = layer('url(#ab-dots)', BD_FACE);
  // Petit logo blanc estampé au centre de la face (ovale + deux traits).
  var LOGO = '<g fill="#fff" fill-opacity=".92"><ellipse cx="48" cy="54.5" rx="14" ry="6.5" fill="none" stroke="#fff" stroke-opacity=".92" stroke-width="1.5"/>' +
    '<rect x="40" y="52" width="16" height="2.2" rx="1.1"/><rect x="43" y="55.8" width="10" height="1.5" rx=".75"/></g>';
  // Binder clip, viewBox 0 0 72 72 : deux bras en fil chromé relevés, dos
  // plat, face en biseau jusqu'à la bouche.
  var BC_ARMS_D = 'M18 30V13a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v17M38 30V13a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v17';
  var BC_FACE = '<path d="M8 36h56l-9 28H17z"/>';
  var BC_BACK = '<rect x="8" y="27" width="56" height="10" rx="2"/>';
  var BINDER = '<symbol id="ab-binder" viewBox="0 0 72 72" overflow="visible">' +
    '<path d="' + BC_ARMS_D + '" fill="none" stroke="rgba(0,0,0,.38)" stroke-width="4" stroke-linecap="round"/>' +   // liseré sombre du fil
    '<path d="' + BC_ARMS_D + '" fill="none" stroke="url(#ab-chrome)" stroke-width="2.8" stroke-linecap="round"/>' +
    '<path d="M18.9 28V13a5.1 5.1 0 0 1 5.1-5.1h4M38.9 28V13a5.1 5.1 0 0 1 5.1-5.1h4" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round"/>' +
    layer('currentColor', BC_FACE) + layer('url(#ab-shade)', BC_FACE) +
    layer('currentColor', BC_BACK) + layer('url(#ab-roll)', BC_BACK) +
    '<path d="M17.5 64h37" stroke="rgba(0,0,0,.5)" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M8.5 27.5h55v9l-9 27.5H17.5l-9-27.5z" fill="none" stroke="rgba(0,0,0,.32)"/>' +
    '</symbol>';
  // Logos des plateformes (glyphes simples, monochromes : currentColor), pour
  // les chips du hub et le badge des tuiles.
  var PLATFORM_ICONS =
    '<symbol id="ab-instagram" viewBox="0 0 24 24" fill="currentColor"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.6" cy="6.4" r="1.4"/></symbol>' +
    '<symbol id="ab-tiktok" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></symbol>' +
    '<symbol id="ab-twitch" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></symbol>' +
    '<symbol id="ab-youtube" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></symbol>';
  var DEFS = '<svg class="about-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="ab-shade" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>' +
    '<linearGradient id="ab-roll" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".3" stop-color="#fff" stop-opacity=".55"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>' +
    '<linearGradient id="ab-chrome" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#F8F3F9"/><stop offset=".5" stop-color="#93869D"/><stop offset="1" stop-color="#EEE8F2"/></linearGradient>' +
    '<pattern id="ab-dots" width="12" height="12" patternUnits="userSpaceOnUse">' +
    '<circle cx="3" cy="3" r="2.1" fill="#fff" fill-opacity=".9"/><circle cx="9" cy="9" r="2.1" fill="#fff" fill-opacity=".9"/></pattern>' +
    bulldog('ab-bulldog') + bulldog('ab-bulldog-dots', DOTS_TAB, DOTS_FACE) + bulldog('ab-bulldog-logo', '', LOGO) + BINDER +
    '<symbol id="ab-heart" viewBox="0 0 64 60" overflow="visible"><path d="M32 56 C10 40 2 30 2 18 A12 12 0 0 1 32 12 A12 12 0 0 1 62 18 C62 30 54 40 32 56Z"/></symbol>' +
    '<symbol id="ab-star" viewBox="0 0 64 64" overflow="visible"><path d="M32 3 L40.5 23 L62 25 L45.5 39 L50.5 61 L32 49 L13.5 61 L18.5 39 L2 25 L23.5 23Z"/></symbol>' +
    PLATFORM_ICONS +
    '</defs></svg>';

  function fromHtml(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstElementChild;
  }
  // Instance d'un symbole : <svg class="…"><use href="#…"></use></svg>.
  function useSvg(cls, id, viewBox, extra) {
    return fromHtml('<svg class="' + cls + '" viewBox="' + viewBox + '" aria-hidden="true" focusable="false"' +
      (extra || '') + '><use href="#' + id + '"></use></svg>');
  }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  // Libellé traduit : Site.applyLang() le retraduira seul au clic sur un drapeau.
  function i18n(tag, key) {
    var n = make(tag, null, Site.t(key));
    n.setAttribute('data-i18n', key);
    return n;
  }

  /* ---------- Texte brut → paragraphes, puces, lignes datées ---------- */
  function renderText(text, box) {
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    var cur = null;             // <p> ou <ul> en cours
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/\s+$/, '');
      if (!line.trim()) { cur = null; continue; }
      var m;
      if (BULLET.test(line)) {
        var item = line.replace(BULLET, '');
        if (!item) continue;                     // puce vide : rien à afficher
        if (!cur || cur.tagName !== 'UL') { cur = make('ul'); box.appendChild(cur); }
        cur.appendChild(make('li', null, item));
      } else if ((m = line.match(DATED))) {
        cur = null;
        var row = make('div', 'dated');
        row.appendChild(make('span', 'dated-when', m[1]));
        row.appendChild(make('span', 'dated-what', m[2]));
        box.appendChild(row);
      } else {
        if (!cur || cur.tagName !== 'P') { cur = make('p'); box.appendChild(cur); }
        else cur.appendChild(make('br'));
        cur.appendChild(document.createTextNode(line));
      }
    }
    if (!box.firstChild) {
      var empty = i18n('p', 'about.empty');
      empty.className = 'card-empty';
      box.appendChild(empty);
    }
  }

  /* ---------- Pile de tirages dans le cadre perforé ---------- */
  // Une photo : un tirage, comme avant. Plusieurs : le premier devant, deux
  // autres visibles derrière (décalés, un peu tournés) ; clic, Entrée/Espace
  // ou balayage envoient le tirage du dessus derrière la pile. Renvoie les
  // points de pagination (à poser sous le cadre) ou null.
  function buildPhotos(frame, photos, name) {
    var stack = make('div', 'photo-stack');
    frame.appendChild(stack);
    var prints = [];
    var dots = null;
    var cur = 0;
    var busy = false;
    function showEmpty() {
      stack.textContent = '';
      stack.className = 'photo-stack';
      stack.removeAttribute('tabindex');
      stack.removeAttribute('role');
      stack.removeAttribute('aria-label');
      var print = make('div', 'photo-print pos-0');
      var empty = make('div', 'photo-empty');
      empty.appendChild(make('span', null, 'VIDEO COVER PLACEHOLDER'));
      print.appendChild(empty);
      stack.appendChild(print);
      if (dots) { dots.remove(); dots = null; }
    }
    function place() {
      var n = prints.length;
      prints.forEach(function (p, i) {
        var pos = (i - cur + n) % n;
        p.className = 'photo-print ' + (pos < 3 ? 'pos-' + pos : 'pos-back');
        p.setAttribute('aria-hidden', pos ? 'true' : 'false');
      });
      if (dots) {
        for (var k = 0; k < dots.children.length; k++) {
          dots.children[k].classList.toggle('is-on', k === cur);
          dots.children[k].setAttribute('aria-current', k === cur ? 'true' : 'false');
        }
      }
      stack.setAttribute('aria-label', name + ' · ' + (cur + 1) + ' / ' + n);
    }
    function goTo(i) {
      var n = prints.length;
      if (n < 2 || busy || i === cur) return;
      var leaving = prints[cur];
      var forward = i === (cur + 1) % n;
      cur = i;
      place();
      // Seul le passage au suivant joue « le tirage part derrière » ; un saut
      // par les points se contente de la transition de position.
      if (!forward || reduceMotion) return;
      busy = true;
      leaving.classList.add('leaving');
      var done = false;
      var timer = null;
      function finish() {
        if (done) return;
        done = true;
        clearTimeout(timer);
        leaving.removeEventListener('animationend', onEnd);
        leaving.classList.remove('leaving');
        busy = false;
      }
      function onEnd(e) { if (e.target === leaving && e.animationName === 'abPrintOut') finish(); }
      leaving.addEventListener('animationend', onEnd);
      timer = setTimeout(finish, PRINT_FALLBACK_MS);
    }
    function next() { goTo((cur + 1) % prints.length); }
    // Image introuvable : le tirage sort de la pile (aucun cadre cassé).
    function drop(print) {
      var i = prints.indexOf(print);
      if (i === -1) return;
      prints.splice(i, 1);
      print.remove();
      if (dots && dots.children[i]) dots.removeChild(dots.children[i]);
      if (!prints.length) { showEmpty(); return; }
      if (i < cur) cur--;
      if (cur >= prints.length) cur = 0;
      if (prints.length < 2 && dots) { dots.remove(); dots = null; }
      place();
    }
    if (!photos.length) { showEmpty(); return null; }
    // Toutes les images sont dans le DOM dès le départ : préchargées.
    photos.forEach(function (u) {
      var print = make('div', 'photo-print');
      var img = make('img', 'photo');
      img.alt = name;
      img.decoding = 'async';
      img.draggable = false;
      img.onerror = function () { drop(print); };
      img.src = u;
      print.appendChild(img);
      stack.appendChild(print);
      prints.push(print);
    });
    if (photos.length > 1) {
      stack.className = 'photo-stack is-pile';
      stack.tabIndex = 0;
      stack.setAttribute('role', 'button');
      dots = make('div', 'photo-dots');
      photos.forEach(function (_, i) {
        var b = make('button', 'dot');
        b.type = 'button';
        b.title = String(i + 1);
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          goTo(Array.prototype.indexOf.call(dots.children, b));
        });
        dots.appendChild(b);
      });
      var sx = 0, sy = 0, swiped = 0;
      stack.addEventListener('click', function () { if (Date.now() - swiped > 400) next(); });
      stack.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
      });
      // Balayage au doigt (touch-action: pan-y en CSS) : le clic qui suit un
      // balayage est ignoré pour ne pas avancer de deux.
      stack.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; }, { passive: true });
      stack.addEventListener('pointerup', function (e) {
        if (e.pointerType === 'mouse') return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) { swiped = Date.now(); next(); }
      }, { passive: true });
    }
    place();
    return dots;
  }

  /* ---------- Reel previews in the About content card ---------- */
  function buildHub() {
    var hub = make('div', 'hub');
    var section = make('section', 'hub-section hub-videos');
    section.appendChild(make('h3', null, 'A few Reels'));
    var grid = make('div', 'hub-grid');
    [
      ['1_kfG0LfsIJ-dUv9dy-PPpxQBcNICuu6n', 'Apparel Promo'],
      ['1SvTDTNfvj9ZPZei5A6a3EfQygGjhpCeL', 'Creator Short'],
    ].forEach(function (item) {
      var tile = make('div', 'hub-tile tile-9x16 hub-reel');
      var player = make('iframe', 'hub-reel-frame');
      player.title = item[1];
      player.src = 'https://drive.google.com/file/d/' + item[0] + '/preview';
      player.loading = 'lazy';
      player.allow = 'autoplay; fullscreen';
      player.allowFullscreen = true;
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      tile.appendChild(player);
      tile.appendChild(make('span', 'hub-reel-caption', item[1]));
      grid.appendChild(tile);
    });
    section.appendChild(grid);
    hub.appendChild(section);
    return hub;
  }

  /* ---------- Mesure : fondu bas quand le texte dépasse ---------- */
  function overflowing(el) {
    return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
  }
  /* ---------- Post-it ouvert en grand ---------- */
  // Le grand post-it est une copie (titre + texte entier) posée dans un calque
  // fixe : le petit reste à sa place, rien ne bouge dans le dossier.
  var howOpen = null;   // { ov, card, body, onKey }
  function openHow(card) {
    if (howOpen) return;
    var text = Site.tr(about, 'how');
    var ov = make('div', 'how-overlay');
    var back = make('div', 'how-backdrop');
    var big = make('article', 'how-card how-big');
    big.setAttribute('role', 'dialog');
    big.setAttribute('aria-modal', 'true');
    big.appendChild(make('span', 'tape'));
    var title = make('h3', 'how-title');
    title.appendChild(i18n('span', 'about.how.a'));
    title.appendChild(document.createTextNode(' '));
    title.appendChild(useSvg('how-heart', 'ab-heart', '0 0 64 60'));
    title.appendChild(document.createTextNode(' '));
    title.appendChild(i18n('span', 'about.how.b'));
    big.appendChild(title);
    var body = make('div', 'how-text how-full');
    renderText(text, body);
    big.appendChild(body);
    big.appendChild(useSvg('sticker sticker-heart', 'ab-heart', '0 0 64 60'));
    big.appendChild(useSvg('sticker sticker-star', 'ab-star', '0 0 64 64'));
    var close = make('button', 'how-close');
    close.type = 'button';
    close.textContent = '✕';
    close.setAttribute('data-i18n-label', 'divider.close');
    close.setAttribute('aria-label', Site.t('divider.close'));
    close.title = Site.t('divider.close');
    big.appendChild(close);
    ov.appendChild(back);
    ov.appendChild(big);
    // Dans .about-root : les jetons du dossier (--postit, --hand, --ink-paper…)
    // y sont définis ; hors de lui le post-it serait gris et sans police.
    (document.querySelector('.about-root') || document.body).appendChild(ov);
    function onKey(e) { if (e.key === 'Escape') closeHow(); }
    back.addEventListener('click', closeHow);
    close.addEventListener('click', closeHow);
    document.addEventListener('keydown', onKey);
    howOpen = { ov: ov, card: card, body: body, onKey: onKey };
    card.setAttribute('aria-expanded', 'true');
    // Deux temps : le calque est peint, puis la transition d'entrée démarre.
    requestAnimationFrame(function () { ov.classList.add('in'); close.focus(); });
  }
  function closeHow() {
    if (!howOpen) return;
    var h = howOpen;
    howOpen = null;
    document.removeEventListener('keydown', h.onKey);
    h.card.setAttribute('aria-expanded', 'false');
    h.ov.classList.remove('in');
    Site.afterTransition(h.ov, 'opacity', function () {
      if (h.ov.parentNode) h.ov.parentNode.removeChild(h.ov);
    }, 400);
    try { h.card.focus(); } catch (e) {}
  }

  /* ---------- Taille du cadre photo (bureau) ---------- */
  // Le plus grand carré qui tient dans la colonne gauche : borné par sa
  // largeur (marge de 10 px à droite) et par la hauteur de la chemise, de
  // sorte que le post-it (150 px, posé sous la note quand il y en a une, sinon
  // 26 px sous le cadre) ne descende jamais plus bas que 30 px sous le bord
  // intérieur de la chemise (il reste dans sa marge, comme à 1440 × 900). Sur une fenêtre
  // basse, le cadre suit la hauteur ; sans note, il récupère la place de
  // celle-ci. Jamais moins de 266 px ; sur téléphone, le CSS décide seul.
  var FRAME_MIN = 266, FRAME_MAX = 440, HOW_H = 150, HANG = 30, FRAME_TOP = 36;
  function fitFrame() {
    var root = wrap.closest('.about-root') || document.body;
    var folderEl = wrap.querySelector('.folder'), left = wrap.querySelector('.col-left'), frame = wrap.querySelector('.photo-frame');
    if (!folderEl || !left || !frame || wrap.hidden || isPhone()) {
      root.style.removeProperty('--frame-h');
      root.style.removeProperty('--how-gap');
      return;
    }
    var fcs = getComputedStyle(folderEl);
    var innerH = folderEl.clientHeight - (parseFloat(fcs.paddingTop) || 0) - (parseFloat(fcs.paddingBottom) || 0);
    var frameLeft = parseFloat(getComputedStyle(frame).left) || 20;
    // Le post-it est posé dans la chemise (origine : son bord intérieur haut),
    // le cadre et la note dans la colonne (à colTop de ce bord) : tout est
    // ramené aux coordonnées de la chemise.
    var colTop = left.offsetTop || 0;
    var note = left.querySelector('.note');
    var howGap = colTop + FRAME_TOP + (note ? note.offsetHeight + 12 : 26);
    var byW = left.clientWidth - frameLeft - 10;
    var byH = colTop + innerH + HANG - howGap - HOW_H;
    var size = Math.round(Math.max(FRAME_MIN, Math.min(FRAME_MAX, byW, byH)));
    root.style.setProperty('--frame-h', size + 'px');
    root.style.setProperty('--how-gap', howGap + 'px');
  }

  function measureScroll() {
    var body = bodies[order[0]];
    if (body) body.classList.toggle('scrolls', overflowing(body));
    if (howText) howText.classList.toggle('scrolls', overflowing(howText));
  }

  /* ---------- Textes bilingues ---------- */
  // Libellé d'une fiche (titre et onglet) : personnalisé dans la langue du
  // site s'il y en a un, sinon traduit automatiquement (data-i18n).
  function setLabel(el, c, key) {
    var lab = Site.tr(c, 'label');
    el.textContent = '';
    if (lab) el.textContent = lab;
    else el.appendChild(i18n('span', 'about.tab.' + key));
  }
  // Texte d'une fiche dans la langue du site. La fiche « créa de contenu »
  // sans texte garde son hub seul : le bloc texte sort du DOM.
  function setCardText(key) {
    var r = textEls[key];
    if (!r) return;
    var c = about.cards[key];
    var s = Site.tr(c, 'text');
    r.box.textContent = '';
    if (s.trim() || !r.hub) renderText(s, r.box);
    var inDom = r.box.parentNode === r.body;
    if (r.box.firstChild && !inDom) r.body.insertBefore(r.box, r.hub || null);
    else if (!r.box.firstChild && inDom) r.body.removeChild(r.box);
  }
  // Changement de langue : intitulé, autocollant, note, libellés et textes
  // des fiches, post-it (petit et ouvert en grand), titres des tuiles du hub,
  // tous réécrits en place — la fiche devant, la pile de photos et le post-it
  // ouvert restent tels quels.
  function retranslate() {
    if (!about) return;
    var q = function (sel) { return wrap.querySelector(sel); };
    var n;
    if ((n = q('.label-title'))) n.textContent = Site.tr(about, 'title');
    if ((n = q('.stamp'))) n.textContent = Site.tr(about, 'stamp');
    if ((n = q('.col-left > .note'))) n.textContent = Site.tr(about, 'note');
    KEYS.forEach(function (key) {
      if (labelEls[key]) {
        setLabel(labelEls[key].title, about.cards[key], key);
        setLabel(labelEls[key].tab, about.cards[key], key);
      }
      setCardText(key);
    });
    if (howText) { howText.textContent = ''; renderText(Site.tr(about, 'how'), howText); }
    if (howOpen) { howOpen.body.textContent = ''; renderText(Site.tr(about, 'how'), howOpen.body); }
    measureScroll();
  }
  document.addEventListener('cc:lang', retranslate);

  /* ---------- Profondeur ---------- */
  function applyDepth() {
    for (var d = 0; d < order.length; d++) {
      var key = order[d];
      var card = cards[key];
      var tab = tabs[key];
      var front = d === 0;
      card.setAttribute('data-depth', String(d));
      tab.setAttribute('data-depth', String(d));
      card.classList.toggle('is-front', front);
      // La fiche arrière ne montre que sa tranche de papier : son corps est
      // caché aux lecteurs d'écran et inerte (la tranche, elle, reste cliquable).
      if (front) { card.removeAttribute('aria-hidden'); bodies[key].removeAttribute('inert'); }
      else { card.setAttribute('aria-hidden', 'true'); bodies[key].setAttribute('inert', ''); }
      tab.setAttribute('aria-selected', front ? 'true' : 'false');
      tab.tabIndex = front ? 0 : -1;
    }
  }

  function raise(key, on) {
    cards[key].classList.toggle('raised', on);
    tabs[key].classList.toggle('raised', on);
  }

  // Amène une fiche devant ; les autres conservent leur ordre relatif.
  function select(key, animate) {
    var d0 = order.indexOf(key);
    if (d0 <= 0) return;
    order.splice(d0, 1);
    order.unshift(key);
    var card = cards[key];
    var tab = tabs[key];
    raise(key, false);
    if (endLift) endLift();
    if (animate && !reduceMotion && !isPhone()) {
      // Point de départ de l'animation = ancienne position de profondeur.
      var pair = [card, tab];
      pair.forEach(function (n) {
        n.style.setProperty('--x0', (4 * d0) + 'px');
        n.style.setProperty('--y0', (-40 * d0) + 'px');
        n.classList.add('lifting');
      });
      var done = false;
      var timer = null;
      var finish = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        card.removeEventListener('animationend', onEnd);
        pair.forEach(function (n) { n.classList.remove('lifting'); });
        if (endLift === finish) endLift = null;
      };
      var onEnd = function (e) {
        if (e.target === card && e.animationName === 'ficheLift') finish();
      };
      card.addEventListener('animationend', onEnd);
      timer = setTimeout(finish, LIFT_FALLBACK_MS);
      endLift = finish;
    }
    applyDepth();
    measureScroll();
    if (isPhone()) {
      var r = card.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight) {
        card.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
  }

  // Clavier : ←/→ (bouclage), Début/Fin déplacent le focus ET amènent la fiche.
  function onKey(e) {
    var active = document.activeElement;
    var i = KEYS.indexOf(active && active.getAttribute('data-key'));
    if (i === -1) return;
    var n = null;
    if (e.key === 'ArrowRight') n = (i + 1) % KEYS.length;
    else if (e.key === 'ArrowLeft') n = (i + KEYS.length - 1) % KEYS.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = KEYS.length - 1;
    if (n === null) return;
    e.preventDefault();
    tabs[KEYS[n]].focus();
    select(KEYS[n], true);
  }

  /* ---------- Construction ---------- */
  function build(content) {
    var a = withDefaults(merge(content && content.about));
    about = a;
    labelEls = {};
    textEls = {};
    // Polices du dossier : les trois variables de about.css, surchargées sur
    // .about-root quand une police est choisie dans l'admin.
    var fontNames = ['Special Elite', 'Caveat', 'IBM Plex Mono'];
    var root = wrap.closest('.about-root') || document.body;
    [['type', '--type'], ['body', '--mono'], ['hand', '--hand']].forEach(function (pair) {
      var n = a.fonts[pair[0]];
      if (!n) return;
      fontNames.push(n);
      root.style.setProperty(pair[1], Site.fontStack(n, content));
    });
    Site.ensureFonts(fontNames, content);
    var name = a.name || 'CESTCLAIR';

    wrap.appendChild(fromHtml(DEFS));
    wrap.appendChild(make('div', 'folder-back'));
    var folder = make('div', 'folder');
    wrap.appendChild(folder);

    folder.appendChild(make('div', 'folder-side', name));
    folder.appendChild(useSvg('clip folder-clamp', 'ab-bulldog', '0 0 96 72', ' preserveAspectRatio="xMidYMid meet"'));

    var label = make('div', 'folder-label');
    label.appendChild(make('span', 'tape'));
    label.appendChild(make('p', 'label-name', name));
    if (a.title || a.title_en) label.appendChild(make('p', 'label-title', Site.tr(a, 'title')));
    folder.appendChild(label);

    /* Colonne gauche */
    var left = make('div', 'col-left');
    var frame = make('figure', 'photo-frame');
    // `photo` (ancien champ unique) reste la première, puis `photos`, sans doublon.
    var photos = [];
    [a.photo].concat(a.photos, [
      'assets/media/profile/pfp1.png',
      'assets/media/profile/pfp2.png'
    ]).forEach(function (u) { if (u && photos.indexOf(u) === -1) photos.push(u); });
    var dots = buildPhotos(frame, photos, name);
    frame.appendChild(useSvg('clip clip-photo', 'ab-bulldog-logo', '0 0 96 72'));
    left.appendChild(frame);
    if (dots) left.appendChild(dots);
    if (a.stamp || a.stamp_en) left.appendChild(make('div', 'stamp', Site.tr(a, 'stamp')));
    if (a.note || a.note_en) left.appendChild(make('p', 'note', Site.tr(a, 'note')));
    folder.appendChild(left);

    /* Pile de fiches + onglets (les onglets APRÈS les fiches dans le DOM) */
    var stack = make('div', 'stack');
    var tablist = make('div', 'tabs');
    tablist.setAttribute('role', 'tablist');
    // Nom de la tablist pour les lecteurs d'écran : data-i18n-label, le
    // mécanisme de common.js — Site.applyLang() retraduit l'aria-label au clic
    // sur un drapeau. Posé aussi en dur : applyLang est déjà passé au montage.
    tablist.setAttribute('data-i18n-label', 'about.tablist');
    tablist.setAttribute('aria-label', Site.t('about.tablist'));
    KEYS.forEach(function (key) {
      var c = a.cards[key];
      var card = make('section', 'card');
      card.setAttribute('data-key', key);
      card.setAttribute('role', 'tabpanel');
      card.id = 'about-panel-' + key;
      card.setAttribute('aria-labelledby', 'about-tab-' + key);
      card.appendChild(useSvg('clip clip-edge', 'ab-binder', '0 0 72 72'));
      if (key === 'cv') card.appendChild(useSvg('clip clip-cv', 'ab-bulldog-dots', '0 0 96 72'));
      var body = make('div', 'card-body');
      var title = make('h2', 'card-title');
      var tab = make('button', 'tab');
      tab.type = 'button';
      // title vide : sans lui, l'infobulle du conteneur (le title que
      // applyLang pose avec l'aria-label) apparaîtrait au survol des onglets.
      tab.title = '';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('data-key', key);
      tab.id = 'about-tab-' + key;
      tab.setAttribute('aria-controls', card.id);
      // Libellé personnalisé (dans la langue du site, le français servant de
      // repli) : affiché tel quel ; sinon traduit automatiquement.
      setLabel(title, c, key);
      setLabel(tab, c, key);
      labelEls[key] = { title: title, tab: tab };
      body.appendChild(title);
      var text = make('div', 'card-text');
      // Fiche « créa de contenu » : le texte (s'il y en a) puis le hub ; sans
      // hub, la fiche garde son message « rien de classé » quand elle est vide.
      var hub = key === 'content' ? buildHub() : null;
      if (hub) body.appendChild(hub);
      textEls[key] = { box: text, body: body, hub: hub };
      setCardText(key);
      card.appendChild(body);
      stack.appendChild(card);
      tablist.appendChild(tab);
      cards[key] = card;
      tabs[key] = tab;
      bodies[key] = body;

      tab.addEventListener('click', function () { select(key, true); });
      // La tranche visible d'une fiche arrière vaut son onglet.
      card.addEventListener('click', function () {
        if (!card.classList.contains('is-front')) select(key, true);
      });
      // Survol à la souris seulement (au doigt, la classe resterait collée) :
      // onglet et fiche se soulèvent ensemble, la fiche de devant ne bouge pas
      // quand on la lit.
      tab.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') raise(key, true); });
      tab.addEventListener('pointerleave', function () { raise(key, false); });
      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse' && !card.classList.contains('is-front')) raise(key, true);
      });
      card.addEventListener('pointerleave', function () { raise(key, false); });
      // Le fondu bas disparaît une fois arrivé en bas du texte.
      body.addEventListener('scroll', function () {
        body.classList.toggle('scrolls', overflowing(body));
      }, { passive: true });
    });
    stack.appendChild(tablist);
    tablist.addEventListener('keydown', onKey);
    folder.appendChild(stack);

    /* Post-it « Comment j'♥ taffer » : enfant de la chemise, après la pile,
       pour venir en dernier sur téléphone (étiquette, photo, note, onglets,
       fiche, post-it) ; sur bureau il est posé en absolu en bas à gauche. */
    var how = make('article', 'how-card');
    how.appendChild(make('span', 'tape'));
    var howTitle = make('h3', 'how-title');
    howTitle.appendChild(i18n('span', 'about.how.a'));
    howTitle.appendChild(document.createTextNode(' '));
    howTitle.appendChild(useSvg('how-heart', 'ab-heart', '0 0 64 60'));
    howTitle.appendChild(document.createTextNode(' '));
    howTitle.appendChild(i18n('span', 'about.how.b'));
    how.appendChild(howTitle);
    howText = null;
    if (a.how || a.how_en) {
      howText = make('div', 'how-text');
      renderText(Site.tr(a, 'how'), howText);
      how.appendChild(howText);
    }
    how.appendChild(useSvg('sticker sticker-heart', 'ab-heart', '0 0 64 60'));
    how.appendChild(useSvg('sticker sticker-star', 'ab-star', '0 0 64 64'));
    // Le petit post-it tronque son texte en fondu : un clic (ou Entrée) l'ouvre
    // en grand par-dessus le dossier pour tout lire (texte relu à l'ouverture,
    // dans la langue du moment).
    if (a.how || a.how_en) {
      how.setAttribute('role', 'button');
      how.setAttribute('tabindex', '0');
      how.setAttribute('aria-expanded', 'false');
      how.addEventListener('click', function () { openHow(how); });
      how.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHow(how); }
      });
    }
    folder.appendChild(how);

    // ?tab=cv : cette fiche devant, sans animation (clé inconnue ignorée).
    var wanted = null;
    try { wanted = new URLSearchParams(location.search).get('tab'); } catch (e) {}
    if (wanted && KEYS.indexOf(wanted) !== -1) {
      order = [wanted].concat(KEYS.filter(function (k) { return k !== wanted; }));
    }
    applyDepth();

    var placeholder = document.querySelector('.about-placeholder');
    if (placeholder) placeholder.parentNode.removeChild(placeholder);
    wrap.hidden = false;
    fitFrame();
    measureScroll();
    // Les polices arrivent après le premier rendu : les hauteurs de texte changent.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureScroll);

    // Entrée : la chemise se pose, les fiches sont distribuées, la photo et le
    // post-it apparaissent. La classe est retirée à la fin pour que survols et
    // « lift » ne se battent pas avec animation-fill-mode: both.
    if (!reduceMotion) {
      wrap.classList.add('about-in');
      setTimeout(function () { wrap.classList.remove('about-in'); }, 1400);
    }
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { fitFrame(); measureScroll(); }, 120);
  });

  window.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.topbar')) Site.mountChrome();
    // Même sans contenu (API et seed injoignables), le dossier est dessiné
    // avec ses objets et ses fiches vides : jamais de « coming soon ».
    Site.loadContent().then(build, function () { build(null); });
  });
})();
