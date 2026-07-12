/* ==========================================================================
   GRAVITY MODE
   "Let there be gravity" — turns every character of visible text on the
   page into a small orbiting body around a central black hole.

   Physics: each letter is a test mass in the reduced two-body problem,
   i.e. orbiting a fixed central point of mass M (valid when M >> m, the
   standard limit used for planetary orbits). Given a small tangential
   velocity kick, each letter traces a bound Kepler ellipse:

       a = -GM * r_vec / (|r|^2 + eps^2)^1.5      (softened inverse-square law)
       v += a * dt
       r += v * dt

   Everything is simulated and rendered in PAGE (document) coordinates, not
   viewport coordinates, so scrolling is a pure Galilean shift of the
   viewing frame: the orbits themselves don't change, you're just looking
   at a different window onto the same fixed simulation.
   ========================================================================== */

(function () {
  var active = false;
  var resetting = false;
  var rafId = null;
  var overlay = null;
  var blackHole = null;
  var letters = [];
  var lastTime = null;
  var center = null; // page coordinates, fixed for the lifetime of the sim

  var GM = 2200000;        // gravitational parameter, tuned for a pleasant orbit period
  var SOFTENING = 18;       // px, prevents singularity at the center
  var MAX_LETTERS = 700;    // performance cap on content-heavy pages
  var VELOCITY_SCALE = 1 / 3; // requested 3x reduction in initial kick
  var RESET_DURATION = 1200; // ms, smooth-return tween length

  function makeButtons() {
    var wrap = document.createElement('div');
    wrap.id = 'gravity-controls';
    wrap.style.position = 'fixed';
    wrap.style.bottom = '1.25rem';
    wrap.style.right = '1.25rem';
    wrap.style.zIndex = '100000';
    wrap.style.display = 'flex';
    wrap.style.gap = '0.5rem';

    var btn = document.createElement('button');
    btn.id = 'gravity-button';
    btn.type = 'button';
    btn.textContent = 'let there be gravity';
    styleButton(btn, '#111');
    btn.addEventListener('click', function () {
      if (!active) startGravity();
    });

    var reset = document.createElement('button');
    reset.id = 'gravity-reset-button';
    reset.type = 'button';
    reset.textContent = 'reset';
    styleButton(reset, '#7a1f1f');
    reset.style.display = 'none';
    reset.addEventListener('click', smoothReset);

    wrap.appendChild(btn);
    wrap.appendChild(reset);
    document.body.appendChild(wrap);
  }

  function styleButton(btn, bg) {
    btn.style.padding = '0.6rem 1.1rem';
    btn.style.fontFamily = "'Inter', sans-serif";
    btn.style.fontSize = '0.85rem';
    btn.style.letterSpacing = '0.02em';
    btn.style.border = '1px solid rgba(0,0,0,0.15)';
    btn.style.borderRadius = '999px';
    btn.style.background = bg;
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.25)';
    btn.style.transition = 'transform 0.15s ease, background-color 0.15s ease';
    btn.addEventListener('mouseenter', function () { btn.style.transform = 'scale(1.05)'; });
    btn.addEventListener('mouseleave', function () { btn.style.transform = 'scale(1)'; });
  }

  function pageHeight() {
    return Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      window.innerHeight
    );
  }

  function makeOverlay() {
    var el = document.createElement('div');
    el.id = 'gravity-overlay';
    // Absolute + anchored at the document origin (no positioned ancestor)
    // so it scrolls naturally with the page — this IS the Galilean shift.
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = pageHeight() + 'px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '99999';
    el.style.overflow = 'visible';
    document.body.appendChild(el);
    return el;
  }

  function makeBlackHole(cx, cy) {
    var radius = 22;
    var hole = document.createElement('div');
    hole.id = 'gravity-blackhole';
    hole.style.position = 'absolute';
    hole.style.left = (cx - radius) + 'px';
    hole.style.top = (cy - radius) + 'px';
    hole.style.width = radius * 2 + 'px';
    hole.style.height = radius * 2 + 'px';
    hole.style.borderRadius = '50%';
    hole.style.background = 'radial-gradient(circle at 35% 35%, #333 0%, #000 60%, #000 100%)';
    hole.style.boxShadow = '0 0 25px 8px rgba(0,0,0,0.55)';
    hole.style.pointerEvents = 'none';
    return hole;
  }

  // Walk the DOM and collect text nodes we're allowed to touch.
  function collectTextNodes() {
    var results = [];
    var skipTags = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, IFRAME: 1 };
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('#gravity-overlay') || parent.closest('#gravity-controls')) return NodeFilter.FILTER_REJECT;
        if (skipTags[parent.tagName]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) results.push(n);
    return results;
  }

  function startGravity() {
    var textNodes = collectTextNodes();

    // Fix the simulation's frame in PAGE coordinates at the moment of
    // activation. It does not move again — scrolling only changes what
    // part of it you can see.
    center = {
      x: window.innerWidth / 2 + window.scrollX,
      y: window.innerHeight / 2 + window.scrollY
    };

    overlay = makeOverlay();
    blackHole = makeBlackHole(center.x, center.y);
    overlay.appendChild(blackHole);
    letters = [];

    var count = 0;
    outer:
    for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      var text = node.nodeValue;
      var parentStyle = window.getComputedStyle(node.parentElement);

      for (var c = 0; c < text.length; c++) {
        var ch = text[c];
        if (ch === ' ' || ch === '\n' || ch === '\t') continue;
        if (count >= MAX_LETTERS) break outer;

        var rect = null;
        try {
          var range = document.createRange();
          range.setStart(node, c);
          range.setEnd(node, c + 1);
          var rects = range.getClientRects();
          if (rects && rects.length) rect = rects[0];
        } catch (e) { /* ignore, fall through */ }
        if (!rect || (rect.width === 0 && rect.height === 0)) continue;

        var span = document.createElement('span');
        span.textContent = ch;
        span.style.position = 'absolute';
        span.style.left = '0';
        span.style.top = '0';
        span.style.willChange = 'transform';
        span.style.fontFamily = parentStyle.fontFamily;
        span.style.fontSize = parentStyle.fontSize;
        span.style.fontWeight = parentStyle.fontWeight;
        span.style.fontStyle = parentStyle.fontStyle;
        span.style.setProperty('color', parentStyle.color, 'important');
        span.style.setProperty('opacity', parentStyle.opacity, 'important');
        overlay.appendChild(span);

        // Convert viewport-relative rect to page (document) coordinates.
        var x0 = rect.left + rect.width / 2 + window.scrollX;
        var y0 = rect.top + rect.height / 2 + window.scrollY;
        var rx = x0 - center.x;
        var ry = y0 - center.y;
        var r = Math.sqrt(rx * rx + ry * ry) || 1;

        // Circular-orbit speed at this radius, perturbed for elliptical
        // variety, then scaled down per the requested 3x reduction.
        var vCirc = Math.sqrt(GM / r);
        var speedFactor = 0.65 + Math.random() * 0.7;
        var speed = vCirc * speedFactor * VELOCITY_SCALE;

        // Tangential direction (perpendicular to radius vector), consistent
        // rotation sense for a coherent swirl.
        var tx = -ry / r;
        var ty = rx / r;

        letters.push({
          el: span,
          x: x0,
          y: y0,
          vx: tx * speed,
          vy: ty * speed,
          origX: x0,
          origY: y0
        });

        count++;
      }
    }

    document.body.classList.add('gravity-mode');
    document.getElementById('gravity-button').style.display = 'none';
    document.getElementById('gravity-reset-button').style.display = 'inline-block';
    active = true;
    lastTime = null;
    rafId = requestAnimationFrame(step);
  }

  function step(now) {
    if (!active) return;
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.05); // seconds, clamp for tab-switch jumps
    lastTime = now;

    for (var i = 0; i < letters.length; i++) {
      var L = letters[i];
      var rx = L.x - center.x;
      var ry = L.y - center.y;
      var r2 = rx * rx + ry * ry + SOFTENING * SOFTENING;
      var r3 = Math.pow(r2, 1.5);
      var ax = -GM * rx / r3;
      var ay = -GM * ry / r3;

      L.vx += ax * dt;
      L.vy += ay * dt;
      L.x += L.vx * dt;
      L.y += L.vy * dt;

      L.el.style.transform = 'translate(' + L.x + 'px, ' + L.y + 'px) translate(-50%, -50%)';
    }

    // Keep the overlay tall enough if the document has grown (e.g. dynamic content).
    var h = pageHeight();
    if (overlay && parseFloat(overlay.style.height) < h) {
      overlay.style.height = h + 'px';
    }

    rafId = requestAnimationFrame(step);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothReset() {
    if (!active || resetting) return;
    resetting = true;
    if (rafId) cancelAnimationFrame(rafId);

    var startPositions = letters.map(function (L) { return { x: L.x, y: L.y }; });
    var startTime = null;

    function tween(now) {
      if (startTime === null) startTime = now;
      var t = Math.min((now - startTime) / RESET_DURATION, 1);
      var eased = easeInOutCubic(t);

      for (var i = 0; i < letters.length; i++) {
        var L = letters[i];
        var sx = startPositions[i].x;
        var sy = startPositions[i].y;
        var nx = sx + (L.origX - sx) * eased;
        var ny = sy + (L.origY - sy) * eased;
        L.el.style.transform = 'translate(' + nx + 'px, ' + ny + 'px) translate(-50%, -50%)';
      }

      if (blackHole) {
        blackHole.style.opacity = String(1 - eased);
      }

      if (t < 1) {
        requestAnimationFrame(tween);
      } else {
        finishReset();
      }
    }

    requestAnimationFrame(tween);
  }

  function finishReset() {
    active = false;
    resetting = false;
    document.body.classList.remove('gravity-mode');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    blackHole = null;
    letters = [];
    document.getElementById('gravity-button').style.display = 'inline-block';
    document.getElementById('gravity-reset-button').style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeButtons);
  } else {
    makeButtons();
  }
})();
