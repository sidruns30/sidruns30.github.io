/* ==========================================================================
   GRAVITY MODE
   "Turn on Gravity" — turns every character of visible page text into a
   small orbiting body around a central black hole.

   Physics: each letter is a test particle following a Schwarzschild
   geodesic in the equatorial plane (i.e. genuine general-relativistic
   orbital dynamics, not the Newtonian Kepler approximation). Using
   geometrized units (G = c = 1) with black hole mass M and Schwarzschild
   radius rs = 2M, the equatorial geodesic equations for a massive test
   particle reduce to:

       ell = r^2 dphi/dtau                (conserved specific angular momentum)
       V_eff(r) = (1 - rs/r)(1 + ell^2/r^2)
       d^2r/dtau^2 = -(1/2) V_eff'(r)
                   = ell^2/r^3 - rs/(2 r^2) - (3/2) rs ell^2 / r^4
       dphi/dtau = ell / r^2

   A letter that crosses r = rs has crossed the event horizon and is
   captured — this is the actual physical definition of the horizon, not
   an arbitrary cutoff.

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
  var startTimestamp = null;
  var center = null; // page coordinates, fixed for the lifetime of the sim

  var MASS = 12;                  // px, geometrized "mass" of the black hole
  var RS = 2 * MASS;              // px, Schwarzschild radius (event horizon)
  var MAX_LETTERS = 2200;         // performance cap on very content-heavy pages
  var VELOCITY_SCALE = 1.2;       // tangential kick strength — tuned so most
                                   // letters land above the ISCO and actually
                                   // orbit rather than plunging straight in
  var TIME_SCALE = 860;           // converts real seconds -> geometrized proper-time units
  var SPIN_UP_DURATION = 2000;    // ms, eased ramp-in so the handoff isn't abrupt
  var RESET_DURATION = 3200;      // ms, smooth-return tween length
  var HEIGHT_RECHECK_MS = 2000;   // throttle for expensive document-height reads

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
    btn.textContent = 'Turn on Gravity';
    styleButton(btn, '#111');
    btn.addEventListener('click', function () {
      if (!active) startGravity();
    });

    var reset = document.createElement('button');
    reset.id = 'gravity-reset-button';
    reset.type = 'button';
    reset.textContent = 'Return to Normal';
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
    // Isolate this subtree from the rest of the page's layout/paint work.
    el.style.contain = 'layout style paint';
    document.body.appendChild(el);
    return el;
  }

  function makeBlackHole(cx, cy) {
    var radius = RS;
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
    hole.style.opacity = '0';
    hole.style.transition = 'opacity ' + SPIN_UP_DURATION + 'ms ease';
    return hole;
  }

  // Walk the DOM and collect text nodes we're allowed to touch. The
  // masthead (site title + nav links) is deliberately excluded so
  // navigation always stays intact and readable.
  function collectTextNodes() {
    var results = [];
    var skipTags = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, IFRAME: 1 };
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('#gravity-overlay') || parent.closest('#gravity-controls')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.masthead')) return NodeFilter.FILTER_REJECT;
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
        span.style.opacity = '0';
        span.style.transition = 'opacity ' + SPIN_UP_DURATION + 'ms ease';
        overlay.appendChild(span);

        // Convert viewport-relative rect to page (document) coordinates.
        var x0 = rect.left + rect.width / 2 + window.scrollX;
        var y0 = rect.top + rect.height / 2 + window.scrollY;
        var rx = x0 - center.x;
        var ry = y0 - center.y;
        var r0 = Math.sqrt(rx * rx + ry * ry) || 1;
        var phi0 = Math.atan2(ry, rx);

        // Tangential kick, scaled down per the requested 3x reduction.
        // ell is the conserved specific angular momentum of the geodesic.
        var speedFactor = 0.5 + Math.random() * 0.9;
        var vTangential = Math.sqrt(MASS / r0) * speedFactor * VELOCITY_SCALE;
        var ell = r0 * vTangential;

        letters.push({
          el: span,
          r: r0,
          phi: phi0,
          vr: 0,        // dr/dtau, purely tangential kick to start
          ell: ell,
          x: x0,        // cached Cartesian (for rendering + reset target)
          y: y0,
          origX: x0,
          origY: y0,
          captured: false
        });

        count++;
      }
    }

    document.body.classList.add('gravity-mode');
    document.getElementById('gravity-button').style.display = 'none';
    document.getElementById('gravity-reset-button').style.display = 'inline-block';
    active = true;
    lastTime = null;
    startTimestamp = null;
    lastHeightCheck = 0;
    rafId = requestAnimationFrame(step);

    // Trigger the fade-in transitions on the next frame (needs a tick for
    // the browser to register the initial opacity:0 before animating).
    requestAnimationFrame(function () {
      for (var i = 0; i < letters.length; i++) letters[i].el.style.opacity = '1';
      if (blackHole) blackHole.style.opacity = '1';
    });
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Freeze a captured letter at the event horizon instead of deleting it.
  // It stays in the `letters` array (excluded from further physics) so
  // "Return to Normal" can tween it back out to its original spot. The
  // transition is cleared first so it snaps invisible immediately rather
  // than fading out over the old spin-up duration.
  function captureLetter(L) {
    L.captured = true;
    L.vr = 0;
    L.el.style.transition = 'none';
    L.el.style.opacity = '0';
  }

  var lastHeightCheck = 0;

  function step(now) {
    if (!active) return;
    if (lastTime === null) lastTime = now;
    if (startTimestamp === null) startTimestamp = now;
    var dt = Math.min((now - lastTime) / 1000, 0.05); // seconds, clamp for tab-switch jumps
    lastTime = now;

    // Ease the coupling in over SPIN_UP_DURATION so motion doesn't snap to
    // full speed the instant the button is pressed.
    var spinT = Math.min((now - startTimestamp) / SPIN_UP_DURATION, 1);
    var ramp = easeInOutCubic(spinT);
    var dtau = dt * TIME_SCALE * ramp; // geometrized proper-time step

    for (var i = 0; i < letters.length; i++) {
      var L = letters[i];
      if (L.captured) continue;

      if (L.r <= RS) {
        captureLetter(L);
        continue;
      }

      var r = L.r;
      var r2 = r * r;
      var r3 = r2 * r;
      var r4 = r3 * r;
      var ell2 = L.ell * L.ell;

      // d^2r/dtau^2 = ell^2/r^3 - rs/(2r^2) - (3/2) rs ell^2 / r^4
      var rAccel = ell2 / r3 - RS / (2 * r2) - (1.5 * RS * ell2) / r4;

      L.vr += rAccel * dtau;
      L.r += L.vr * dtau;
      L.phi += (L.ell / r2) * dtau;

      if (L.r <= RS) {
        captureLetter(L);
        continue;
      }

      L.x = center.x + L.r * Math.cos(L.phi);
      L.y = center.y + L.r * Math.sin(L.phi);
      L.el.style.transform = 'translate(' + L.x + 'px, ' + L.y + 'px) translate(-50%, -50%)';
    }

    // Throttle the (layout-forcing) document-height check heavily instead
    // of doing it every frame — this was the main source of jank.
    if (now - lastHeightCheck > HEIGHT_RECHECK_MS) {
      lastHeightCheck = now;
      var h = pageHeight();
      if (overlay && parseFloat(overlay.style.height) < h) {
        overlay.style.height = h + 'px';
      }
    }

    rafId = requestAnimationFrame(step);
  }

  function smoothReset() {
    if (!active || resetting) return;
    resetting = true;
    if (rafId) cancelAnimationFrame(rafId);

    var startPositions = letters.map(function (L) { return { x: L.x, y: L.y }; });
    var tweenStart = null;

    function tween(now) {
      if (tweenStart === null) tweenStart = now;
      var t = Math.min((now - tweenStart) / RESET_DURATION, 1);
      var eased = easeInOutCubic(t);

      for (var i = 0; i < letters.length; i++) {
        var L = letters[i];
        var sx = startPositions[i].x;
        var sy = startPositions[i].y;
        var nx = sx + (L.origX - sx) * eased;
        var ny = sy + (L.origY - sy) * eased;
        L.el.style.transform = 'translate(' + nx + 'px, ' + ny + 'px) translate(-50%, -50%)';
        if (L.captured) {
          L.el.style.transition = 'opacity ' + RESET_DURATION + 'ms ease';
          L.el.style.opacity = String(eased);
        }
      }

      if (blackHole) {
        blackHole.style.transition = 'none';
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
