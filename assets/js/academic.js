(function () {
  'use strict';
  var tools = document.querySelector('.publication-tools');
  if (!tools) return;
  var search = document.getElementById('publication-search');
  var buttons = Array.from(tools.querySelectorAll('[data-filter]'));
  var papers = Array.from(document.querySelectorAll('[data-publication]'));
  var count = document.querySelector('.results-count');
  var empty = document.querySelector('.empty-results');
  var filter = 'all';
  function update() {
    var terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var shown = 0;
    papers.forEach(function (paper) {
      var matches = (filter === 'all' || paper.dataset.status === filter) && terms.every(function (term) { return paper.dataset.search.includes(term); });
      paper.hidden = !matches;
      if (matches) shown++;
    });
    count.textContent = shown + ' of ' + papers.length + ' publications';
    empty.hidden = shown > 0;
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      filter = button.dataset.filter;
      buttons.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      update();
    });
  });
  search.addEventListener('input', update);
  tools.hidden = false;
  count.hidden = false;
  update();
}());
