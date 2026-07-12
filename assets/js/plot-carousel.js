/* ==========================================================================
   PLOT CAROUSEL (home page only)
   Cycles through plots pulled from Siddhant's papers, fading one into the
   next, with a caption underneath. The image list comes from
   window.PLOT_MANIFEST, generated at build time from everything found in
   /assets/plots/ — drop a new image in there (and optionally a caption in
   _data/plot_captions.yml) and it's automatically included next time the
   site rebuilds, no code changes needed.
   ========================================================================== */

(function () {
  var DISPLAY_MS = 5000;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function init() {
    var manifest = (window.PLOT_MANIFEST || []).filter(function (p) {
      return p && p.src && p.src.trim().length;
    });
    if (!manifest.length) return;

    manifest = shuffle(manifest);

    var container = document.createElement('div');
    container.id = 'plot-carousel';

    var frame = document.createElement('div');
    frame.className = 'plot-carousel__frame';

    var imgA = document.createElement('img');
    var imgB = document.createElement('img');
    imgA.className = 'plot-carousel__img active';
    imgB.className = 'plot-carousel__img';
    frame.appendChild(imgA);
    frame.appendChild(imgB);

    var caption = document.createElement('div');
    caption.className = 'plot-carousel__caption';

    container.appendChild(frame);
    container.appendChild(caption);
    document.body.appendChild(container);

    var index = 0;
    var current = imgA;
    var next = imgB;

    function showIndex(i) {
      next.style.transition = 'none';
      next.src = manifest[i].src;
      // Force a reflow so the browser registers the src change before we
      // re-enable the transition and swap active classes.
      void next.offsetWidth;
      next.style.transition = '';
      current.classList.remove('active');
      next.classList.add('active');
      caption.textContent = manifest[i].caption || '';
      var tmp = current;
      current = next;
      next = tmp;
    }

    current.src = manifest[0].src;
    caption.textContent = manifest[0].caption || '';

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
