/* ===== Inicio: contadores, últimas agregadas, ofertas y "Abrí un sobre" ===== */

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await CATALOGO;
  const disponibles = PRODUCTOS.filter(p => !p.vendido);

  // Contadores de las categorías
  $$('[data-cuenta]').forEach(el => {
    const n = disponibles.filter(p => p.categoria === el.dataset.cuenta).length;
    el.innerHTML = n ? `<b>${n}</b> disponible${n === 1 ? '' : 's'}` : 'Próximamente';
  });

  // Últimas agregadas (las disponibles más nuevas)
  const carril = $('#carril-ultimas');
  const ultimas = disponibles.slice().sort((a, b) => b.creado - a.creado).slice(0, 12);
  carril.innerHTML = ultimas.length
    ? ultimas.map(p => tarjetaHTML(p)).join('')
    : `<p class="vacio">${ok ? 'Todavía no hay productos cargados.' : 'No se pudo cargar el catálogo. Probá de nuevo en un rato.'}</p>`;

  // Ofertas
  const ofertas = disponibles.filter(p => p.precioAnterior).sort((a, b) => b.descuento - a.descuento).slice(0, 12);
  if (ofertas.length) {
    $('#carril-ofertas').innerHTML = ofertas.map(p => tarjetaHTML(p)).join('');
    $('#ofertas').hidden = false;
  }

  iniciarSobre(disponibles.filter(p => p.categoria === 'cartas' && p.frente));
});

/* ===== Abrí un sobre ===== */

function iniciarSobre(pozo) {
  if (pozo.length < 3) return;          // sin cartas suficientes, la sección no aparece
  $('#sobre-seccion').hidden = false;

  const escena = $('#escena'), sobre = $('#sobre'), acciones = $('#sobre-acciones');
  let abierto = false, vueltas = 0, cartas = [];
  const chico = () => innerWidth < 600;
  const posiciones = () => {
    const d = chico() ? 116 : 186;
    return [{ x: -d, r: -8, y: 16 }, { x: 0, r: 0, y: -6 }, { x: d, r: 8, y: 16 }];
  };

  function sortear() {
    const copia = pozo.slice();
    for (let i = copia.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]; }
    const tres = copia.slice(0, 3);
    const max = Math.max(...tres.map(p => p.precio));
    return tres.map(p => ({ p, rara: p.precio === max && tres.filter(x => x.precio === max).length === 1 }));
  }

  function crear(lista) {
    return lista.map(({ p, rara }, i) => {
      const el = document.createElement('div');
      el.className = 'carta-sobre' + (rara ? ' rara' : '');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'Dar vuelta la carta');
      el.innerHTML = `
        <div class="cara dorso"><img src="img/logo.png" alt=""></div>
        <div class="cara frente">
          <img src="${esc(p.frente)}" alt="${esc(p.titulo)}">
          <span class="ver">Ver carta →</span>
          <div class="info"><em>${plata(p.precio)}</em><strong>${esc(p.titulo)}</strong><span>${esc(p.meta || p.equipo)}</span></div>
        </div>`;
      el.style.transform = 'translateY(60px) scale(.6)';
      const accion = () => el.classList.contains('vuelta') ? (location.href = linkProducto(p)) : darVuelta(el, i, p);
      el.addEventListener('click', accion);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); accion(); } });
      escena.appendChild(el);
      return el;
    });
  }

  function darVuelta(el, i, p) {
    el.classList.add('vuelta');
    el.setAttribute('aria-label', `${p.titulo}, ${plata(p.precio)}. Abrir la carta`);
    const q = posiciones()[i];
    el.style.transform = `translate(${q.x}px,${q.y - 14}px) rotate(${q.r}deg) rotateY(180deg) scale(1.04)`;
    setTimeout(() => { el.style.transform = `translate(${q.x}px,${q.y}px) rotate(${q.r}deg) rotateY(180deg)`; }, 450);
    if (++vueltas === 3) setTimeout(() => acciones.classList.add('visible'), 500);
  }

  function abrir() {
    if (abierto) return;
    abierto = true;
    sobre.classList.add('abriendo');
    $('.pista', sobre).style.display = 'none';
    cartas = crear(sortear());
    setTimeout(() => sobre.classList.add('vaciado'), 650);
    cartas.forEach((el, i) => setTimeout(() => {
      const q = posiciones()[i];
      el.style.opacity = 1;
      el.classList.add('dada');
      el.style.transform = `translate(${q.x}px,${q.y}px) rotate(${q.r}deg)`;
    }, 800 + i * 160));
  }

  function reiniciar() {
    cartas.forEach(c => c.remove());
    cartas = []; vueltas = 0; abierto = false;
    acciones.classList.remove('visible');
    sobre.classList.remove('abriendo', 'vaciado');
    $('.pista', sobre).style.display = '';
  }

  // Si giran el celu o cambia el ancho, las cartas se reacomodan
  let espera;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => cartas.forEach((el, i) => {
      if (!el.classList.contains('dada')) return;
      const q = posiciones()[i];
      el.style.transform = `translate(${q.x}px,${q.y}px) rotate(${q.r}deg)${el.classList.contains('vuelta') ? ' rotateY(180deg)' : ''}`;
    }), 150);
  });

  sobre.addEventListener('click', abrir);
  sobre.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
  $('#otro-sobre').addEventListener('click', reiniciar);
}
