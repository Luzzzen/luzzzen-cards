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

// Opciones de los desplegables del panel, con cuántas cartas hay de cada una.
// Se cuentan dentro de la categoría elegida para no ofrecer opciones vacías.
function pintarListas() {
  const enCat = PRODUCTOS.filter(p => !filtros.cat || p.categoria === filtros.cat);
  const opciones = (campo, todos) => {
    const cuenta = new Map();
    enCat.forEach(p => { const v = (p[campo] || '').trim(); if (v) cuenta.set(v, (cuenta.get(v) || 0) + 1); });
    const valores = [...cuenta.keys()].sort((a, b) => a.localeCompare(b, 'es'));
    return `<option value="">${todos}</option>` +
      valores.map(v => `<option value="${esc(v)}">${esc(v)} (${cuenta.get(v)})</option>`).join('');
  };
  $('#f-jugador').innerHTML = opciones('jugador', 'Todos');
  $('#f-equipo').innerHTML = opciones('equipo', 'Todos');
  $('#f-sel').innerHTML = opciones('seleccion', 'Todas');
  // Sin selecciones cargadas en esta categoría, el filtro no tiene sentido
  $('#f-sel').closest('.filtro').hidden = !enCat.some(p => p.seleccion);

  const disp = PRODUCTOS.filter(p => !p.vendido);
  $('#f-cat').innerHTML = [{ id: '', nombre: 'Todo el catálogo' }, ...CONFIG.categorias]
    .map(c => `<option value="${c.id}">${esc(c.nombre)} (${c.id ? disp.filter(p => p.categoria === c.id).length : disp.length})</option>`).join('');
  sincronizarFormulario();
}

// Un valor que vino por la URL y no está en la lista (ej. un link viejo) se agrega igual
function asegurarOpcion(select, valor) {
  if (valor && ![...select.options].some(o => o.value === valor)) select.add(new Option(valor, valor));
}

function filtrosActivos() {
  return ['jugador', 'equipo', 'sel'].filter(k => filtros[k]).length + (filtros.min || filtros.max ? 1 : 0) + (filtros.disp ? 1 : 0);
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

  // Siempre se cuenta lo disponible (el mismo número que en la portada); las vendidas se aclaran aparte
  const vendidas = lista.length - disponibles;
  $('#resultados').innerHTML = !lista.length ? '&nbsp;'
    : !disponibles ? `No hay disponibles por ahora. ${vendidas === 1 ? 'Esta ya se vendió' : 'Estas ya se vendieron'}.`
    : `<b>${disponibles}</b> disponible${disponibles === 1 ? '' : 's'}${vendidas ? ` · ${vendidas} vendida${vendidas === 1 ? '' : 's'} al final` : ''}`;
  $('#ver-resultados').textContent = disponibles ? `Ver ${disponibles} disponible${disponibles === 1 ? '' : 's'}` : lista.length ? `Ver ${lista.length} vendida${lista.length === 1 ? '' : 's'}` : 'Sin resultados';
  const n = filtrosActivos();
  $('#cuenta-filtros').hidden = !n;
  $('#cuenta-filtros').textContent = n;

  $('#grilla').innerHTML = pagina.length
    ? pagina.map((p, i) => tarjetaHTML(p, { lazy: i > 7 })).join('')
    : `<div class="vacio" style="grid-column:1/-1">
         <h2>No encontramos nada</h2>
         <p>Probá con otra búsqueda o sacá algún filtro.</p>
         <button type="button" class="boton boton-secundario" data-limpiar>Limpiar filtros</button>
       </div>`;

  pintarPaginacion(lista.length);
}

function sincronizarFormulario() {
  const f = $('#filtros');
  for (const k of ['jugador', 'equipo', 'sel']) asegurarOpcion(f[k], filtros[k]);
  for (const k of ['cat', 'q', 'jugador', 'equipo', 'sel', 'min', 'max']) f[k].value = filtros[k];
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
    if (k === 'cat') { escribirURL(); pintarListas(); pintar(); marcarNav(); return; }
    clearTimeout(espera);
    espera = setTimeout(() => { escribirURL(true); pintar(); }, 180);
  });
  $('#orden').addEventListener('change', e => { filtros.orden = e.target.value; filtros.p = 1; escribirURL(); pintar(); });
  $('#solo-disponibles').addEventListener('change', e => { filtros.disp = e.target.checked; filtros.p = 1; escribirURL(); pintar(); });
  $('#limpiar').addEventListener('click', limpiar);

  // Panel de filtros (celu)
  const panel = $('#panel-filtros'), fondo = $('#panel-fondo'), abrirBtn = $('#abrir-filtros');
  const abrirPanel = () => {
    fondo.hidden = false;
    requestAnimationFrame(() => panel.classList.add('abierto'));
    abrirBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('sin-scroll');
    setTimeout(() => $('#cerrar-filtros').focus(), 60);
  };
  const cerrarPanel = () => {
    if (!panel.classList.contains('abierto')) return;
    panel.classList.remove('abierto');
    fondo.hidden = true;
    abrirBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('sin-scroll');
    abrirBtn.focus();
  };
  abrirBtn.addEventListener('click', abrirPanel);
  $('#cerrar-filtros').addEventListener('click', cerrarPanel);
  fondo.addEventListener('click', cerrarPanel);
  $('#ver-resultados').addEventListener('click', () => { cerrarPanel(); $('#grilla').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarPanel(); });

  $('#paginacion').addEventListener('click', e => {
    const b = e.target.closest('[data-pag]');
    if (!b || b.disabled) return;
    filtros.p = Number(b.dataset.pag);
    escribirURL(); pintar();
    $('.catalogo-cabecera').scrollIntoView({ behavior: 'smooth' });
  });
  document.addEventListener('click', e => { if (e.target.closest('[data-limpiar]')) limpiar(); });

  window.addEventListener('popstate', () => { leerURL(); pintarListas(); pintar(); marcarNav(); });
});


// Marca en la cabecera la categoría que se está viendo
function marcarNav() {
  $$('.nav a').forEach(a => {
    if (filtros.cat && a.href.endsWith('cat=' + filtros.cat)) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
