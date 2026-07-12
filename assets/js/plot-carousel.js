/* ==========================================================================
   PLOT CAROUSEL
   Cycles through plots pulled from Siddhant's papers, fading one into the
   next in the panel on the right. The image list comes from
   window.PLOT_MANIFEST, generated at build time from everything found in
   /assets/plots/ — drop a new image in there and it's automatically
   included next time the site rebuilds, no code changes needed.
   ========================================================================== */

(function () {
  var FADE_MS = 1800;
  var DISPLAY_MS = 5000;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function init() {
    var manifest = window.PLOT_MANIFEST || [];
    manifest = manifest.filter(function (p) { return p && p.trim().length; });
    if (!manifest.length) return;

    manifest = shuffle(manifest);

    var container = document.createElement('div');
    container.id = 'plot-carousel';

    var imgA = document.createElement('img');
    var imgB = document.createElement('img');
    imgA.className = 'plot-carousel__img active';
    imgB.className = 'plot-carousel__img';

    container.appendChild(imgA);
    container.appendChild(imgB);
    document.body.appendChild(container);

    var index = 0;
    var current = imgA;
    var next = imgB;

    function showIndex(i) {
      next.style.transition = 'none';
      next.src = manifest[i];
      // Force a reflow so the browser registers the src change before we
      // re-enable the transition and swap active classes.
      void next.offsetWidth;
      next.style.transition = '';
      current.classList.remove('active');
      next.classList.add('active');
      var tmp = current;
      current = next;
      next = tmp;
    }

    current.src = manifest[0];

    if (manifest.length > 1) {
      setInterval(function () {
        index = (index + 1) % manifest.length;
        showIndex(index);
      }, DISPLAY_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
