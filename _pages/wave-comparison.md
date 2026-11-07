---
layout: academic-page
title: "Escape of Fast Radio Burst Propagation"
permalink: /research/wave-comparison/
description: "A strong fast magnetosonic pulse interacting with weak resonant Alfvén waves in MHD, force-free electrodynamics, and kinetic pair plasma."
published: true
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

The MHD background uses **cold magnetization σ = 10** and **β = 0.1**, where σ = <i>B</i>₀²/(4πρ<i>c</i>²) and β = 8π<i>p</i>/<i>B</i>₀². With adiabatic index 4/3, the normalized density is 0.1, pressure is 0.05, and enthalpy-based magnetization is approximately 3.33. Its initial pulse follows the finite-amplitude perpendicular relativistic-MHD simple-wave relation.

FFE neglects matter inertia and pressure. Its isolated pulse has <i>E</i><sub>y</sub> = δ<i>B</i><sub>z</sub>. PIC uses the same electromagnetic pulse in a highly magnetized electron–positron plasma, with cold σ = 125 and initial dimensionless temperature 0.1. The electric and velocity fields therefore reflect each model's plasma regime; matching the magnetic pulse does not imply identical electric fields or matter thermodynamics.

For PIC, the input starvation parameter is **ψ<sub>st</sub> = 0.5**, using the paper's definition ψ<sub>st</sub> = <i>E</i><sub>AW,st</sub>/<i>E</i><sub>F0</sub>. At the RMS perpendicular wavenumber of the seed spectrum, the nominal current-capacity threshold is <i>E</i><sub>AW,st</sub> = 0.15<i>B</i><sub>0</sub>. This sets <i>L</i>/<i>d</i><sub>pair</sub> ≈ 225.765. Individual seed wavelengths have nominal thresholds between 0.112 and 0.268<i>B</i><sub>0</sub>, all below the FMS peak. The threshold is an input scale; the particles determine the subsequent response.

## Reading the movies

Three wide panels show MHD, FFE, and PIC on the same physical clock. Each shows **electromagnetic wave energy** with the uniform guide field removed. Low amplitudes fade to transparency against a black background. The still preview uses the maximum RGB channel as monochrome intensity; the movie uses a black–red–yellow palette following Figure 1 of the [ApJL paper](https://arxiv.org/pdf/2606.19448v1), with a fixed scale shared by every model and frame.

The displayed energy follows the paper's wave-energy definition: <i>u</i><sub>w</sub> = (&#124;<i>E</i>&#124;² + &#124;<i>B</i> − <i>B</i>₀&#124;²)/2 in the normalized units above. The guide field is removed **before** squaring. This positive quantity differs from subtracting the uniform background energy from the total electromagnetic energy.

The movie uses the existing completed production runs. It shows electromagnetic energy only. All energy scalars are calculated on the native grid before averaging onto the common 640 × 128 display grid. The energy-density unit is <i>U</i>₀ = <i>B</i>₀²/(4π). The shared energy normalization spans 0 to 0.39<i>U</i>₀ linearly. Black marks zero; the palette reaches red at 0.0468<i>U</i>₀ and yellow at the upper bound. Values below 0.0005<i>U</i>₀ are transparent, with a smooth transition to full opacity at 0.012<i>U</i>₀. These display thresholds also fade real weak seed waves; the downloadable energies retain them.

| Model | Native grid (x × z) | Plasma regime |
| --- | --- | --- |
| Relativistic MHD | 2560 × 512 | Cold σ = 10; β = 0.1 |
| Force-free electrodynamics | 1920 × 384 | Negligible matter inertia |
| Pair-plasma PIC | 2560 × 512 | Cold σ = 125; ψ<sub>st</sub> = 0.5 |

Frames are saved every 0.02<i>L</i>/<i>c</i>, from <i>t</i> = 0 to 2<i>L</i>/<i>c</i>. The renderer matches actual saved times to within 0.001<i>L</i>/<i>c</i> without interpolating the evolved fields.

The downloadable energy data contain spatial means of electromagnetic wave energy and the separate signed total-EM energy excess at each saved time. The metadata records the actual times, source hashes, energy definitions, palettes, opacity thresholds, and fixed color scales. Separate solver reports retain the electromagnetic polarization diagnostics and energy balances. Their compressive projection can include both fast and slow magnetosonic modes in MHD; it does not measure the complete wave energy or plasma heating. These production runs do not establish numerical convergence or a universal damping rate.

Over the full interval, FFE's total electromagnetic energy decreases by 0.255%, equivalent to 10.74% of its initial perturbation energy. Its exchange between polarizations therefore should not be read as exactly conservative. The solver reports below retain the measured energy balances and constraint residuals.

PIC uses 32 particles per cell in total and two current-filter passes. The PIC solver report retains its finite initial discrete Gauss-law residual and the separate offset relative to filtered charge, alongside their subsequent evolution. A small change in a constraint residual does not imply its initial value was zero.

[Download the movie]({{ site.data.wave_comparison.movie | relative_url }}) · [Energy data (CSV)]({{ site.data.wave_comparison.energy_data | relative_url }}) · [Setup, timing, and diagnostics (JSON)]({{ site.data.wave_comparison.metadata | relative_url }})

Solver reports: [MHD]({{ site.data.wave_comparison.mhd_report | relative_url }}) · [FFE]({{ site.data.wave_comparison.ffe_report | relative_url }}) · [PIC]({{ site.data.wave_comparison.pic_report | relative_url }})

<p><a href="{{ '/' | relative_url }}#research">Return to research <span aria-hidden="true">↗</span></a></p>
