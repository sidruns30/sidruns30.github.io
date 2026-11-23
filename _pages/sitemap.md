---
layout: academic-page
title: "Sitemap"
permalink: /sitemap/
description: "Browse the research, publications, and other pages on Siddhant Solanki’s website."
---

- [Home and research]({{ '/' | relative_url }})
- [Publications]({{ '/publications/' | relative_url }})
- [Curriculum vitae]({{ '/cv/' | relative_url }})
- [Fun with Physics]({{ '/fun-with-physics/' | relative_url }})
- [Outside of physics]({{ '/misc-things/' | relative_url }})
- [Privacy]({{ '/terms/' | relative_url }})

## Publication details

{% assign publications = site.publications | sort: 'date' | reverse %}{% for post in publications %}- [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}
