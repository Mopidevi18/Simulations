/* --- script.js --- */
const defaultValues = { U: 0, kr: 0, Tf: 265, tau: 400 };
const kf0 = 1e11, Ef = 20000, Er = 24000, Rg = 1.987;
const rho = 0.8, Cp = 2, cA0 = 0.01, A = 8.94, dH = -15000;
const Tc = 310, v = 100;

const Ur = document.getElementById('U'),
      krR = document.getElementById('kr'),
      TfR = document.getElementById('Tf'),
      tauR = document.getElementById('tau');
const Uval = document.getElementById('U-val'),
      krVal = document.getElementById('kr-val'),
      TfVal = document.getElementById('Tf-val'),
      tauVal = document.getElementById('tau-val');

[['U', Ur], ['kr', krR], ['Tf', TfR], ['tau', tauR]].forEach(([id, input]) => {
  document.getElementById(id + '-inc').onclick = () => {
    input.stepUp();
    update();
  };
  input.addEventListener('input', update);
});

function resetValues() {
  Ur.value = defaultValues.U;
  krR.value = defaultValues.kr;
  TfR.value = defaultValues.Tf;
  tauR.value = defaultValues.tau;
  update();
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function ebal(T, U, Tf) {
  return ( -((v * rho * Cp * (T - Tf) + U * A * (T - Tc)) / (v * dH)) ) * 1000;
}
function mbal(T, tau, kr) {
  const kf = kf0 * Math.exp(-Ef / (Rg * T));
  const krExp = kr * Math.exp(-Er / (Rg * T));
  return ((tau * kf * cA0) / (1 + tau * kf + tau * krExp)) * 1000;
}

function formatSci(val) {
  if (val === 0) return '0';
  const exponent = Math.floor(Math.log10(val));
  const base = (val / Math.pow(10, exponent)).toFixed(1);
  return `${base}×10<sup>${exponent}</sup>`;
}

function update() {
  const U = +Ur.value,
        kr = +krR.value,
        Tf = +TfR.value,
        tau = +tauR.value;

  Uval.textContent = U.toFixed(1);
  krVal.innerHTML = formatSci(kr);
  TfVal.textContent = Tf;
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
    { x: T, y: E, mode: 'lines', name: 'energy balance', line: { color: 'blue', width: 3 } },
    { x: T, y: M, mode: 'lines', name: 'mass balance', line: { color: 'green', width: 3 } },
    { x: [xE], y: [yE], mode: 'markers+text', text: ['energy balance'],
      textposition: 'top center', textfont: { color: 'blue', size: 16 }, showlegend: false },
    { x: [xM], y: [yM], mode: 'markers+text', text: ['mass balance'],
      textposition: 'top center', textfont: { color: 'green', size: 16 }, showlegend: false }
  ], {
    margin: { t: 20, l: 60, r: 20, b: 60 },
    xaxis: { range: [250, 400], dtick: 20, title: 'temperature (K)', mirror: true, ticks: 'outside' },
    yaxis: { range: [0, 12], dtick: 2, title: 'product concentration (mmol/dm³)', mirror: true, ticks: 'outside' },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.05 },
    plot_bgcolor: 'white', paper_bgcolor: 'white'
  }, { displayModeBar: false });
}

update();
