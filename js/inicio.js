/* ===== Inicio: contadores, últimas agregadas, ofertas y "Abrí un sobre" ===== */

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await CATALOGO;
  const disponibles = PRODUCTOS.filter(p => !p.vendido);

  // Botón principal con la cantidad real de cartas
  const cartas = disponibles.filter(p => p.categoria === 'cartas');
  if (cartas.length) $('#ver-cartas').textContent = `Ver las ${cartas.length} cartas`;

  // Firmas y accesorios: link chico con lo que hay
  $$('[data-cuenta]').forEach(el => {
    const n = disponibles.filter(p => p.categoria === el.dataset.cuenta).length;
    el.textContent = n === 0 ? 'Sin stock por ahora' : n === 1 ? 'Ver 1 disponible' : `Ver los ${n} disponibles`;
  });

  // Atajos por equipo: los 6 equipos con más cartas disponibles
  const porEquipo = new Map();
  cartas.forEach(p => { const e = (p.equipo || '').trim(); if (e) porEquipo.set(e, (porEquipo.get(e) || 0) + 1); });
  const top = [...porEquipo].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).slice(0, 6);
  if (top.length >= 3) {
    $('#equipos-lista').innerHTML = top.map(([e, n]) =>
      `<li><a href="catalogo.html?cat=cartas&amp;equipo=${encodeURIComponent(e)}&amp;disp=1">${esc(e)} <small>${n}</small></a></li>`).join('');
    $('#equipos').hidden = false;
  }

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
  animarJugada();
});

/* ===== "Cómo comprar": la jugada se dibuja al aparecer ===== */
function animarJugada() {
  const j = $('.jugada');
  if (!j || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  j.classList.add('preparada');
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    j.classList.add('en-juego');
    obs.disconnect();
  }, { threshold: .35 });
  obs.observe(j);
}

/* ===== Abrí un sobre ===== */

function iniciarSobre(pozo) {
  if (pozo.length < 3) return;          // sin cartas suficientes, la sección no aparece
  $('#sobre-seccion').hidden = false;

  const escena = $('#escena'), sobre = $('#sobre'), acciones = $('#sobre-acciones');
  const cfg = CONFIG.sobre || { descuento: 0, porDia: 0, raras: 0.12, chances: [1, 0, 0, 0] };
  let abierto = false, vueltas = 0, cartas = [], sorteadas = [], conOferta = false;
  // Separación entre cartas: lo más abiertas posible sin salirse de la pantalla
  const posiciones = () => {
    const ancho = escena.clientWidth, carta = cartas[0] ? cartas[0].offsetWidth : 140;
    const d = Math.min(innerWidth < 600 ? 112 : 196, Math.max(70, (ancho - carta) / 2 - 6));
    return [{ x: -d, r: -7, y: 14 }, { x: 0, r: 0, y: -6 }, { x: d, r: 7, y: 14 }];
  };

  // Raras = las más caras del pozo (el % de cfg.raras). Que salgan varias juntas es cada vez menos probable.
  const precios = pozo.map(p => p.precio).sort((a, b) => b - a);
  const corte = precios[Math.max(0, Math.floor(precios.length * cfg.raras) - 1)];
  let raras = pozo.filter(p => p.precio >= corte), comunes = pozo.filter(p => p.precio < corte);
  if (raras.length < 3 || comunes.length < 3) { raras = []; comunes = pozo.slice(); }   // pozo chico: sin rareza
  const mezclar = arr => { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };

  function cuantasRaras() {
    if (!raras.length) return 0;
    let r = Math.random();
    for (let k = 0; k < cfg.chances.length; k++) { if ((r -= cfg.chances[k]) < 0) return k; }
    return 0;
  }

  function sortear() {
    const k = cuantasRaras();
    const tres = mezclar([...mezclar(raras).slice(0, k), ...mezclar(comunes).slice(0, 3 - k)]);
    return tres.map(p => ({ p, rara: raras.includes(p) }));
  }

  // Oferta: los primeros N sobres del día (contados en este navegador)
  const CLAVE_DIA = 'lz-sobres-dia';
  const hoy = () => new Date().toLocaleDateString('sv');   // AAAA-MM-DD
  function contarSobre() {
    let reg = { fecha: hoy(), n: 0 };
    try { const v = JSON.parse(localStorage.getItem(CLAVE_DIA)); if (v && v.fecha === hoy()) reg = v; } catch {}
    reg.n++;
    try { localStorage.setItem(CLAVE_DIA, JSON.stringify(reg)); } catch {}
    return reg.n;
  }

  function mostrarOferta() {
    const oferta = $('#oferta-sobre'), nota = $('#oferta-nota');
    const total = sorteadas.reduce((t, { p }) => t + p.precio, 0);
    const yaEstan = sorteadas.every(({ p }) => Carrito.enSobre(p.id));
    oferta.hidden = !conOferta || !cfg.descuento;
    if (!oferta.hidden) {
      $('#oferta-antes').textContent = plata(total);
      $('#oferta-ahora').textContent = plata(total - Math.round(total * cfg.descuento / 100));
      $('#llevar-sobre').textContent = yaEstan ? 'Sobre en tu pedido · ver' : `Llevate el sobre (−${cfg.descuento}%)`;
    }
    nota.hidden = conOferta || !cfg.descuento;
    nota.textContent = `Por hoy ya usaste los ${cfg.porDia} sobres con descuento. Podés seguir abriendo para mirar.`;
  }

  function crear(lista) {
    return lista.map(({ p, rara }, i) => {
      const el = document.createElement('div');
      el.className = 'carta-sobre' + (rara ? ' rara' : '') + (i === 2 ? ' derecha' : '');   // la de la derecha muestra el nombre del lado que no tapa la del medio
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'Dar vuelta la carta');
      el.innerHTML = `
        <div class="cara dorso"><img src="img/logo.png" alt=""></div>
        <div class="cara frente">
          <img src="${esc(p.frente)}" alt="${esc(p.titulo)}">
          ${rara ? '<span class="sello-rara">Rara</span>' : ''}
          <div class="info"><em>${plata(p.precio)}</em><strong>${esc(p.titulo)}</strong><span>${esc(p.meta || p.equipo)}</span></div>
        </div>`;
      el.style.transform = 'translateY(60px) scale(.6)';
      el.style.zIndex = i === 1 ? 3 : 1;   // la del medio adelante, así no le tapan el nombre
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
    if (el.classList.contains('rara')) setTimeout(() => aviso('¡Te salió una rara!'), 500);
    if (++vueltas === 3) setTimeout(() => { mostrarOferta(); acciones.classList.add('visible'); }, 500);
  }

  function abrir() {
    if (abierto) return;
    abierto = true;
    sobre.classList.add('abriendo');
    $('.pista', sobre).style.display = 'none';
    sorteadas = sortear();
    conOferta = contarSobre() <= cfg.porDia;
    cartas = crear(sorteadas);
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
  $('#llevar-sobre').addEventListener('click', () => {
    const lista = sorteadas.map(({ p }) => p.id);
    if (lista.every(id => Carrito.enSobre(id))) { Carrito.abrir(); return; }
    Carrito.agregarSobre(lista);
    mostrarOferta();
  });
}
