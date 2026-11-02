/* =====================================================================
   CATÁLOGO · filtros, orden y páginas. Todo queda en la URL, así un
   link compartido abre exactamente la misma búsqueda.
   ===================================================================== */

const ORDENES = ['recientes', 'antiguas', 'precio-asc', 'precio-desc'];
const filtros = { cat: '', q: '', jugador: '', equipo: '', sel: '', min: '', max: '', orden: 'recientes', disp: false, p: 1 };

function leerURL() {
  const u = new URLSearchParams(location.search);
  filtros.cat = CONFIG.categorias.some(c => c.id === u.get('cat')) ? u.get('cat') : '';
  for (const k of ['q', 'jugador', 'equipo', 'sel', 'min', 'max']) filtros[k] = u.get(k) || '';
  filtros.orden = ORDENES.includes(u.get('orden')) ? u.get('orden') : 'recientes';
  filtros.disp = u.get('disp') === '1';
  filtros.p = Math.max(1, parseInt(u.get('p'), 10) || 1);
}

function escribirURL(reemplazar) {
  const u = new URLSearchParams();
  for (const k of ['cat', 'q', 'jugador', 'equipo', 'sel', 'min', 'max']) if (filtros[k]) u.set(k, filtros[k]);
  if (filtros.orden !== 'recientes') u.set('orden', filtros.orden);
  if (filtros.disp) u.set('disp', '1');
  if (filtros.p > 1) u.set('p', filtros.p);
  const url = location.pathname + (u.toString() ? '?' + u : '');
  history[reemplazar ? 'replaceState' : 'pushState'](null, '', url);
}

// Coincidencia flexible: sin tildes ni mayúsculas, y vale escribir parte del nombre
const contiene = (valor, buscado) => !buscado || normalizarTexto(valor).includes(normalizarTexto(buscado));

function filtrar({ ignorarCategoria = false } = {}) {
  const palabras = normalizarTexto(filtros.q).split(/\s+/).filter(Boolean);
  const min = filtros.min === '' ? null : Number(filtros.min);
  const max = filtros.max === '' ? null : Number(filtros.max);
  return PRODUCTOS.filter(p =>
    (ignorarCategoria || !filtros.cat || p.categoria === filtros.cat) &&
    palabras.every(w => p.busqueda.includes(w)) &&
    contiene(p.jugador || p.titulo, filtros.jugador) &&
    contiene(p.equipo, filtros.equipo) &&
    contiene(p.seleccion, filtros.sel) &&
    (min == null || p.precio >= min) &&
    (max == null || p.precio <= max) &&
    (!filtros.disp || !p.vendido)
  );
}

function ordenar(lista) {
  const f = {
    'recientes': (a, b) => b.creado - a.creado || b.id.localeCompare(a.id),
    'antiguas': (a, b) => a.creado - b.creado || a.id.localeCompare(b.id),
    'precio-asc': (a, b) => a.precio - b.precio || b.creado - a.creado,
    'precio-desc': (a, b) => b.precio - a.precio || b.creado - a.creado
  }[filtros.orden];
  // Las vendidas siempre van al final, para que primero se vea lo que se puede comprar
  return lista.slice().sort((a, b) => (a.vendido - b.vendido) || f(a, b));
}

/* ===== Pintar ===== */

function pintarChips() {
  const base = filtrar({ ignorarCategoria: true });
  const opciones = [{ id: '', nombre: 'Todo' }, ...CONFIG.categorias];
  $('#chips').innerHTML = opciones.map(c => {
    const n = c.id ? base.filter(p => p.categoria === c.id).length : base.length;
    return `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${filtros.cat === c.id}">${esc(c.nombre)}<small>${n}</small></button>`;
  }).join('');
}

function pintarListas() {
  const unicos = arr => [...new Set(arr.filter(Boolean).map(s => s.trim()))].sort((a, b) => a.localeCompare(b, 'es'));
  const enCat = PRODUCTOS.filter(p => !filtros.cat || p.categoria === filtros.cat);
  const opciones = arr => unicos(arr).map(v => `<option value="${esc(v)}">`).join('');
  $('#lista-jugadores').innerHTML = opciones(enCat.map(p => p.jugador));
  $('#lista-equipos').innerHTML = opciones(enCat.map(p => p.equipo));
  $('#lista-selecciones').innerHTML = opciones(enCat.map(p => p.seleccion));
  // Si todavía no hay selecciones cargadas, el filtro no tiene sentido
  $('[name="sel"]').closest('.filtro').style.display = PRODUCTOS.some(p => p.seleccion) ? '' : 'none';
}

function pintarPaginacion(total) {
  const paginas = Math.ceil(total / CONFIG.porPagina);
  const nav = $('#paginacion');
  if (paginas <= 1) { nav.innerHTML = ''; return; }
  const actual = filtros.p;
  const numeros = [...new Set([1, actual - 1, actual, actual + 1, paginas])].filter(n => n >= 1 && n <= paginas).sort((a, b) => a - b);
  let html = `<button type="button" data-pag="${actual - 1}"${actual === 1 ? ' disabled' : ''} aria-label="Anterior">‹</button>`;
  numeros.forEach((n, i) => {
    if (i && n - numeros[i - 1] > 1) html += '<span class="puntos">…</span>';
    html += `<button type="button" data-pag="${n}"${n === actual ? ' aria-current="page"' : ''}>${n}</button>`;
  });
  html += `<button type="button" data-pag="${actual + 1}"${actual === paginas ? ' disabled' : ''} aria-label="Siguiente">›</button>`;
  nav.innerHTML = html;
}

function pintar() {
  const cat = CONFIG.categorias.find(c => c.id === filtros.cat);
  $('#titulo-catalogo').textContent = cat ? cat.nombre : 'Todo el catálogo';
  document.title = (cat ? cat.nombre : 'Catálogo') + ' · Luzzzen Cards';

  const lista = ordenar(filtrar());
  const paginas = Math.max(1, Math.ceil(lista.length / CONFIG.porPagina));
  if (filtros.p > paginas) filtros.p = paginas;
  const desde = (filtros.p - 1) * CONFIG.porPagina;
  const pagina = lista.slice(desde, desde + CONFIG.porPagina);
  const disponibles = lista.filter(p => !p.vendido).length;

  $('#resultados').innerHTML = lista.length
    ? `<b>${lista.length}</b> producto${lista.length === 1 ? '' : 's'} · ${disponibles} disponible${disponibles === 1 ? '' : 's'}`
    : '&nbsp;';

  $('#grilla').innerHTML = pagina.length
    ? pagina.map((p, i) => tarjetaHTML(p, { lazy: i > 7 })).join('')
    : `<div class="vacio" style="grid-column:1/-1">
         <h2>No encontramos nada</h2>
         <p>Probá con otra búsqueda o sacá algún filtro.</p>
         <button type="button" class="boton boton-secundario" data-limpiar>Limpiar filtros</button>
       </div>`;

  pintarChips();
  pintarPaginacion(lista.length);
}

function sincronizarFormulario() {
  const f = $('#filtros');
  for (const k of ['q', 'jugador', 'equipo', 'sel', 'min', 'max']) f[k].value = filtros[k];
  $('#orden').value = filtros.orden;
  $('#solo-disponibles').checked = filtros.disp;
}

function limpiar() {
  Object.assign(filtros, { q: '', jugador: '', equipo: '', sel: '', min: '', max: '', disp: false, p: 1 });
  sincronizarFormulario(); escribirURL(); pintar();
}

/* ===== Arranque ===== */

document.addEventListener('DOMContentLoaded', async () => {
  leerURL();
  sincronizarFormulario();
  const ok = await CATALOGO;
  if (!ok) {
    $('#grilla').innerHTML = '<div class="vacio" style="grid-column:1/-1"><h2>No se pudo cargar el catálogo</h2><p>Revisá tu conexión y probá de nuevo en un rato.</p></div>';
    return;
  }
  pintarListas();
  pintar();

  let espera;
  $('#filtros').addEventListener('input', e => {
    const k = e.target.name;
    if (!k) return;
    filtros[k] = e.target.value.trim();
    filtros.p = 1;
    clearTimeout(espera);
    espera = setTimeout(() => { escribirURL(true); pintar(); }, 180);
  });
  $('#orden').addEventListener('change', e => { filtros.orden = e.target.value; filtros.p = 1; escribirURL(); pintar(); });
  $('#solo-disponibles').addEventListener('change', e => { filtros.disp = e.target.checked; filtros.p = 1; escribirURL(); pintar(); });
  $('#limpiar').addEventListener('click', limpiar);
  $('#toggle-filtros').addEventListener('click', e => {
    const abierta = $('#filtros').classList.toggle('abierta');
    e.currentTarget.setAttribute('aria-expanded', abierta);
    e.currentTarget.textContent = abierta ? 'Menos filtros' : 'Más filtros';
  });
  if (filtros.jugador || filtros.equipo || filtros.sel || filtros.min || filtros.max) $('#toggle-filtros').click();

  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    filtros.cat = b.dataset.cat; filtros.p = 1;
    escribirURL(); pintarListas(); pintar();
    // Marcar la categoría en la cabecera
    $$('.nav a').forEach(a => {
      if (filtros.cat && a.href.endsWith('cat=' + filtros.cat)) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });
  $('#paginacion').addEventListener('click', e => {
    const b = e.target.closest('[data-pag]');
    if (!b || b.disabled) return;
    filtros.p = Number(b.dataset.pag);
    escribirURL(); pintar();
    $('.catalogo-cabecera').scrollIntoView({ behavior: 'smooth' });
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-limpiar]')) limpiar(); });

  window.addEventListener('popstate', () => { leerURL(); sincronizarFormulario(); pintarListas(); pintar(); });
});
