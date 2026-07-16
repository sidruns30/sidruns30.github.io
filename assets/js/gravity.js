/* ==========================================================================
   GRAVITY MODE
   "Turn on Gravity" — turns every character of visible page text into a
   small orbiting body around a central spinning (Kerr) black hole.

   Physics: each letter is a test mass on an equatorial Kerr geodesic —
   the general-relativistic orbit around a ROTATING black hole of mass M
   and spin parameter a (dimensionless, -1 < a < 1; negative means the
   hole spins opposite to the letters' orbital direction — "retrograde").
   Using geometrized units (G = c = 1):

       Delta(r) = r^2 - 2Mr + a^2
       R(r) = [E(r^2+a^2) - a*L]^2 - Delta(r) * [r^2 + (L - a*E)^2]
       (dr/dtau)^2 = R(r) / r^4                     (equatorial motion)
       dphi/dtau = [(L - a*E) + (a/Delta)*(E(r^2+a^2) - a*L)] / r^2

   E and L are the conserved specific energy and angular momentum of each
   letter's geodesic, fixed at the moment gravity is switched on so that
   the initial kick is purely tangential (dr/dtau = 0 initially). d^2r/dtau^2
   is obtained from a small centered numerical derivative of R(r)/r^4 —
   the same trick as the non-spinning case, just applied numerically
   since the Kerr expression doesn't reduce to Schwarzschild's clean
   effective-potential form.

   The event horizon sits at r+ = M + sqrt(M^2 - a^2) — not simply 2M once
   the hole is spinning — and that's what sets the visual black hole size
   and the actual capture radius.

   Everything is simulated and rendered in PAGE (document) coordinates, not
   viewport coordinates, so scrolling is a pure Galilean shift of the
   viewing frame.
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

  // Mutable physics parameters, live-controlled by the sliders.
  var MASS = 12;                  // px, black hole mass M
  var SPIN = -0.99;               // dimensionless spin a* = a/M, -1..1

  var MAX_LETTERS = 2200;         // performance cap on very content-heavy pages
  var VELOCITY_SCALE = 1.0;       // tangential kick strength
  var TIME_SCALE = 320;           // converts real seconds -> geometrized proper-time units
  var SPIN_UP_DURATION = 2000;    // ms, eased ramp-in so the handoff isn't abrupt
  var RESET_DURATION = 3200;      // ms, smooth-return tween length
  var HEIGHT_RECHECK_MS = 2000;   // throttle for expensive document-height reads
  var H_DERIV = 0.05;             // px, step size for the numerical dR/dr derivative

  function horizonRadius() {
    var a = SPIN * MASS;
    var disc = Math.max(MASS * MASS - a * a, 0);
    return MASS + Math.sqrt(disc);
  }

  function makeControls() {
    var wrap = document.createElement('div');
    wrap.id = 'gravity-controls';
    wrap.style.position = 'fixed';
    wrap.style.bottom = '1.25rem';
    wrap.style.right = '1.25rem';
    wrap.style.zIndex = '100000';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'flex-end';
    wrap.style.gap = '0.5rem';
    wrap.style.fontFamily = "'Inter', sans-serif";

    var sliders = document.createElement('div');
    sliders.id = 'gravity-sliders';
    sliders.style.display = 'none';
    sliders.style.background = 'rgba(255,255,255,0.92)';
    sliders.style.border = '1px solid rgba(0,0,0,0.15)';
    sliders.style.borderRadius = '10px';
    sliders.style.padding = '0.6rem 0.8rem';
    sliders.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
    sliders.style.minWidth = '190px';
    sliders.style.fontSize = '0.75rem';
    sliders.style.color = '#111';

    var massRow = makeSliderRow('Mass (M)', 5, 40, 1, MASS, function (v) {
      MASS = v;
      updateBlackHoleGeometry();
    });
    var spinRow = makeSliderRow('Spin (a)', -0.99, 0.99, 0.01, SPIN, function (v) {
      SPIN = v;
      updateBlackHoleGeometry();
    });

    sliders.appendChild(massRow.row);
    sliders.appendChild(spinRow.row);
    wrap.appendChild(sliders);

    var buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = '0.5rem';

    var btn = document.createElement('button');
    btn.id = 'gravity-button';
    btn.type = 'button';
    btn.appendChild(document.createTextNode('I '));
    var heart = document.createElement('span');
    heart.textContent = '\u2665\uFE0E';
    heart.style.color = '#e63946';
    btn.appendChild(heart);
    btn.appendChild(document.createTextNode(' Black Holes'));
    styleButton(btn, '#111');
    btn.addEventListener('click', function () {
      if (!active) startGravity();
    });

    var reset = document.createElement('button');
    reset.id = 'gravity-reset-button';
    reset.type = 'button';
    reset.textContent = 'Return to Normalcy';
    styleButton(reset, '#7a1f1f');
    reset.style.display = 'none';
    reset.addEventListener('click', smoothReset);

    buttonRow.appendChild(btn);
    buttonRow.appendChild(reset);
    wrap.appendChild(buttonRow);

    document.body.appendChild(wrap);
  }

  function makeSliderRow(label, min, max, step, initial, onChange) {
    var row = document.createElement('label');
    row.style.display = 'block';
    row.style.marginBottom = '0.3rem';

    var text = document.createElement('div');
    text.textContent = label + ': ' + initial;
    text.style.marginBottom = '0.15rem';

    var input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    input.style.width = '100%';

    input.addEventListener('input', function () {
      var v = parseFloat(input.value);
      text.textContent = label + ': ' + v;
      onChange(v);
    });

    row.appendChild(text);
    row.appendChild(input);
    return { row: row, input: input };
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
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = pageHeight() + 'px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '99999';
    el.style.overflow = 'visible';
    el.style.contain = 'layout style paint';
    document.body.appendChild(el);
    return el;
  }

  function makeBlackHole(cx, cy) {
    var radius = horizonRadius();
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
    hole.style.pointerEvents = 'auto';
    hole.style.cursor = 'grab';
    hole.style.opacity = '0';
    hole.style.transition = 'opacity ' + SPIN_UP_DURATION + 'ms ease, width 0.3s ease, height 0.3s ease';
    attachDragHandlers(hole);
    return hole;
  }

  var dragging = false;

  function attachDragHandlers(hole) {
    hole.addEventListener('mousedown', function (e) {
      dragging = true;
      hole.style.cursor = 'grabbing';
      hole.style.transition = 'width 0.3s ease, height 0.3s ease'; // no opacity/position lag while dragging
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging || !center) return;
      center.x = e.pageX;
      center.y = e.pageY;
      updateBlackHoleGeometry();
    });

    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      hole.style.cursor = 'grab';
    });
  }

  // Called whenever a slider changes, so the visible horizon tracks the
  // current M/a live, even mid-simulation.
  function updateBlackHoleGeometry() {
    if (!blackHole || !center) return;
    var radius = horizonRadius();
    blackHole.style.left = (center.x - radius) + 'px';
    blackHole.style.top = (center.y - radius) + 'px';
    blackHole.style.width = radius * 2 + 'px';
    blackHole.style.height = radius * 2 + 'px';
  }

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

  // R(r)/r^4 from the Kerr equatorial radial equation, for given E, L and
  // the CURRENT mass/spin (so live slider changes affect motion immediately).
  function radialF(r, E, L) {
    var a = SPIN * MASS;
    var delta = r * r - 2 * MASS * r + a * a;
    var term1 = E * (r * r + a * a) - a * L;
    var term2 = r * r + (L - a * E) * (L - a * E);
    var R = term1 * term1 - delta * term2;
    return R / (r * r * r * r);
  }

  // Solve for the energy E that makes R(r0) = 0 (a turning point), given a
  // chosen angular momentum L, so the initial kick is purely tangential.
  function solveEnergyForCircularish(r0, L) {
    var a = SPIN * MASS;
    var delta0 = r0 * r0 - 2 * MASS * r0 + a * a;
    var A = r0 * r0 + a * a;
    var B = a * L;

    var aCoef = A * A - delta0 * a * a;
    var bCoef = 2 * a * L * (delta0 - A);
    var cCoef = a * a * L * L - delta0 * (r0 * r0 + L * L);

    var disc = bCoef * bCoef - 4 * aCoef * cCoef;
    if (disc < 0 || Math.abs(aCoef) < 1e-9) return 1; // fallback: nearly-bound energy

    var sq = Math.sqrt(disc);
    var e1 = (-bCoef + sq) / (2 * aCoef);
    var e2 = (-bCoef - sq) / (2 * aCoef);

    // Prefer the positive root closest to 1 (a "bound-ish" orbit).
    var candidates = [e1, e2].filter(function (e) { return e > 0 && isFinite(e); });
    if (!candidates.length) return 1;
    candidates.sort(function (x, y) { return Math.abs(x - 1) - Math.abs(y - 1); });
    return candidates[0];
  }

  function startGravity() {
    var textNodes = collectTextNodes();

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

        var x0 = rect.left + rect.width / 2 + window.scrollX;
        var y0 = rect.top + rect.height / 2 + window.scrollY;
        var rx = x0 - center.x;
        var ry = y0 - center.y;
        var r0 = Math.sqrt(rx * rx + ry * ry) || 1;

        var speedFactor = 0.5 + Math.random() * 0.9;
        var vTangential = Math.sqrt(MASS / r0) * speedFactor * VELOCITY_SCALE;
        var L = r0 * vTangential; // all letters share the same swirl sense
        var E = solveEnergyForCircularish(r0, L);

        letters.push({
          el: span,
          x: x0,
          y: y0,
          vr: 0,
          E: E,
          L: L,
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
    document.getElementById('gravity-sliders').style.display = 'block';
    active = true;
    lastTime = null;
    startTimestamp = null;
    lastHeightCheck = 0;
    rafId = requestAnimationFrame(step);

    requestAnimationFrame(function () {
      for (var i = 0; i < letters.length; i++) letters[i].el.style.opacity = '1';
      if (blackHole) blackHole.style.opacity = '1';
    });
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function captureLetter(L) {
    L.captured = true;
    L.el.style.transition = 'none';
    L.el.style.opacity = '0';
  }

  var lastHeightCheck = 0;

  function step(now) {
    if (!active) return;
    if (lastTime === null) lastTime = now;
    if (startTimestamp === null) startTimestamp = now;
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    var spinT = Math.min((now - startTimestamp) / SPIN_UP_DURATION, 1);
    var ramp = easeInOutCubic(spinT);
    var dtau = dt * TIME_SCALE * ramp;

    var rHorizon = horizonRadius();
    var a = SPIN * MASS;

    for (var i = 0; i < letters.length; i++) {
      var Lt = letters[i];
      if (Lt.captured) continue;

      // Derive r, phi fresh from the letter's actual page position and the
      // CURRENT (possibly just-dragged) center. This is what keeps a drag
      // from rigidly translating every letter: their real x/y is the
      // source of truth, not a center-relative coordinate.
      var rx = Lt.x - center.x;
      var ry = Lt.y - center.y;
      var r = Math.sqrt(rx * rx + ry * ry);
      var phi = Math.atan2(ry, rx);

      if (r <= rHorizon) {
        captureLetter(Lt);
        continue;
      }

      // Numerical d^2r/dtau^2 = (1/2) d/dr [R(r)/r^4], via centered difference.
      var fPlus = radialF(r + H_DERIV, Lt.E, Lt.L);
      var fMinus = radialF(r - H_DERIV, Lt.E, Lt.L);
      var rAccel = (fPlus - fMinus) / (4 * H_DERIV);

      var delta = r * r - 2 * MASS * r + a * a;
      var dphidtau;
      if (delta > 1e-6) {
        dphidtau = ((Lt.L - a * Lt.E) + (a / delta) * (Lt.E * (r * r + a * a) - a * Lt.L)) / (r * r);
      } else {
        dphidtau = 0; // guarded by the horizon check above; shouldn't normally hit
      }

      Lt.vr += rAccel * dtau;
      var newR = r + Lt.vr * dtau;
      var newPhi = phi + dphidtau * dtau;

      if (newR <= rHorizon) {
        captureLetter(Lt);
        continue;
      }

      Lt.x = center.x + newR * Math.cos(newPhi);
      Lt.y = center.y + newR * Math.sin(newPhi);
      Lt.el.style.transform = 'translate(' + Lt.x + 'px, ' + Lt.y + 'px) translate(-50%, -50%)';
    }

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
    document.getElementById('gravity-sliders').style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeControls);
  } else {
    makeControls();
  }
})();
