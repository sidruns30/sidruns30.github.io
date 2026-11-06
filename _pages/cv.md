---
layout: academic
title: "Curriculum vitae"
permalink: /cv/
description: "Education, publications, awards, teaching, and research experience of Siddhant Solanki, Physics PhD student at Stanford University."
redirect_from:
  - /resume
---
<div class="container page-content">
  <header class="page-heading cv-heading"><div><p class="eyebrow">Academic background</p><h1>Curriculum vitae<span class="name-period">.</span></h1><p>Siddhant Solanki · Physics, Stanford University</p></div><a class="button button-primary" href="{{ '/files/Siddhant_Solanki_CV.pdf' | relative_url }}">Download CV (PDF) <span aria-hidden="true">↓</span></a></header>
  <div class="cv-layout">
    <nav class="cv-nav" aria-label="CV sections"><a href="#education">Education</a><a href="#interests">Research interests</a><a href="#methods">Methods &amp; skills</a><a href="#publications">Publications</a><a href="#awards">Awards</a><a href="#teaching">Teaching &amp; outreach</a><a href="#talks">Talks &amp; visits</a><a href="#schools">Schools &amp; workshops</a><a href="#news">In the news</a></nav>
    <div class="cv-body">
      <section id="education"><h2>Education</h2>
        <div class="education-item"><div><h3>Stanford University</h3><p>PhD in Physics · In progress</p></div><time>June 2026 – Present</time></div>
        <div class="education-item"><div><h3>University of Maryland, College Park</h3><p>PhD studies in Astronomy · Transferred to Stanford</p></div><time>June 2024 – June 2026</time></div>
        <div class="education-item"><div><h3>University of Maryland, College Park</h3><p>MS in Astronomy</p></div><time>Aug 2022 – June 2024</time></div>
        <div class="education-item"><div><h3>University of California, Santa Barbara</h3><p>BS in Physics</p></div><time>Sept 2017 – Dec 2020</time></div>
      </section>
      <section id="interests"><h2>Research interests</h2><p>Waves and instabilities; wave–particle interactions; relativistic plasmas; magnetars and neutron stars; fast radio bursts; black hole magnetospheres.</p></section>
      <section id="methods"><h2>Methods &amp; technical skills</h2><h3>Simulation &amp; theory</h3><p>Particle-in-cell (PIC), force-free, and general relativistic magnetohydrodynamic (GRMHD) simulations; high-performance computing; analytical modeling of complex systems.</p><h3>Computing &amp; visualization</h3><div class="skill-tags"><span>C</span><span>C++</span><span>Python</span><span>OpenMP</span><span>MPI</span><span>Kokkos</span><span>ParaView</span><span>Matplotlib</span><span>Git &amp; GitHub</span></div></section>
      <section id="publications"><h2>Publications</h2><h3>Journal articles</h3><div class="publication-list">{% assign journals = site.publications | where: 'status', 'journal' | sort: 'publication_year' | reverse %}{% for post in journals %}{% include publication-row.html %}{% endfor %}</div><h3>Preprints &amp; submissions</h3><div class="publication-list">{% assign preprints = site.publications | where: 'status', 'preprint' | sort: 'date' | reverse %}{% for post in preprints %}{% include publication-row.html %}{% endfor %}</div></section>
      <section id="awards"><h2>Awards &amp; honors</h2><ul><li><strong>Burgers Symposium Winner, 2025</strong> — Best poster in the College of Mathematical and Natural Sciences.</li><li><strong>John Chi-Lin Wang Award, 2024</strong> — Astronomy Department, University of Maryland.</li><li><strong>Academic High Honors, 2021</strong> — Physics Department, UC Santa Barbara.</li><li><strong>Research High Honors, 2021</strong> — Physics Department, UC Santa Barbara.</li></ul></section>
      <section id="teaching"><h2>Teaching, leadership &amp; outreach</h2><ul><li><strong>DC Tutoring and Mentoring Initiative, 2025–Present</strong> — Mentor in the Listo Program.</li><li><strong>Graduate Student Council, 2023–2024</strong> — Astronomy Department, University of Maryland.</li><li><strong>Cambridge Center for International Research, 2023</strong> — Teaching Assistant.</li><li><strong>Campus Learning and Assistance Services, 2019–2021</strong> — Tutor.</li></ul></section>
      <section id="talks"><h2>Talks &amp; research visits</h2><ul><li><strong>Kavli Institute for Theoretical Physics, UC Santa Barbara, 2025</strong> — Invited Graduate Student Visitor.</li><li><strong>Princeton Plasma Theory Group, 2024</strong> — Invited Seminar Speaker.</li><li><strong>Center for Computational Astrophysics, Flatiron Institute, 2024</strong> — SPA Seminar Speaker.</li><li><strong>Institute for Advanced Study, Princeton, 2024</strong> — Coffee Talk Speaker.</li></ul></section>
      <section id="schools"><h2>Summer schools &amp; workshops</h2><ul><li><strong>SHIELD Plasma Summer School, Boston, 2026</strong> — Participant.</li><li><strong>PLASMA Science Summer School, Porquerolles, France, 2024</strong> — Participant.</li><li><strong>Les Houches Summer School in Plasma Physics, France, 2023</strong> — Participant &amp; Poster Presenter.</li><li><strong>International High Performance Computing Summer School, 2023</strong> — Participant &amp; Poster Presenter.</li></ul></section>
      <section id="news"><h2>In the news</h2><p><a href="https://aasnova.org/2025/06/25/monthly-roundup-the-supermassive-black-hole-of-messier-87/">Monthly Roundup: The Supermassive Black Hole of Messier 87</a><br>AAS Nova · June 2025</p></section>
    </div>
  </div>
</div>
