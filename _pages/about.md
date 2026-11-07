---
layout: academic
permalink: /
title: "Plasma astrophysics at Stanford"
description: "Siddhant Solanki is a Physics PhD student at Stanford University studying plasma astrophysics with theory and large-scale kinetic and fluid simulations."
redirect_from:
  - /about/
  - /about.html
---
<section class="hero container" aria-labelledby="hero-title">
  <div class="hero-copy">
    <p class="eyebrow"><span class="small-rule"></span> Plasma astrophysics · Stanford University</p>
    <h1 id="hero-title">Siddhant<br> Solanki<span class="name-period">.</span></h1>
    <p class="hero-role">PhD student in Physics</p>
    <p class="hero-description">Studying relativistic magnetized plasmas in space.</p>
    <p class="hero-detail">I use theory and large-scale simulations to study waves, turbulence, and energy release around neutron stars and black holes.</p>
    <div class="button-group"><a class="button button-primary" href="#research">Explore my research <span aria-hidden="true">↗</span></a><a class="button button-text" href="{{ '/files/Siddhant_Solanki_CV.pdf' | relative_url }}">Download CV <span aria-hidden="true">↓</span></a></div>
  </div>
  <figure class="portrait-block">
    <div class="portrait-frame"><img src="{{ '/images/profile.png' | relative_url }}" alt="Portrait of Siddhant Solanki" width="800" height="800" fetchpriority="high"></div>
    <figcaption><span>Department of Physics</span><span>Stanford, California <span aria-hidden="true">↗</span></span></figcaption>
  </figure>
</section>
<section class="research-section section container" id="research" aria-labelledby="research-title">
  <div class="section-heading"><div><p class="eyebrow">01 / Research</p><h2 id="research-title">Relativistic Plasmas</h2></div></div>
  <div class="research-grid">
    <article class="research-card"><span class="research-number">01</span><h3>Magnetars &amp;<br> plasma waves</h3><p>Wave propagation, nonlinear decay, and turbulence in strongly magnetized plasmas, with applications to fast radio bursts and pulsar emission.</p><a href="{{ '/publication/2026-06-17-fms-wave-decay' | relative_url }}">Waves &amp; turbulence <span aria-hidden="true">↗</span></a></article>
    <article class="research-card"><span class="research-number">02</span><h3>Black holes &amp;<br> their environments</h3><p>Multiphase accretion onto Sagittarius A*, magnetic reconnection, and the very high-energy flares and variability of supermassive black holes.</p><a href="{{ '/publication/2025-05-21-m87-flares-lightcurves' | relative_url }}">Reconnection-powered flares <span aria-hidden="true">↗</span></a></article>
    <article class="research-card"><span class="research-number">03</span><h3>Computational<br> astrophysics</h3><p>Particle-in-cell, force-free, and general relativistic magnetohydrodynamic simulations, alongside analytic theory, to understand relativistic plasma.</p><a href="{{ '/publication/2025-11-21-entity-pic-code' | relative_url }}">The Entity PIC code <span aria-hidden="true">↗</span></a></article>
  </div>
  {% if site.data.wave_comparison.ready %}{% include wave-comparison.html %}{% else %}<figure class="simulation-feature"><div class="simulation-copy"><p class="eyebrow">A closer look</p><h3>Theory meets<br> computation.</h3><p>From plasma waves to black hole accretion, I use kinetic and fluid simulations to investigate how energy moves through extreme astrophysical systems.</p><span class="method-list">PIC <span>·</span> Force-free <span>·</span> GRMHD</span></div><div class="simulation-image"><img src="{{ '/images/jdote_homepage.jpg' | relative_url }}" alt="Simulation visualization of J dot E, the rate of energy exchange between electromagnetic fields and plasma" loading="lazy"><figcaption>Simulation snapshot <span>J · E</span></figcaption></div></figure>{% endif %}
</section>
<section class="section selected-section container" aria-labelledby="selected-title">
  <div class="section-heading"><div><p class="eyebrow">02 / Selected work</p><h2 id="selected-title">Recent publications.</h2></div><a class="text-link" href="{{ '/publications/' | relative_url }}">All publications <span aria-hidden="true">↗</span></a></div>
  <div class="publication-list">{% assign selected = site.publications | where: 'featured', true | sort: 'date' | reverse %}{% for post in selected %}{% include publication-row.html summary=true %}{% endfor %}</div>
</section>
<section class="about-section section container" aria-labelledby="about-title">
  <div><p class="eyebrow">03 / Background</p><h2 id="about-title">A little about me.</h2><a class="text-link" href="{{ '/cv/' | relative_url }}">Full academic CV <span aria-hidden="true">↗</span></a></div>
  <div class="about-copy"><p>I’m a graduate student in Stanford’s Physics Department, working in plasma and high-energy astrophysics. I grew up in India and earned my bachelor’s in Physics at UC Santa Barbara, followed by a master’s in Astronomy at the University of Maryland. I transferred to Stanford in 2026 to continue my PhD.</p><p>I also enjoy teaching and mentorship. If you’re an undergraduate considering graduate school in physics or astronomy, I’m happy to talk.</p></div>
</section>
