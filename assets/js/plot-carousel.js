/* ==========================================================================
   PLOT CAROUSEL (home page only)
   Shows several independent plot+caption slots stacked down the right
   edge, each cycling through its own subset of images pulled from
   Siddhant's papers. The image list comes from window.PLOT_MANIFEST,
   generated at build time from everything found in /assets/plots/ — drop
   a new image in there (and optionally a caption in
   _data/plot_captions.yml) and it's automatically included next time the
   site rebuilds, no code changes needed.
   ========================================================================== */

(function () {
  var DISPLAY_MS = 5000;
  var NUM_SLOTS = 2;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function makeSlot(images, staggerMs) {
    var slot = document.createElement('div');
    slot.className = 'plot-carousel__slot';

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

    slot.appendChild(frame);
    slot.appendChild(caption);

    var index = 0;
    var current = imgA;
    var next = imgB;

    function showIndex(i) {
      next.style.transition = 'none';
      next.src = images[i].src;
      void next.offsetWidth; // force reflow before re-enabling the transition
      next.style.transition = '';
      current.classList.remove('active');
      next.classList.add('active');
      caption.textContent = images[i].caption || '';
      var tmp = current;
      current = next;
      next = tmp;
    }

    current.src = images[0].src;
    caption.textContent = images[0].caption || '';

    if (images.length > 1) {
      setTimeout(function () {
        setInterval(function () {
          index = (index + 1) % images.length;
          showIndex(index);
        }, DISPLAY_MS);
      }, staggerMs);
    }

    return slot;
  }

  function init() {
    var manifest = (window.PLOT_MANIFEST || []).filter(function (p) {
      return p && p.src && p.src.trim().length;
    });
    if (!manifest.length) return;

    manifest = shuffle(manifest);

    // Round-robin the shuffled images into NUM_SLOTS independent playlists.
    var slots = [];
    for (var s = 0; s < NUM_SLOTS; s++) slots.push([]);
    for (var i = 0; i < manifest.length; i++) {
      slots[i % NUM_SLOTS].push(manifest[i]);
    }
    slots = slots.filter(function (s) { return s.length > 0; });

    var container = document.createElement('div');
    container.id = 'plot-carousel';

    slots.forEach(function (images, i) {
      container.appendChild(makeSlot(images, i * 900));
    });

    document.body.appendChild(container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
