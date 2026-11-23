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
    <h1 id="hero-title">Siddhant Solanki</h1>
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
  <div class="research-figures" id="research-figures">
    <figure>
      <a href="{{ '/assets/plots/frb_damping/wave-energy-volume.webp' | relative_url }}" aria-label="Enlarge the three snapshots of a fast magnetosonic pulse"><img src="{{ '/assets/plots/frb_damping/wave-energy-volume.webp' | relative_url }}" alt="Three successive views of wave energy. The front of the pulse moves to the right while the trailing wavefronts break up." width="1439" height="1188" loading="lazy"></a>
      <figcaption>
        <h3>How a radio pulse loses energy near a magnetar</h3>
        <p>Read the snapshots from top to bottom. The front of the pulse keeps moving to the right, while its tail transfers energy to Alfvén waves. The colors trace the electromagnetic energy in the waves.</p>
        <p><a href="https://arxiv.org/pdf/2606.19448#page=4">Solanki, Mahlmann, Philippov &amp; Beloborodov (2026), Fig. 1</a> · Left column · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
      </figcaption>
    </figure>
    <figure>
      <a href="{{ '/assets/plots/m87_flares/emission-region.webp' | relative_url }}" aria-label="Enlarge the rendering of the flare emission region around M87*"><img src="{{ '/assets/plots/m87_flares/emission-region.webp' | relative_url }}" alt="Purple and cyan magnetic field lines curve through a red and yellow emission region near M87*." width="1464" height="1404" loading="lazy"></a>
      <figcaption>
        <h3>Where gamma rays originate near M87*</h3>
        <p>The red and yellow region shows where the simulation produces very-high-energy gamma rays during a magnetic eruption. Purple field lines point toward the black hole and cyan lines point away.</p>
        <p><a href="https://iopscience.iop.org/article/10.3847/1538-4357/adcba9/pdf#page=7">Solanki, Davelaar, Ripperda &amp; Philippov (2025), Fig. 4</a> · Cropped · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
      </figcaption>
    </figure>
  </div>
</section>
<section class="section selected-section container" aria-labelledby="selected-title">
  <div class="section-heading"><div><p class="eyebrow">02 / Selected work</p><h2 id="selected-title">Recent publications</h2></div><a class="text-link" href="{{ '/publications/' | relative_url }}">All publications <span aria-hidden="true">↗</span></a></div>
  <div class="publication-list">{% assign selected = site.publications | where: 'featured', true | sort: 'date' | reverse %}{% for post in selected %}{% include publication-row.html summary=true %}{% endfor %}</div>
</section>
<section class="about-section section container" aria-labelledby="about-title">
  <div><p class="eyebrow">03 / Background</p><h2 id="about-title">A little about me</h2><a class="text-link" href="{{ '/cv/' | relative_url }}">Full academic CV <span aria-hidden="true">↗</span></a></div>
  <div class="about-copy"><p>I’m a graduate student in Stanford’s Physics Department, working in plasma and high-energy astrophysics. I grew up in India and earned my bachelor’s in Physics at UC Santa Barbara, followed by a master’s in Astronomy at the University of Maryland. I transferred to Stanford in 2026 to continue my PhD.</p><p>I also enjoy teaching and mentorship. If you’re an undergraduate considering graduate school in physics or astronomy, I’m happy to talk.</p></div>
</section>
