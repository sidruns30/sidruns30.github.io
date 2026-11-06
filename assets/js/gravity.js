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
  var sources = [];
  var controlsHome = null;
  var status = null;
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

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function announce(message) {
    if (status) status.textContent = message;
  }

  function makeControls() {
    if (document.getElementById('gravity-controls')) return;
    var wrap = document.createElement('div');
    wrap.id = 'gravity-controls';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Interactive black hole');

    controlsHome = document.getElementById('gravity-controls-anchor');
    if (!controlsHome) wrap.classList.add('gravity-controls--floating');

    var sliders = document.createElement('div');
    sliders.id = 'gravity-sliders';
    sliders.hidden = true;

    var massRow = makeSliderRow('Mass', 'M', 5, 40, 1, MASS, function (v) {
      MASS = v;
      updateBlackHoleGeometry();
    }, 'linear-gradient(to right, #000000, #380157, #174c8d, #0e8474, #69b031, #e7c56d, #ffffff)');
    var spinRow = makeSliderRow('Spin', 'a', -0.99, 0.99, 0.01, SPIN, function (v) {
      SPIN = v;
      updateBlackHoleGeometry();
    }, 'linear-gradient(to right, #94f1f3, #1b95e0, #364070, #000000, #682c2c, #c76e17, #f5de45)');

    sliders.appendChild(massRow.row);
    sliders.appendChild(spinRow.row);

    var help = document.createElement('p');
    help.id = 'gravity-instructions';
    help.className = 'gravity-help';
    help.textContent = 'Drag the black hole, or focus it and use the arrow keys. Press Esc to restore the page.';
    sliders.appendChild(help);
    wrap.appendChild(sliders);

    var buttonRow = document.createElement('div');
    buttonRow.className = 'gravity-buttons';

    var btn = document.createElement('button');
    btn.id = 'gravity-button';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'I love black holes. Start the interactive black hole.');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'gravity-sliders');
    btn.appendChild(document.createTextNode('I '));
    var heart = document.createElement('span');
    heart.textContent = '\u2665\uFE0E';
    heart.className = 'gravity-heart';
    heart.setAttribute('aria-hidden', 'true');
    btn.appendChild(heart);
    btn.appendChild(document.createTextNode(' Black Holes'));
    btn.addEventListener('click', startGravity);

    var reset = document.createElement('button');
    reset.id = 'gravity-reset-button';
    reset.type = 'button';
    reset.textContent = 'Return to Normalcy';
    reset.hidden = true;
    reset.addEventListener('click', smoothReset);

    buttonRow.appendChild(btn);
    buttonRow.appendChild(reset);
    wrap.appendChild(buttonRow);
    (controlsHome || document.body).appendChild(wrap);

    status = document.createElement('div');
    status.id = 'gravity-status';
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    // Keep announcements out of the layout even on pages without the site CSS.
    status.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;';
    document.body.appendChild(status);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && active) {
        event.preventDefault();
        if (resetting) finishReset();
        else smoothReset();
      }
    });
    window.addEventListener('resize', function () {
      // Original character positions become invalid when the page reflows.
      if (active) finishReset('Page restored after the window was resized.');
    });
    window.addEventListener('pagehide', function () {
      if (active) finishReset();
    });
  }

  function makeSliderRow(labelText, symbol, min, max, step, initial, onChange, trackGradient) {
    var row = document.createElement('label');
    row.className = 'gravity-slider-row';

    var text = document.createElement('span');
    text.className = 'gravity-slider-label';

    var labelSpan = document.createElement('span');
    labelSpan.textContent = labelText + ' ';

    var symbolSpan = document.createElement('span');
    symbolSpan.textContent = symbol;
    symbolSpan.className = 'gravity-slider-symbol';
    symbolSpan.setAttribute('aria-hidden', 'true');

    var valueSpan = document.createElement('span');
    valueSpan.className = 'gravity-slider-value';
    valueSpan.textContent = ' = ' + initial;
    valueSpan.setAttribute('aria-hidden', 'true');

    text.appendChild(labelSpan);
    text.appendChild(symbolSpan);
    text.appendChild(valueSpan);

    var input = document.createElement('input');
    input.type = 'range';
    input.id = 'gravity-' + labelText.toLowerCase();
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    input.setAttribute('aria-label', labelText);
    if (trackGradient) {
      input.style.setProperty('--track-gradient', trackGradient);
      input.className = 'gravity-slider-styled';
    }

    input.addEventListener('input', function () {
      var v = parseFloat(input.value);
      valueSpan.textContent = ' = ' + v;
      onChange(v);
    });

    row.appendChild(text);
    row.appendChild(input);
    return { row: row, input: input };
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
    var hole = document.createElement('button');
    hole.id = 'gravity-blackhole';
    hole.type = 'button';
    hole.setAttribute('aria-label', 'Black hole. Use arrow keys to move it; hold Shift for larger steps.');
    hole.setAttribute('aria-describedby', 'gravity-instructions');
    hole.style.padding = '0';
    hole.style.border = '0';
    hole.style.touchAction = 'none';
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
    hole.addEventListener('pointerdown', function (event) {
      if (resetting || !event.isPrimary || event.button !== 0) return;
      dragging = true;
      hole.setPointerCapture(event.pointerId);
      hole.style.cursor = 'grabbing';
      hole.style.transition = 'width 0.3s ease, height 0.3s ease';
      event.preventDefault();
    });

    hole.addEventListener('pointermove', function (event) {
      if (!dragging || resetting || !center) return;
      center.x = event.pageX;
      center.y = event.pageY;
      updateBlackHoleGeometry();
    });

    function endDrag() {
      dragging = false;
      hole.style.cursor = 'grab';
    }
    hole.addEventListener('pointerup', endDrag);
    hole.addEventListener('pointercancel', endDrag);
    hole.addEventListener('lostpointercapture', endDrag);
    hole.addEventListener('keydown', function (event) {
      if (resetting || !center) return;
      var directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      var direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      var distance = event.shiftKey ? 60 : 20;
      var radius = horizonRadius();
      center.x = Math.max(window.scrollX + radius, Math.min(window.scrollX + window.innerWidth - radius, center.x + direction[0] * distance));
      center.y = Math.max(window.scrollY + radius, Math.min(window.scrollY + window.innerHeight - radius, center.y + direction[1] * distance));
      updateBlackHoleGeometry();
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
    var excluded = '#gravity-overlay, #gravity-controls, #gravity-status, .masthead, .sr-only, .visually-hidden, script, style, noscript, textarea, iframe, svg, canvas, button, input, select, option, [role="button"], [hidden], [inert], [aria-hidden="true"], [contenteditable="true"]';
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (!parent || parent.closest(excluded)) return NodeFilter.FILTER_REJECT;
        var style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility !== 'visible' || parseFloat(style.opacity) === 0) return NodeFilter.FILTER_REJECT;
        // Opacity is not inherited, so an invisible ancestor needs its own check.
        for (var ancestor = parent.parentElement; ancestor; ancestor = ancestor.parentElement) {
          if (parseFloat(window.getComputedStyle(ancestor).opacity) === 0) return NodeFilter.FILTER_REJECT;
        }
        var rect = parent.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) results.push(node);
    return results;
  }

  function hideAnimatedText(node, selected) {
    if (!selected.length || !node.parentNode) return;
    var wrapper = document.createElement('span');
    wrapper.className = 'gravity-source-wrapper';
    var cursor = 0;
    for (var i = 0; i < selected.length; i++) {
      var start = selected[i];
      var end = start + 1;
      while (i + 1 < selected.length && selected[i + 1] === end) {
        end++;
        i++;
      }
      if (start > cursor) wrapper.appendChild(document.createTextNode(node.nodeValue.slice(cursor, start)));
      var hiddenText = document.createElement('span');
      hiddenText.className = 'gravity-source';
      hiddenText.textContent = node.nodeValue.slice(start, end);
      wrapper.appendChild(hiddenText);
      cursor = end;
    }
    if (cursor < node.nodeValue.length) wrapper.appendChild(document.createTextNode(node.nodeValue.slice(cursor)));
    node.parentNode.replaceChild(wrapper, node);
    sources.push({ original: node, wrapper: wrapper });
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
    if (active || resetting) return;
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
    var selectedNodes = [];
    outer:
    for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      var text = node.nodeValue;
      var parentStyle = window.getComputedStyle(node.parentElement);
      var selected = [];
      selectedNodes.push({ node: node, selected: selected });

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
        if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) continue;
        selected.push(c);

        var span = document.createElement('span');
        span.textContent = ch;
        span.setAttribute('aria-hidden', 'true');
        span.className = 'gravity-letter';
        span.style.position = 'absolute';
        span.style.left = '0';
        span.style.top = '0';
        span.style.willChange = 'transform';
        span.style.fontFamily = parentStyle.fontFamily;
        span.style.fontSize = parentStyle.fontSize;
        span.style.fontWeight = parentStyle.fontWeight;
        span.style.fontStyle = parentStyle.fontStyle;
        span.style.textTransform = parentStyle.textTransform;
        span.style.lineHeight = parentStyle.lineHeight;
        span.style.setProperty('color', parentStyle.color, 'important');
        span.style.opacity = '0';
        span.style.transition = 'opacity ' + SPIN_UP_DURATION + 'ms ease';
        overlay.appendChild(span);

        var x0 = rect.left + rect.width / 2 + window.scrollX;
        var y0 = rect.top + rect.height / 2 + window.scrollY;
        span.style.transform = 'translate(' + x0 + 'px, ' + y0 + 'px) translate(-50%, -50%)';
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

    selectedNodes.forEach(function (entry) {
      hideAnimatedText(entry.node, entry.selected);
    });
    document.body.classList.add('gravity-mode');
    document.body.appendChild(document.getElementById('gravity-controls'));
    var startButton = document.getElementById('gravity-button');
    startButton.hidden = true;
    startButton.setAttribute('aria-expanded', 'true');
    var resetButton = document.getElementById('gravity-reset-button');
    resetButton.hidden = false;
    resetButton.disabled = false;
    document.getElementById('gravity-sliders').hidden = false;
    resetButton.focus({ preventScroll: true });
    announce('Black hole mode is active. Adjust mass and spin, drag the black hole, or press Escape to restore the page.');
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

      if (!isFinite(newR) || !isFinite(newPhi) || newR <= rHorizon) {
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
    dragging = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (reducedMotion()) {
      finishReset();
      return;
    }
    document.getElementById('gravity-reset-button').disabled = true;
    announce('Restoring the page. Press Escape again to finish immediately.');

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
        rafId = requestAnimationFrame(tween);
      } else {
        finishReset();
      }
    }

    rafId = requestAnimationFrame(tween);
  }

  function finishReset(message) {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    active = false;
    resetting = false;
    dragging = false;
    document.body.classList.remove('gravity-mode');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    sources.forEach(function (source) {
      if (source.wrapper.parentNode) source.wrapper.parentNode.replaceChild(source.original, source.wrapper);
    });
    sources = [];
    overlay = null;
    blackHole = null;
    center = null;
    letters = [];
    var controls = document.getElementById('gravity-controls');
    if (controlsHome) controlsHome.appendChild(controls);
    var startButton = document.getElementById('gravity-button');
    startButton.hidden = false;
    startButton.setAttribute('aria-expanded', 'false');
    var resetButton = document.getElementById('gravity-reset-button');
    resetButton.hidden = true;
    resetButton.disabled = false;
    document.getElementById('gravity-sliders').hidden = true;
    startButton.focus({ preventScroll: true });
    announce(message || 'The page has been restored.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeControls);
  } else {
    makeControls();
  }
})();
