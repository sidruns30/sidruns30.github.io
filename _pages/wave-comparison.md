---
layout: academic-page
title: "One pulse. Three plasma models."
permalink: /research/wave-comparison/
description: "A strong fast magnetosonic pulse interacting with weak resonant Alfvén waves in MHD, force-free electrodynamics, and kinetic pair plasma."
published: false
---

A strong fast magnetosonic pulse travels through weak Alfvén-wave seeds. The comparison uses **Athena++** for relativistic MHD, **Einstein Toolkit / FFEvolve** for force-free electrodynamics, and **Entity** for particle-in-cell evolution.

The magnetic pulse, seed wavevectors, phases, domain, and physical clock are shared. The MHD case deliberately has greater plasma inertia and pressure, while PIC can develop charge starvation. Each model evolves its own equations.

## Geometry and pulse

The physical domain is the **x–z plane**, with a uniform guide field along **+z** and a pulse traveling along **+x**. All three vector components are evolved; the y direction is invariant. The box spans 5<i>L</i> in x and <i>L</i> in z. Units are <i>c</i> = <i>B</i><sub>0</sub> = <i>L</i> = 1 and 4π = 1.

The magnetic pulse has peak δ<i>B</i>/<i>B</i><sub>0</sub> = **0.3**, carrier wavelength <i>L</i>/14, and a super-Gaussian envelope exp[−((x−x₀)/Δ)⁶], with x₀ = <i>L</i> and Δ = 0.75<i>L</i>. It contains roughly 20 carrier cycles above half amplitude. This follows the long-pulse configuration in [Solanki et al., *Damping of Fast Radio Bursts in the Inner Magnetospheres of Magnetars*](https://arxiv.org/html/2606.19448v1).

This 2D comparison uses periodic boundaries in both directions and a periodically continued pulse. The displayed interval ends before the main packet crosses the x boundary. It is an illustrative production comparison, rather than a reproduction of the paper's 3D calculation with absorbing x boundaries.

## Weak resonant seeds

The background contains **40 counterpropagating Alfvén-wave pairs**, or 80 traveling waves, each with peak magnetic amplitude **0.005<i>B</i><sub>0</sub>**. Their combined RMS magnetic amplitude is approximately 0.0316<i>B</i><sub>0</sub>.

Each pair's wavevectors add to the FMS carrier. The common spectrum includes parallel mode numbers 7, 8, and 9, covering the force-free resonance and the shifted resonances of warm MHD and kinetic plasma. A given pair need not be exactly resonant in all three models: their dispersion relations differ.

## Plasma regimes

The MHD background uses **cold magnetization σ = 5** and **β = 1**, where σ = <i>B</i>₀²/(4πρ<i>c</i>²) and β = 8π<i>p</i>/<i>B</i>₀². With adiabatic index 4/3, the normalized density is 0.2, pressure is 0.5, and enthalpy-based magnetization is approximately 0.455. Its initial pulse follows the finite-amplitude perpendicular relativistic-MHD simple-wave relation.

FFE neglects matter inertia and pressure. Its isolated pulse has <i>E</i><sub>y</sub> = δ<i>B</i><sub>z</sub>. PIC uses the same electromagnetic pulse in a highly magnetized electron–positron plasma, with cold σ = 125 and initial dimensionless temperature 0.1. The electric and velocity fields therefore reflect each model's plasma regime; matching the magnetic pulse does not imply identical electric fields or matter thermodynamics.

For PIC, the input starvation parameter is **ψ<sub>st</sub> = 0.5**, using the paper's definition ψ<sub>st</sub> = <i>E</i><sub>AW,st</sub>/<i>E</i><sub>F0</sub>. At the RMS perpendicular wavenumber of the seed spectrum, the nominal current-capacity threshold is <i>E</i><sub>AW,st</sub> = 0.15<i>B</i><sub>0</sub>. This sets <i>L</i>/<i>d</i><sub>pair</sub> ≈ 225.765. Individual seed wavelengths have nominal thresholds between 0.112 and 0.268<i>B</i><sub>0</sub>, all below the FMS peak. The threshold is an input scale; the particles determine the subsequent response.

## Reading the movies

The upper maps show the magnetic compression δ<i>B</i><sub>z</sub>/<i>B</i><sub>0</sub>; the lower maps show the Alfvén component <i>B</i><sub>y</sub>/<i>B</i><sub>0</sub>. Both rows and all three models share one fixed magnetic-amplitude color scale. The maps use actual saved solver fields, averaged onto a common 640 × 128 display grid.

The curves retain wavelengths with |<i>k</i>|<i>L</i>/(2π) ≤ 64. Each model's curves are normalized to its own initial compressive electromagnetic polarization norm, since the initial electric fields differ. Spectral diagnostics are computed at native resolution before display averaging. Modes with <i>k</i><sub>x</sub> = 0 have degenerate transverse polarizations and are recorded separately. The metadata records the actual times selected for each panel.

The curves are linear electromagnetic polarization diagnostics about the guide field: compressive (solid) and Alfvén-polarized (dashed). In MHD, the compressive projection includes both fast and slow magnetosonic modes. The curves help track conversion and spectral redistribution, but do not measure the complete wave energy in MHD or PIC, or directly measure plasma heating. Finite-amplitude steepening can also change the MHD pulse. These production runs do not establish numerical convergence or a universal damping rate.

PIC uses 32 particles per cell in total and two current-filter passes. The metadata retains its finite initial discrete Gauss-law residual and the separate offset relative to filtered charge, alongside their subsequent evolution. A small change in a constraint residual does not imply its initial value was zero.

<p><a href="{{ '/' | relative_url }}#research">Return to research <span aria-hidden="true">↗</span></a></p>
