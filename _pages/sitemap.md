---
layout: academic
title: "Sitemap"
permalink: /sitemap/
---
<div class="container page-content simple-page"><h1>Sitemap</h1><ul><li><a href="{{ '/' | relative_url }}">Home &amp; research</a></li><li><a href="{{ '/publications/' | relative_url }}">Publications</a></li><li><a href="{{ '/cv/' | relative_url }}">Curriculum vitae</a></li></ul><h2>Publication details</h2><ul>{% assign publications = site.publications | sort: 'date' | reverse %}{% for post in publications %}<li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>{% endfor %}</ul></div>
