// grab the modal elements
const modal      = document.getElementById('modal'),
body       = document.getElementById('modal-body'),
closeBtn   = document.getElementById('modal-close');

// convenience to open with some HTML/text:
function openModal(html) {
body.innerHTML = html;
modal.style.display = 'flex';
}
function closeModal() {
modal.style.display = 'none';
}

// hide when you click the × or the backdrop
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => {
if (e.target === modal) closeModal();
});

const detailsContent = `
<h2>Details</h2>

<p>The mass balance is nonlinear:</p>
<p style="font-family: monospace; text-align:center; margin:0;">
C<sub>B</sub> = τ k<sub>f</sub> e<sup>−E<sub>f</sub>/RT</sup> C<sub>A,0</sub>
&nbsp; / &nbsp;
(1 + τ k<sub>f</sub> e<sup>−E<sub>f</sub>/RT</sup> + τ k<sub>r</sub> e<sup>−E<sub>r</sub>/RT</sup>)
</p>

<p>where <em>C<sub>B</sub></em> is the concentration of product B (mol/dm³), <em>C<sub>A,0</sub></em> is the reactant feed concentration (mol), <em>k<sub>f</sub></em> and <em>k<sub>r</sub></em> are the pre-exponential factors for the forward and reverse reactions (1/s), <em>E<sub>f</sub></em> and <em>E<sub>r</sub></em> are the activation energies for the forward and reverse reactions (cal/mol), <em>τ</em> is residence time (s), <em>R</em> is the ideal gas constant (J/[mol K]), and <em>T</em> is the temperature of the CSTR (K).</p>


<p>The energy balance is linear and has two terms that correspond to (1) the energy needed to change the feed temperature to the reactor temperature, and (2) the energy removed or added by heat transfer to a cooling/heating fluid, which is at a constant temperature of 310 K.</p>

<p style="font-family: monospace; text-align:center; margin:0;">
C<sub>B</sub> = (−v ρ C<sub>p</sub>(T−T<sub>0</sub>) − U A(T−T<sub>c</sub>)) / (v ΔH)
</p>

<p>where <em>v</em> is the volumetric flow rate (dm³/s), <em>ρ</em> is the density of the bulk fluid (kg/dm³), <em>C<sub>p</sub></em> is the mass heat capacity of the feed (cal/[kg K]), <em>T<sub>0</sub></em> and <em>T<sub>c</sub></em> are the temperatures of the feed and coolant (K), <em>U</em> is the heat transfer coefficient (cal/[dm² K s]), <em>A</em> is the heat transfer area (dm²), and <em>ΔH</em> is the heat of reaction (cal/mol).</p>


<p>As the feed temperature increases from a low value, the reactor temperature increases until the reactor reaches a temperature above which three steady-state solutions are possible. The upper and lower solutions are stable, and the middle solution is unstable. The operating conditions of the reactor depend on how the reactor is started up. As the feed temperature increases further, a temperature is reached above which only one solution is possible, and this has a high conversion.</p>

<p>Varying the heat transfer coefficient changes both the slope and intercept of the energy balance line, and this can change the number of steady-state solutions. Increasing the pre-exponential factor for the reverse reaction changes the mass balance curve, and the maximum conversion decreases as the equilibrium conversion becomes less than one.</p>
`;





// wire up your three links:
document.getElementById('dir-link')
.addEventListener('click', e => {
e.preventDefault();
openModal('<h2>Directions</h2><p>This simulation plots the concentration of product B versus temperature for the mass and energy balances on a continuous stirred-tank reactor (CSTR) with heat transfer. The reversible, elementary, exothermic reaction A --> B takes place in the CSTR. Use sliders to change the feed temperature, residence time, heat transfer coefficient, and reverse-reaction pre-exponential factor. The intersections of the green curve (mass balance) and blue line (energy balance) correspond to the steady-state solutions for the CSTR. Either one or three solutions are possible; for three solutions, the middle solution is unstable. </p>');
});
document.getElementById('details-link')
.addEventListener('click', e => {
e.preventDefault();
openModal(detailsContent);
});
document.getElementById('about-link')
.addEventListener('click', e => {
e.preventDefault();
openModal('<h2>About</h2><p>This simulation was created in the Department of Chemical and Biological Engineering, at University of Colorado Boulder for LearnChemE.com by Venkateswarlu Mopidevi under the direction of Professor John L. Falconer and Michelle Medlin. It is a JavaScript/HTML5 implementation of a Mathematica simulation (https://demonstrations.wolfram.com/MultipleSteadyStatesInAContinuouslyStirredTankReactor/) by Rachael L. Baumann. It was prepared with financial support from the National Science Foundation (DUE 2336987 and 2336988) in collaboration with Washington State University. Address any questions or comments to LearnChemE@gmail.com.  If this simulation is too big or too small for your screen, zoom out or in using command - or command +  on Mac or ctrl - or ctrl +  on Windows.  </p>');
});

function toggleMenu() {
const menu = document.getElementById('menu');
menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

// optional: click outside to close
document.addEventListener('click', e => {
const menu = document.getElementById('menu');
const btn  = document.querySelector('.menu-button');
if (!btn.contains(e.target) && !menu.contains(e.target)) {
menu.style.display = 'none';
}
});

// Reaction & physical constants
const kf0 = 1e11, Ef = 20000, Er = 24000, Rg = 1.987;
const rho = 0.8, Cp = 2, cA0 = 0.01, A = 8.94, dH = -15000;
const Tc = 310, v = 100;

// DOM references
const Ur   = document.getElementById('U'),
  krR  = document.getElementById('kr'),
  TfR  = document.getElementById('Tf'),
  tauR = document.getElementById('tau');
const Uval   = document.getElementById('U-val'),
  krVal  = document.getElementById('kr-val'),
  TfVal  = document.getElementById('Tf-val'),
  tauVal = document.getElementById('tau-val');

// Only wire the sliders (remove “+” button handlers)
[Ur, krR, TfR, tauR].forEach(input => {
input.addEventListener('input', update);
});

// Energy-balance curve
function ebal(T, U, Tf) {
return ( -((v * rho * Cp * (T - Tf) + U * A * (T - Tc)) / (v * dH)) ) * 1000;
}

// Mass-balance curve
function mbal(T, tau, kr) {
const kf    = kf0 * Math.exp(-Ef / (Rg * T));
const krExp = kr * Math.exp(-Er / (Rg * T));
return ((tau * kf * cA0) / (1 + tau * kf + tau * krExp)) * 1000;
}

// Scientific notation formatter
function formatSci(val) {
if (val === 0) return '0';
const exponent = Math.floor(Math.log10(val));
const base     = (val / Math.pow(10, exponent)).toFixed(1);
return `${base}×10<sup>${exponent}</sup>`;
}

// Main redraw
function update() {
const U   = +Ur.value,
    kr  = +krR.value,
    Tf  = +TfR.value,
    tau = +tauR.value;

Uval.textContent   = U.toFixed(1);
krVal.innerHTML    = formatSci(kr);
TfVal.textContent  = Tf;
tauVal.textContent = tau;

const T = [], E = [], M = [];
for (let i = 0; i <= 150; i++) {
const Ti = 250 + (400 - 250) * (i / 150);
T.push(Ti);
E.push(ebal(Ti, U, Tf));
M.push(mbal(Ti, tau, kr));
}

const xE = Tf <= 270 ? 290 : 330,
    yE = ebal(xE, U, Tf),
    xM = 375,
    yM = mbal(xM, tau, kr);

Plotly.react('plot', [
{ x: T,  y: E, mode: 'lines', line: { color: 'blue',  width: 3 }, hovertemplate: '%{x}, %{y}<extra></extra>' },
{ x: T,  y: M, mode: 'lines', line: { color: 'green', width: 3 }, hovertemplate: '%{x}, %{y}<extra></extra>' }
], {
margin: { t: 20, l: 60, r: 20, b: 60 },
showlegend:false,
width: 809,
height: 500,
xaxis: {
  range: [250, 400],
  dtick: 20,
  title: {
    text: 'temperature (K)',
    standoff: 10,  
    font: {
      size: 20,
      family: 'Helvetica, sans-serif',
      color: '#000',
      weight: 'bold'
    }
  },
  mirror: 'ticks',
  ticks: 'inside',
  tick0: 260,
  zeroline: false,
  tickmode: 'linear',
  ticklen: 8,
  tickwidth: 1,
  tickcolor: '#000',
  ticklabelmode: 'instant',
  tickfont: { size: 18,
    family: 'Arial',
    color: '#000',
   },
  titlefont: { size: 20 },
  showline: true,
  linecolor: '#000',
  linewidth: 1,
  showgrid: false,
  minor: {
    ticklen: 4,
    tickwidth: 1,
    tickcolor: '#000',
    ticks: 'inside',
    dtick: 5,
    showgrid: false
  }
},
yaxis: {
  range: [0, 12],
  dtick: 2,
  title: {
    text: 'product concentration (mmol/dm³)',
    standoff: 0,  
    font: {
      size: 20,
      family: 'Helvetica, sans-serif',
      color: '#000',
      weight: 'bold'
    }
  },
  mirror: 'ticks',
  ticks: 'inside',
  tick0: 0,
  tickmode: 'linear',
  zeroline: false,
  ticklen: 8,
  tickwidth: 1,
  tickcolor: '#000',
  ticklabelmode: 'instant',
  tickfont: { size: 18,
    family: 'Arial',
    color: '#000',
   },
  titlefont: { size: 20 },
  showline: true,
  linecolor: '#000',
  linewidth: 1,
  showgrid: false,
  minor: {
    ticklen: 4,
    tickwidth: 1,
    tickcolor: '#000',
    ticks: 'inside',
    dtick: 0.5,
    showgrid: false
  }
},
annotations: [
{
x: xE, 
y: yE, 
text: 'energy balance',
showarrow: false,
font: { color: 'blue', size: 16 },
bgcolor: 'white',
borderpad: 4,
xanchor: 'center',
yanchor: 'bottom'
},
{
x: xM, 
y: yM + 0.5, 
text: 'mass balance',
showarrow: false,
font: { color: 'green', size: 16 },
bgcolor: 'white',
borderpad: 4,
xanchor: 'center',
yanchor: 'top'
}
],
plot_bgcolor: 'white',
paper_bgcolor: 'white'
}, { displayModeBar: false });
}

// initial draw
update();