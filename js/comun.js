/* =====================================================================
   COMÚN · utilidades, cabecera, pie, tarjetas de producto y carrito
   ===================================================================== */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const plata = n => pesos.format(n || 0);

function esc(t = '') {
  return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function normalizarTexto(t = '') {
  return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
function linkWhatsApp(texto) {
  return 'https://wa.me/' + CONFIG.whatsapp + (texto ? '?text=' + encodeURIComponent(texto) : '');
}
function nombreCategoria(id, corto = false) {
  const c = CONFIG.categorias.find(c => c.id === id);
  return c ? (corto ? c.corto : c.nombre) : '';
}
function esNuevo(p) {
  return !p.vendido && p.creado && (Date.now() - p.creado) < CONFIG.diasNuevo * 864e5;
}
function linkProducto(p) { return 'carta.html?id=' + encodeURIComponent(p.id); }

const ICONO = {
  carrito: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2M10 21h.01M18 21h.01"/></svg>',
  buscar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4-4"/></svg>',
  girar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15m0 5v-5h5"/></svg>',
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-1.5h.01"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>'
};

/* ===== Tarjeta de producto (catálogo, inicio, relacionados) ===== */

function precioHTML(p) {
  return `<span class="precio${p.vendido ? ' tachado-suave' : ''}">${plata(p.precio)}</span>` +
    (p.precioAnterior && !p.vendido ? `<span class="precio-antes">${plata(p.precioAnterior)}</span>` : '');
}

function tarjetaHTML(p, { lazy = true } = {}) {
  const enCarrito = Carrito.tiene(p.id);
  const insignias = [
    p.vendido ? '<span class="insignia vendida">Vendida</span>' : '',
    !p.vendido && p.descuento ? `<span class="insignia oferta">−${p.descuento}%</span>` : '',
    esNuevo(p) ? '<span class="insignia nueva">Nuevo</span>' : ''
  ].join('');
  const img = src => src
    ? `<img src="${esc(src)}" alt="${esc(p.titulo)}"${lazy ? ' loading="lazy"' : ''} decoding="async">`
    : '<span class="sin-foto">Sin foto</span>';
  return `
    <article class="tarjeta${p.vendido ? ' es-vendida' : ''}" data-id="${esc(p.id)}">
      <${p.vendido ? 'div' : 'a'} class="tarjeta-foto${p.dorso ? ' con-dorso' : ''}"${p.vendido ? '' : ` href="${linkProducto(p)}" aria-label="${esc(p.titulo)}"`}>
        <span class="cara frente">${img(p.frente)}</span>
        ${p.dorso ? `<span class="cara dorso">${img(p.dorso)}</span>` : ''}
        <span class="insignias">${insignias}</span>
      </${p.vendido ? 'div' : 'a'}>
      ${p.dorso ? `<button type="button" class="tarjeta-girar" data-girar aria-label="Ver dorso">${ICONO.girar}</button>` : ''}
      <div class="tarjeta-info">
        ${p.meta ? `<p class="tarjeta-meta">${esc(p.meta)}</p>` : `<p class="tarjeta-meta">${esc(nombreCategoria(p.categoria, true))}</p>`}
        <h3 class="tarjeta-titulo">${p.vendido ? esc(p.titulo) : `<a href="${linkProducto(p)}">${esc(p.titulo)}</a>`}</h3>
        <p class="tarjeta-equipo">${esc(p.equipo || ' ')}</p>
        <div class="tarjeta-pie">
          <div class="precios">${precioHTML(p)}</div>
          ${p.vendido
            ? '<span class="boton boton-chico deshabilitado">Vendida</span>'
            : `<button type="button" class="boton boton-chico${enCarrito ? ' en-carrito' : ''}" data-agregar="${esc(p.id)}">${enCarrito ? 'En tu pedido' : 'Agregar'}</button>`}
        </div>
      </div>
    </article>`;
}

// Un solo listener para todas las tarjetas de la página
document.addEventListener('click', e => {
  const girar = e.target.closest('[data-girar]');
  if (girar) { girar.closest('.tarjeta').classList.toggle('girada'); return; }
  const agregar = e.target.closest('[data-agregar]');
  if (agregar) {
    const id = agregar.dataset.agregar;
    if (Carrito.tiene(id)) Carrito.abrir();
    else Carrito.agregar(id);
  }
});

function refrescarBotones() {
  $$('[data-agregar]').forEach(b => {
    const en = Carrito.tiene(b.dataset.agregar);
    b.classList.toggle('en-carrito', en);
    b.textContent = b.dataset.textoLargo
      ? (en ? 'En tu pedido · ver' : 'Agregar al pedido')
      : (en ? 'En tu pedido' : 'Agregar');
  });
}

/* ===== Aviso flotante ===== */

let temporizadorAviso;
function aviso(texto) {
  let el = $('#aviso');
  if (!el) { el = document.createElement('div'); el.id = 'aviso'; el.className = 'aviso'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove('visible'), 2200);
}

/* ===== Cabecera y pie ===== */

function pintarCabecera() {
  const actual = document.body.dataset.pagina;
  const cat = new URLSearchParams(location.search).get('cat');
  const cab = document.createElement('header');
  cab.className = 'cabecera';
  cab.innerHTML = `
    <div class="cabecera-int">
      <a class="marca" href="index.html" aria-label="Luzzzen Cards, inicio">
        <img src="img/logo.png" alt="" width="52" height="42"><span>Luzzzen <em>Cards</em></span>
      </a>
      <nav class="nav" aria-label="Categorías">
        ${CONFIG.categorias.map(c => `<a href="catalogo.html?cat=${c.id}"${actual === 'catalogo' && cat === c.id ? ' aria-current="page"' : ''}>${esc(c.corto)}</a>`).join('')}
      </nav>
      <a class="cabecera-buscar" href="catalogo.html" aria-label="Buscar en el catálogo">${ICONO.buscar}</a>
      <button type="button" class="cabecera-carrito" id="abrir-carrito" aria-label="Ver tu pedido">
        ${ICONO.carrito}<span class="contador" id="contador-carrito" hidden>0</span>
      </button>
    </div>`;
  document.body.prepend(cab);
  $('#abrir-carrito').addEventListener('click', () => Carrito.abrir());
}

function pintarPie() {
  const pie = document.createElement('footer');
  pie.className = 'pie';
  pie.innerHTML = `
    <div class="pie-int">
      <img src="img/logo.png" alt="Luzzzen Cards" width="90" height="73" loading="lazy">
      <p class="pie-texto">Cartas de fútbol coleccionables, firmas, jerseys y accesorios.</p>
      <div class="pie-links">
        <a href="${CONFIG.instagram}" target="_blank" rel="noopener">${ICONO.ig}${esc(CONFIG.instagramUsuario)}</a>
        <a href="${linkWhatsApp('¡Hola! Te escribo desde la web de Luzzzen Cards.')}" target="_blank" rel="noopener">${ICONO.wa}WhatsApp</a>
      </div>
      <p class="pie-chico">© ${new Date().getFullYear()} Luzzzen Cards</p>
    </div>`;
  document.body.appendChild(pie);
}

/* =====================================================================
   CARRITO · se guarda en el navegador y se manda por WhatsApp
   ===================================================================== */

const Carrito = (() => {
  const CLAVE = 'lz-carrito-v2', CLAVE_CODIGO = 'lz-codigo';
  let ids = [];
  let codigo = null;          // { codigo, tipo, valor, minimo } ya validado
  let mensajeCodigo = '';

  try { ids = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch {}
  // Carrito del sitio viejo: se pasa al nuevo formato
  try {
    const viejo = JSON.parse(localStorage.getItem('luzzzenCarrito') || 'null');
    if (Array.isArray(viejo)) {
      viejo.forEach(i => { if (i && i.id && !ids.includes(i.id)) ids.push(String(i.id)); });
      localStorage.removeItem('luzzzenCarrito'); localStorage.removeItem('luzzzenTotal');
    }
  } catch {}

  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(ids)); } catch {} };
  const productos = () => ids.map(id => (window.PRODUCTOS || []).find(p => p.id === id) || { id, faltante: true });
  const disponibles = () => productos().filter(p => !p.faltante && !p.vendido);
  const subtotal = () => disponibles().reduce((t, p) => t + p.precio, 0);
  function descuento(st = subtotal()) {
    if (!codigo || (codigo.minimo && st < codigo.minimo)) return 0;
    return codigo.tipo === 'porcentaje' ? Math.round(st * codigo.valor / 100) : Math.min(codigo.valor, st);
  }
  const etiquetaCodigo = c => c.tipo === 'porcentaje' ? `−${c.valor}%` : `−${plata(c.valor)}`;

  async function consultarCodigo(texto) {
    const { url, key } = CONFIG.supabase;
    const r = await fetch(`${url}/rest/v1/rpc/validar_codigo`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_codigo: texto })
    });
    if (!r.ok) throw new Error('codigo ' + r.status);
    const filas = await r.json();
    return filas[0] || null;
  }
  function guardarCodigo() {
    try { codigo ? localStorage.setItem(CLAVE_CODIGO, codigo.codigo) : localStorage.removeItem(CLAVE_CODIGO); } catch {}
  }

  function actualizarContador() {
    const el = $('#contador-carrito');
    if (!el) return;
    const n = disponibles().length;
    el.textContent = n;
    el.hidden = n === 0;
  }

  function pintarCajon() {
    if ($('#cajon')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="cajon-fondo" id="cajon-fondo" hidden></div>
      <aside class="cajon" id="cajon" aria-label="Tu pedido" aria-hidden="true">
        <div class="cajon-cabecera">
          <h2>Tu pedido</h2>
          <button type="button" class="icono-boton" id="cerrar-cajon" aria-label="Cerrar">${ICONO.cerrar}</button>
        </div>
        <div class="cajon-cuerpo" id="cajon-cuerpo"></div>
      </aside>`);
    $('#cerrar-cajon').addEventListener('click', cerrar);
    $('#cajon-fondo').addEventListener('click', cerrar);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  }

  function render() {
    const cuerpo = $('#cajon-cuerpo');
    if (!cuerpo) return;
    const lista = productos();
    if (!lista.length) {
      cuerpo.innerHTML = `
        <div class="cajon-vacio">
          <p>Tu pedido está vacío.</p>
          <a class="boton" href="catalogo.html">Ver el catálogo</a>
        </div>`;
      return;
    }
    const st = subtotal(), desc = descuento(st);
    const falta = codigo && codigo.minimo && st < codigo.minimo ? codigo.minimo - st : 0;
    cuerpo.innerHTML = `
      <ul class="cajon-lista">
        ${lista.map(p => `
          <li class="cajon-item${p.faltante || p.vendido ? ' no-disponible' : ''}">
            ${p.frente ? `<img src="${esc(p.frente)}" alt="" loading="lazy">` : '<span class="cajon-sin-foto"></span>'}
            <div>
              <p class="cajon-titulo">${p.faltante ? esc(p.id) : p.vendido ? esc(p.titulo) : `<a href="${linkProducto(p)}">${esc(p.titulo)}</a>`}</p>
              <p class="cajon-meta">${p.faltante || p.vendido ? 'Ya no está disponible' : esc([p.equipo, p.meta].filter(Boolean).join(' · '))}</p>
            </div>
            <div class="cajon-derecha">
              ${p.faltante || p.vendido ? '' : `<span class="cajon-precio">${plata(p.precio)}</span>`}
              <button type="button" class="enlace" data-quitar="${esc(p.id)}">Quitar</button>
            </div>
          </li>`).join('')}
      </ul>

      <div class="bloque-codigo">
        ${codigo
          ? `<div class="codigo-aplicado"><span>Código <strong>${esc(codigo.codigo)}</strong> (${etiquetaCodigo(codigo)})</span>
               <button type="button" class="enlace" id="quitar-codigo">Quitar</button></div>`
          : `<label for="input-codigo">¿Tenés un código de descuento?</label>
             <div class="fila-codigo">
               <input id="input-codigo" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false">
               <button type="button" class="boton boton-chico boton-secundario" id="aplicar-codigo">Aplicar</button>
             </div>`}
        <p class="mensaje-codigo" id="mensaje-codigo"${mensajeCodigo || falta ? '' : ' hidden'}>${esc(falta
          ? `El código ${codigo.codigo} es para compras desde ${plata(codigo.minimo)} (te faltan ${plata(falta)}).`
          : mensajeCodigo)}</p>
      </div>

      <dl class="cajon-totales">
        ${desc ? `<div><dt>Subtotal</dt><dd>${plata(st)}</dd></div>
                  <div class="linea-descuento"><dt>Código ${esc(codigo.codigo)}</dt><dd>−${plata(desc)}</dd></div>` : ''}
        <div class="total"><dt>Total</dt><dd>${plata(st - desc)}</dd></div>
      </dl>

      <button type="button" class="boton boton-wa" id="enviar-pedido"${disponibles().length ? '' : ' disabled'}>${ICONO.wa}Enviar pedido por WhatsApp</button>
      <p class="cajon-nota">${esc(CONFIG.entrega)} Las cartas se reservan una vez confirmado el pedido.</p>
      <button type="button" class="enlace cajon-vaciar" id="vaciar-carrito">Vaciar pedido</button>`;

    $$('[data-quitar]', cuerpo).forEach(b => b.addEventListener('click', () => quitar(b.dataset.quitar)));
    const aplicar = $('#aplicar-codigo', cuerpo);
    if (aplicar) {
      aplicar.addEventListener('click', aplicarCodigo);
      $('#input-codigo', cuerpo).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); aplicarCodigo(); } });
    }
    const quitarCod = $('#quitar-codigo', cuerpo);
    if (quitarCod) quitarCod.addEventListener('click', () => { codigo = null; mensajeCodigo = ''; guardarCodigo(); render(); });
    $('#enviar-pedido', cuerpo).addEventListener('click', enviar);
    $('#vaciar-carrito', cuerpo).addEventListener('click', () => {
      if (!confirm('¿Vaciar el pedido?')) return;
      ids = []; guardar(); cambio();
    });
  }

  async function aplicarCodigo() {
    const input = $('#input-codigo'), boton = $('#aplicar-codigo');
    const texto = input.value.trim();
    if (!texto) { mensajeCodigo = 'Escribí el código.'; render(); return; }
    boton.disabled = true; boton.textContent = 'Revisando…';
    try {
      const c = await consultarCodigo(texto);
      if (c) { codigo = c; mensajeCodigo = ''; aviso(`Código ${c.codigo} aplicado`); }
      else mensajeCodigo = 'Ese código no existe o ya venció.';
    } catch {
      mensajeCodigo = 'No se pudo revisar el código. Probá de nuevo en un rato.';
    }
    guardarCodigo();
    render();
    if (!codigo) { const i = $('#input-codigo'); if (i) { i.value = texto; i.focus(); } }
  }

  function enviar() {
    const lista = disponibles();
    if (!lista.length) return;
    const st = subtotal(), desc = descuento(st);
    const lineas = lista.map(p => `• ${p.id} · ${p.titulo}${p.equipo ? ' – ' + p.equipo : ''}${p.meta ? ' (' + p.meta + ')' : ''}: ${plata(p.precio)}`);
    const texto = [
      '¡Hola! Quiero hacer este pedido en Luzzzen Cards:', '',
      ...lineas, '',
      ...(desc ? [`Subtotal: ${plata(st)}`, `Código ${codigo.codigo} (${etiquetaCodigo(codigo)}): −${plata(desc)}`] : []),
      `Total: ${plata(st - desc)}`
    ].join('\n');
    window.open(linkWhatsApp(texto), '_blank', 'noopener');
  }

  function cambio() { guardar(); actualizarContador(); render(); refrescarBotones(); }

  function agregar(id) {
    if (ids.includes(id)) return;
    ids.push(id);
    cambio();
    const p = (window.PRODUCTOS || []).find(x => x.id === id);
    aviso(`${p ? p.titulo : 'Producto'} agregado a tu pedido`);
  }
  function quitar(id) { ids = ids.filter(x => x !== id); cambio(); }

  function abrir() {
    render();
    $('#cajon-fondo').hidden = false;
    requestAnimationFrame(() => { $('#cajon').classList.add('abierto'); $('#cajon').setAttribute('aria-hidden', 'false'); });
    document.body.classList.add('sin-scroll');
    setTimeout(() => $('#cerrar-cajon').focus(), 50);
  }
  function cerrar() {
    const c = $('#cajon');
    if (!c || !c.classList.contains('abierto')) return;
    c.classList.remove('abierto'); c.setAttribute('aria-hidden', 'true');
    $('#cajon-fondo').hidden = true;
    document.body.classList.remove('sin-scroll');
  }

  // Al cargar: revisa el código guardado por si venció
  async function iniciar() {
    pintarCajon();
    actualizarContador();
    let guardado = null;
    try { guardado = localStorage.getItem(CLAVE_CODIGO); } catch {}
    if (guardado) {
      try {
        codigo = await consultarCodigo(guardado);
        if (!codigo) mensajeCodigo = `El código ${guardado} ya no está vigente.`;
      } catch { codigo = null; }
      guardarCodigo();
    }
  }

  return { agregar, quitar, abrir, cerrar, iniciar, actualizarContador, tiene: id => ids.includes(id) };
})();

/* ===== Arranque común ===== */

document.addEventListener('DOMContentLoaded', async () => {
  pintarCabecera();
  pintarPie();
  await CATALOGO;
  Carrito.iniciar();
  refrescarBotones();
});
