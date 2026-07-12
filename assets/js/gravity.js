/* ==========================================================================
   GRAVITY MODE
   "Let there be gravity" — turns every character of visible text on the
   page into a small orbiting body around the center of the viewport.

   Physics: each letter is treated as a test mass in the reduced two-body
   problem, i.e. orbiting a fixed central point of mass M (valid when
   M >> m, the standard limit of the two-body problem used for planetary
   orbits). Given a small tangential velocity kick close to the local
   circular velocity, each letter traces a bound Kepler ellipse:

       a = -GM * r_vec / (|r|^2 + eps^2)^1.5      (softened inverse-square law)
       v += a * dt
       r += v * dt

   eps is a softening length so letters that wander close to the center
   don't get flung out by a numerical singularity.
   ========================================================================== */

(function () {
  var active = false;
  var rafId = null;
  var overlay = null;
  var letters = [];
  var lastTime = null;

  var GM = 2200000;       // gravitational parameter, tuned for a pleasant orbit period
  var SOFTENING = 18;      // px, prevents singularity at the center
  var MAX_LETTERS = 700;   // performance cap on content-heavy pages

  function makeButton() {
    var btn = document.createElement('button');
    btn.id = 'gravity-button';
    btn.type = 'button';
    btn.textContent = 'let there be gravity';
    btn.setAttribute('aria-label', 'Toggle gravity mode');
    btn.style.position = 'fixed';
    btn.style.bottom = '1.25rem';
    btn.style.right = '1.25rem';
    btn.style.zIndex = '100000';
    btn.style.padding = '0.6rem 1.1rem';
    btn.style.fontFamily = "'Inter', sans-serif";
    btn.style.fontSize = '0.85rem';
    btn.style.letterSpacing = '0.02em';
    btn.style.border = '1px solid rgba(0,0,0,0.15)';
    btn.style.borderRadius = '999px';
    btn.style.background = '#111';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.25)';
    btn.addEventListener('click', toggleGravity);
    document.body.appendChild(btn);
  }

  function makeOverlay() {
    var el = document.createElement('div');
    el.id = 'gravity-overlay';
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '99999';
    el.style.overflow = 'hidden';
    document.body.appendChild(el);
    return el;
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
        if (parent.id === 'gravity-overlay' || parent.closest('#gravity-overlay')) return NodeFilter.FILTER_REJECT;
        if (parent.id === 'gravity-button') return NodeFilter.FILTER_REJECT;
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
    var center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    overlay = makeOverlay();
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

        var x0 = rect.left + rect.width / 2;
        var y0 = rect.top + rect.height / 2;
        var rx = x0 - center.x;
        var ry = y0 - center.y;
        var r = Math.sqrt(rx * rx + ry * ry) || 1;

        // Circular-orbit speed at this radius, then perturb it so orbits
        // come out as varied ellipses rather than perfect circles.
        var vCirc = Math.sqrt(GM / r);
        var speedFactor = 0.65 + Math.random() * 0.7; // elliptical spread
        var speed = vCirc * speedFactor;

        // Tangential direction (perpendicular to radius vector), consistent
        // rotation sense for a coherent swirl.
        var tx = -ry / r;
        var ty = rx / r;

        letters.push({
          el: span,
          x: x0,
          y: y0,
          vx: tx * speed,
          vy: ty * speed
        });

        count++;
      }
    }

    document.body.classList.add('gravity-mode');
    active = true;
    lastTime = null;
    rafId = requestAnimationFrame(step);
  }

  function step(now) {
    if (!active) return;
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.05); // seconds, clamp for tab-switch jumps
    lastTime = now;

    var center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

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

    rafId = requestAnimationFrame(step);
  }

  function stopGravity() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    document.body.classList.remove('gravity-mode');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    letters = [];
  }

  function toggleGravity() {
    if (active) {
      stopGravity();
    } else {
      startGravity();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeButton);
  } else {
    makeButton();
  }
})();
