// script.js

// DOM refs
const sliderPA       = document.getElementById('sliderPA'),
      sliderPB       = document.getElementById('sliderPB'),
      sliderRatio    = document.getElementById('sliderRatio'),
      mixBtn         = document.getElementById('mixBtn'),
      resetBtn       = document.getElementById('resetBtn'),

      valPA          = document.getElementById('valPA'),
      valPB          = document.getElementById('valPB'),
      valRatio       = document.getElementById('valRatio'),

      pAout          = document.getElementById('pA'),
      pBout          = document.getElementById('pB'),
      sTotalE        = document.getElementById('sTotal'),
      sAout          = document.getElementById('sA'),
      sBout          = document.getElementById('sB'),

      entropyTotal   = document.getElementById('entropyTotal'),
      labelSA        = document.getElementById('labelSA'),
      labelSB        = document.getElementById('labelSB'),

      chamberL       = document.querySelector('.chamber.left'),
      chamberR       = document.querySelector('.chamber.right'),
      simulationCard = document.querySelector('.simulation-card');

// physical constants
const R    = 8.314,   // J/(mol·K)
      T    = 298.0,   // K
      Vtot = 2.0;     // m³

// subtle colour mapping
function colourFor(val, hue) {
  const lightness = 100 - 27 * val;
  return `hsl(${hue},100%,${lightness}%)`;
}

// HSL→RGB helper (for blending)
function hslToRgb(h, s, l) {
  h /= 360; let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q-p)*6*t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q-p)*(2/3-t)*6;
      return p;
    };
    const q = l < 0.5 ? l*(1+s) : l + s - l*s;
    const p = 2*l - q;
    r = hue2rgb(p, q, h+1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h-1/3);
  }
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}

// redraw everything to match sliders (pre-mix)
function updateUI() {
  simulationCard.style.backgroundColor = 'white';
  chamberR.style.borderLeft = '2px solid #000';
  entropyTotal.style.display = 'none';
  labelSA.style.display      = 'none';
  labelSB.style.display      = 'none';

  const pA    = +sliderPA.value,
        pB    = +sliderPB.value,
        ratio = +sliderRatio.value;

  valPA.textContent    = pA.toFixed(2) + ' bar';
  valPB.textContent    = pB.toFixed(2) + ' bar';
  valRatio.textContent = ratio.toFixed(2);

  pAout.textContent  = pA.toFixed(2);
  pBout.textContent  = pB.toFixed(2);

  chamberL.style.flex            = ratio;
  chamberR.style.flex            = 1;
  chamberL.style.backgroundColor = colourFor(pA,   0);
  chamberR.style.backgroundColor = colourFor(pB, 240);
}

mixBtn.addEventListener('click', () => {
  updateUI();
  mixBtn.disabled      = true;
  sliderPA.disabled    =
  sliderPB.disabled    =
  sliderRatio.disabled = true;

  const pAbar = +sliderPA.value,
        pBbar = +sliderPB.value,
        ratio = +sliderRatio.value,
        mode  = document.querySelector('input[name="mode"]:checked').value;

  // volumes
  const vA0 = Vtot * (ratio / (1+ratio)),
        vB0 = Vtot - vA0;

  // pressures in Pa
  const pA_Pa = pAbar * 1e5,
        pB_Pa = pBbar * 1e5;

  // moles
  const nA = pA_Pa * vA0 / (R*T),
        nB = pB_Pa * vB0 / (R*T);

  // entropy changes
  let dSA, dSB;
  if (mode === 'remove') {
    dSA = nA * R * Math.log(Vtot/vA0);
    dSB = nB * R * Math.log(Vtot/vB0);
  } else {
    const PFA = nA * R * T / vB0;
    dSA = -nA * R * Math.log(PFA/pA_Pa);
    dSB = 0;
  }

  const iSA = Math.round(dSA),
        iSB = Math.round(dSB),
        iST = iSA + iSB;

  // final partial pressures (bar)
  let finalPAbar, finalPBbar;
  if (mode === 'remove') {
    finalPAbar = (nA*R*T / Vtot) / 1e5;
    finalPBbar = (nB*R*T / Vtot) / 1e5;
  } else {
    const PFA = (nA*R*T)/vB0;
    finalPAbar = PFA/1e5;
    finalPBbar = pBbar;
  }

  // for “remove” colour blend
  const lA   = (100-27*pAbar)/100,
        lB   = (100-27*pBbar)/100,
        rgbA = hslToRgb(0,   1, lA),
        rgbB = hslToRgb(240, 1, lB),
        wA   = ratio/(1+ratio),
        wB   = 1/(1+ratio),
        r    = Math.round(rgbA[0]*wA + rgbB[0]*wB),
        g    = Math.round(rgbA[1]*wA + rgbB[1]*wB),
        b    = Math.round(rgbA[2]*wA + rgbB[2]*wB),
        blendRGB = `rgb(${r},${g},${b})`;

  let go = 0;
  function step() {
    go = Math.min(go + 0.02, 1);

    // interpolate pressures
    const rawPA = pAbar + go*(finalPAbar - pAbar),
          rawPB = pBbar + go*(finalPBbar - pBbar);

    const curPA = isNaN(rawPA) ? 0 : rawPA,
          curPB = isNaN(rawPB) ? 0 : rawPB;

    pAout.textContent = curPA.toFixed(2);
    pBout.textContent = curPB.toFixed(2);

    // interpolate entropies
    const rawSA = Math.round(iSA * go),
          rawSB = Math.round(iSB * go),
          rawST = Math.round(iST * go);

    const dispSA = isNaN(rawSA) ? 0 : rawSA,
          dispSB = isNaN(rawSB) ? 0 : rawSB,
          dispST = isNaN(rawST) ? 0 : rawST;

    sAout.textContent   = dispSA;
    sBout.textContent   = dispSB;
    sTotalE.textContent = dispST;

    entropyTotal.style.display = 'block';
    labelSA.style.display      = 'block';
    labelSB.style.display      = 'block';

    if (mode === 'remove') {
      chamberL.style.flex            = ratio;
      chamberR.style.flex            = 1;
      chamberL.style.backgroundColor = colourFor(curPA,   0);
      chamberR.style.backgroundColor = colourFor(curPB, 240);
      chamberR.style.borderLeft      = '2px solid #000';

      if (go >= 1) {
        chamberL.style.backgroundColor       = 'transparent';
        chamberR.style.backgroundColor       = 'transparent';
        chamberR.style.borderLeft            = 'none';
        simulationCard.style.backgroundColor = blendRGB;
      }

    } else {
      // compress-right
      chamberL.style.flex            = ratio;
      chamberR.style.flex            = 1;
      chamberL.style.backgroundColor = 'transparent';
      chamberR.style.borderLeft      = '2px solid #000';

      if (go < 1) {
        chamberR.style.backgroundColor = 'transparent';
      } else {
        // final red/blue blend
        const pAf = finalPAbar,
              pBf = finalPBbar,
              sum = pAf + pBf;

        let comp = 'transparent';
        if (sum > 0) {
          const rFrac = pAf/sum,
                bFrac = pBf/sum,
                alpha = Math.min(sum/2, 1);
          const rr = Math.round(255 * rFrac),
                bb = Math.round(255 * bFrac);
          comp = `rgba(${rr},0,${bb},${alpha.toFixed(2)})`;
        }
        chamberR.style.backgroundColor = comp;

        // move A-lines
        const pALine = pAout.parentElement;
        if (pALine.parentNode !== chamberR) chamberR.appendChild(pALine);
        if (labelSA.parentNode !== chamberR) chamberR.appendChild(labelSA);
        const sALine = sAout.parentElement;
        if (sALine.parentNode !== chamberR) chamberR.appendChild(sALine);
      }
    }

    if (go < 1) {
      requestAnimationFrame(step);
    } else {
      mixBtn.disabled      = false;
      sliderPA.disabled    =
      sliderPB.disabled    =
      sliderRatio.disabled = false;
    }
  }

  requestAnimationFrame(step);
});

// Reset handler
resetBtn.addEventListener('click', () => {
  // set sliders back to defaults
  sliderPA.value    = 0.5;
  sliderPB.value    = 0.5;
  sliderRatio.value = 1.0;
  // re-enable UI
  mixBtn.disabled      = false;
  sliderPA.disabled    =
  sliderPB.disabled    =
  sliderRatio.disabled = false;
  // clear any moved nodes (in case compress-right had appended them)
  document.querySelector('.chamber.left').appendChild(pAout.parentElement);
  document.querySelector('.chamber.left').appendChild(labelSA);
  document.querySelector('.chamber.left').appendChild(sAout.parentElement);
  // redraw clean
  updateUI();
});

// live-update on slider moves
[sliderPA, sliderPB, sliderRatio].forEach(el =>
  el.addEventListener('input', updateUI)
);

// initial draw
updateUI();

// ─── MENU & MODAL BEHAVIOR ────────────────────────────────────────
const menuBtn     = document.querySelector('.menu-btn');
const dropdown    = document.getElementById('dropdownMenu');
const modal       = document.getElementById('modal');
const modalTitle  = document.getElementById('modalTitle');
const modalBody   = document.getElementById('modalBody');
const modalClose  = document.querySelector('.modal-close');

// 1. Toggle dropdown on hamburger click
menuBtn.addEventListener('click', e => {
  e.stopPropagation();
  dropdown.classList.toggle('hidden');
});

// 2. Hide dropdown when clicking anywhere else
document.addEventListener('click', () => {
  dropdown.classList.add('hidden');
});

// 3. Open modal with content when a menu item is clicked
dropdown.querySelectorAll('li').forEach(item => {
  item.addEventListener('click', e => {
    const opt = e.target.dataset.option;
    let title = '', body = '';

    if (opt === 'directions') {
      title = 'Directions';
      body  = `
      <p>In this simulation, ideal gases A and B are mixed isothermally by:</p>
      <ul>
        <li>Keeping total volume constant (remove barrier), or</li>
        <li>Adding gas A to chamber B so final volume = initial volume of B (compress right).</li>
      </ul>
      <p>Click “mix gases” to initiate mixing. For "remove barrier", the entropy change of each gas is the same as that of a gas expanding into a vacuum. When the partial pressure decreases, entropy increases. For "compress right", if the partial pressure of a gas does not change, its entropy does not change, even when mixed with another gas. The total entropy change is the sum of the entropy changes of each gas.</p>
      <p>Gas A is colored red and gas B is colored blue, and when the gases mix, different shades of purple result, depending on the ratio of moles of each species. As the pressures increase, the color becomes more intense. When the initial pressures of A and B are equal and the "remove barrier" is selected, which corresponds to mixing at constant pressure, the entropy of mixing is:</p>
  
      <div class="formula">
        ΔS<sub>mix</sub> = – n<sub>A</sub> R ln x<sub>A</sub> – n<sub>B</sub> R ln x<sub>B</sub>
      </div>
  
      <p>where x<sub>A</sub> and x<sub>B</sub> are the mole fractions of A and B in the final mixture. Note that the calculations only apply when A and B are different gases.</p>
    `;
    }
    else if (opt === 'details') {
      title = 'Details';
      body  = `
    <p>The total volume of the container is 2 m<sup>3</sup>.</p>

    <div class="formula">ΔS<sub>Total</sub> = ΔS<sub>A</sub> + ΔS<sub>B</sub></div>

    <div class="formula">ΔS<sub>A</sub> = – n<sub>A</sub> R ln (P<sub>F,A</sub> / P<sub>I,A</sub>)</div>
    <div class="formula">ΔS<sub>B</sub> = – n<sub>B</sub> R ln (P<sub>F,B</sub> / P<sub>I,B</sub>)</div>

    <p class="modal-or">or</p>

    <div class="formula">ΔS<sub>A</sub> = n<sub>A</sub> R ln (V<sub>F,A</sub> / V<sub>I,A</sub>)</div>
    <div class="formula">ΔS<sub>B</sub> = n<sub>B</sub> R ln (V<sub>F,B</sub> / V<sub>I,B</sub>)</div>

    <p>
      where <em>n</em> represents the number of moles, <em>R</em> is the gas constant (J / [K·mol]), ΔS is the entropy change (J / K),
      <em>P</em> is pressure (bar), <em>V</em> is volume (m<sup>3</sup>), the subscripts A and B represent the gases used, and the subscripts F and I represent the final and initial pressures.
    </p>
  `;
    }
    else if (opt === 'about') {
      title = 'About';
      body  = `
    <p>
      This simulation was created in the <a href="https://www.colorado.edu/chbe" target="_blank" rel="noopener">Department of Chemical and Biological Engineering</a> at University of Colorado Boulder
      for <a href="https://learncheme.com/" target="_blank" rel="noopener">LearnChemE.com</a> by <em>Venkateswarlu Mopidevi</em>
      under the direction of Professor John L. Falconer and Michelle Medlin.
    </p>

    <p>
      It is a JavaScript/HTML5 implementation of a
      <a href="https://demonstrations.wolfram.com/EntropyChangesInMixingIdealGases/" target="_blank" rel="noopener">Mathematica simulation</a>
      originally developed by Derek M. Machalek.
    </p>

    <p>
      It was prepared with financial support from the National Science Foundation (DUE 2336987 and 2336988) in collaboration with Washington State University. Address any questions or comments to <a href="mailto:LearnChemE@gmail.com">LearnChemE@gmail.com</a>.
    </p>

    <p>
      If this simulation is too big or too small for your screen, zoom out or in using command - or command +  on Mac or ctrl - or ctrl +  on Windows.  
    </p>
  `;
    }

    modalTitle.textContent = title;
    modalBody.innerHTML    = body;
    modal.classList.remove('hidden');
    dropdown.classList.add('hidden');
  });
});

// 4. Close modal when clicking the “×”
modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// 5. Close modal when clicking outside the content box
modal.addEventListener('click', e => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});
