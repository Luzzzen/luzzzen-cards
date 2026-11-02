/* =====================================================================
   PANEL DE ADMIN · Luzzzen Cards
   Lee y escribe en Supabase. Solo funciona con un mail de la tabla admins.
   ===================================================================== */

const sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
const BUCKET = 'fotos';

const estado = {
  tab: 'productos',
  productos: [],
  filtro: { q: '', estado: 'todos', cat: '' },
  sucio: false            // hay códigos sin guardar
};

/* ===== Utilidades ===== */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const plata = n => pesos.format(n || 0);
const copia = o => JSON.parse(JSON.stringify(o));
const numero = v => (v === '' || v == null || isNaN(Number(v))) ? null : Math.round(Number(v));
const texto = v => { const t = String(v ?? '').trim().replace(/\s+/g, ' '); return t || null; };
const normalizar = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function esc(t = '') {
  return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function nombreCategoria(id) {
  const c = CONFIG.categorias.find(c => c.id === id);
  return c ? c.nombre : id;
}
function tituloDe(p) {
  return (p.categoria === 'cartas' ? (p.jugador || p.nombre) : (p.nombre || p.jugador)) || 'Sin nombre';
}

let temporizadorAviso;
function aviso(mensaje, tipo = 'ok') {
  const el = $('#aviso');
  el.textContent = mensaje;
  el.className = 'admin-aviso ' + tipo;
  el.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.hidden = true, tipo === 'error' ? 6000 : 2500);
}

function mensajeError(error) {
  const m = (error && (error.message || error.msg || error.error)) || String(error);
  if (/JWT|token|401|403|row-level|permission|Unauthorized/i.test(m)) return 'Se cerró la sesión o no tenés permiso. Salí y volvé a entrar.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sin conexión. Revisá internet y probá de nuevo.';
  if (/duplicate key/i.test(m)) return 'Ya existe uno con ese código.';
  return 'Algo salió mal: ' + m;
}

window.addEventListener('beforeunload', e => {
  if (estado.sucio || $('#editor').open) { e.preventDefault(); e.returnValue = ''; }
});

/* ===== Fotos: compresión y subida ===== */

async function comprimir(archivo, maximo = 1000) {
  const img = await createImageBitmap(archivo, { imageOrientation: 'from-image' }).catch(() => null);
  if (!img) throw new Error('No se pudo leer la imagen');
  const escala = Math.min(1, maximo / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  let blob = await new Promise(r => canvas.toBlob(r, 'image/webp', 0.82));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
  return blob;
}

async function subirFoto(archivo, prefijo = 'productos') {
  const blob = await comprimir(archivo);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const ruta = `${prefijo}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(ruta, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

// Si la foto está en nuestro bucket, devuelve su ruta (para poder borrarla)
function rutaEnBucket(url) {
  const marca = `/storage/v1/object/public/${BUCKET}/`;
  const i = String(url || '').indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length).split('?')[0]);
}
async function borrarFotos(urls) {
  const rutas = urls.map(rutaEnBucket).filter(Boolean);
  if (rutas.length) await sb.storage.from(BUCKET).remove(rutas);
}

/* =====================================================================
   LOGIN
   ===================================================================== */

async function iniciar() {
  const { data } = await sb.auth.getSession();
  if (data.session) mostrarPanel(); else mostrarLogin();
  sb.auth.onAuthStateChange((evento, sesion) => {
    if (evento === 'SIGNED_OUT' || !sesion) mostrarLogin();
  });
}

function mostrarLogin() {
  $('#vista-panel').hidden = true;
  $('#vista-login').hidden = false;
}

$('#form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, error = $('#login-error'), boton = $('button', f);
  error.hidden = true;
  boton.disabled = true; boton.textContent = 'Entrando…';
  const { error: err } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.clave.value });
  boton.disabled = false; boton.textContent = 'Entrar';
  if (err) {
    error.textContent = /invalid/i.test(err.message) ? 'Mail o contraseña incorrectos.' : mensajeError(err);
    error.hidden = false;
    return;
  }
  f.clave.value = '';
  mostrarPanel();
});

$('#salir').addEventListener('click', async () => {
  if (estado.sucio && !confirm('Tenés códigos sin guardar. ¿Salir igual?')) return;
  estado.sucio = false;
  await sb.auth.signOut();
});

async function mostrarPanel() {
  // El usuario existe, pero ¿está en la tabla admins?
  const { data: esAdmin, error } = await sb.rpc('es_admin');
  if (error || !esAdmin) {
    await sb.auth.signOut();
    mostrarLogin();
    const el = $('#login-error');
    el.textContent = error ? mensajeError(error) : 'Este mail no tiene permiso de admin. Revisá la tabla admins en Supabase.';
    el.hidden = false;
    return;
  }
  $('#vista-login').hidden = true;
  $('#vista-panel').hidden = false;
  renderTab();
}

/* ===== Pestañas ===== */

$$('.admin-tabs button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.tab === estado.tab) return;
  if (estado.sucio && !confirm('Tenés códigos sin guardar. ¿Descartarlos?')) return;
  estado.sucio = false;
  estado.tab = b.dataset.tab;
  renderTab();
}));

function renderTab() {
  $$('.admin-tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === estado.tab ? 'page' : 'false'));
  const cont = $('#admin-contenido');
  ({ productos: tabProductos, codigos: tabCodigos, importar: tabImportar })[estado.tab](cont);
  window.scrollTo(0, 0);
}

/* =====================================================================
   PRODUCTOS
   ===================================================================== */

async function cargarProductos() {
  const { data, error } = await sb.from('productos').select('*').order('creado', { ascending: false });
  if (error) throw error;
  estado.productos = data;
}

async function tabProductos(cont) {
  cont.innerHTML = '<p class="cargando">Cargando…</p>';
  try { await cargarProductos(); }
  catch (error) { cont.innerHTML = `<p class="aviso-error">${esc(mensajeError(error))}</p>`; return; }

  cont.innerHTML = `
    <div class="admin-titulo">
      <h1>Productos</h1>
      <button type="button" class="boton" id="nuevo-producto">+ Nuevo producto</button>
    </div>
    <div class="herramientas">
      <input type="search" id="buscar" placeholder="Buscar por jugador, equipo, colección o ID" value="${esc(estado.filtro.q)}">
      <select id="filtro-cat">
        <option value="">Todas las categorías</option>
        ${CONFIG.categorias.map(c => `<option value="${c.id}"${estado.filtro.cat === c.id ? ' selected' : ''}>${esc(c.nombre)}</option>`).join('')}
      </select>
      <select id="filtro-estado">
        ${[['todos', 'Todos'], ['disponibles', 'Disponibles'], ['vendidos', 'Vendidos'], ['ocultos', 'Ocultos'], ['oferta', 'En oferta'], ['sin-foto', 'Sin foto']]
          .map(([v, t]) => `<option value="${v}"${estado.filtro.estado === v ? ' selected' : ''}>${t}</option>`).join('')}
      </select>
      <span class="cuenta" id="cuenta"></span>
    </div>
    <div class="tabla-envoltura">
      <table class="tabla">
        <thead><tr>
          <th></th><th>Producto</th><th>Categoría</th><th class="der">Precio</th>
          <th class="centro">Vendido</th><th class="centro">Visible</th><th></th>
        </tr></thead>
        <tbody id="filas"></tbody>
      </table>
    </div>`;

  const pintar = () => {
    const { q, estado: est, cat } = estado.filtro;
    const palabras = normalizar(q).split(/\s+/).filter(Boolean);
    const lista = estado.productos.filter(p => {
      const busca = normalizar([p.id, p.nombre, p.jugador, p.equipo, p.seleccion, p.coleccion, p.anio].join(' '));
      return palabras.every(w => busca.includes(w)) &&
        (!cat || p.categoria === cat) &&
        ({ todos: true, disponibles: !p.vendido && p.visible, vendidos: p.vendido, ocultos: !p.visible,
           oferta: p.precio_anterior > p.precio, 'sin-foto': !p.foto_frente })[est];
    });
    $('#cuenta').textContent = `${lista.length} de ${estado.productos.length}`;
    $('#filas').innerHTML = lista.map(filaHTML).join('') ||
      `<tr><td colspan="7" class="vacio-tabla">${estado.productos.length ? 'Nada coincide con el filtro.' : 'Todavía no hay productos. Cargá el primero o importá los del sitio viejo desde la pestaña Importar.'}</td></tr>`;
  };
  pintar();

  $('#buscar').addEventListener('input', e => { estado.filtro.q = e.target.value; pintar(); });
  $('#filtro-cat').addEventListener('change', e => { estado.filtro.cat = e.target.value; pintar(); });
  $('#filtro-estado').addEventListener('change', e => { estado.filtro.estado = e.target.value; pintar(); });
  $('#nuevo-producto').addEventListener('click', () => abrirEditor(null));

  $('#filas').addEventListener('click', async e => {
    const fila = e.target.closest('tr[data-id]');
    if (!fila) return;
    const p = estado.productos.find(x => x.id === fila.dataset.id);
    if (e.target.closest('[data-editar]')) abrirEditor(p.id);
    else if (e.target.closest('[data-borrar]')) eliminarProducto(p, pintar);
  });
  $('#filas').addEventListener('change', async e => {
    const sw = e.target.closest('[data-campo]');
    if (!sw) return;
    const p = estado.productos.find(x => x.id === sw.closest('tr').dataset.id);
    const campo = sw.dataset.campo, valor = sw.checked;
    sw.disabled = true;
    const { data, error } = await sb.from('productos').update({ [campo]: valor }).eq('id', p.id).select().single();
    sw.disabled = false;
    if (error) { sw.checked = !valor; aviso(mensajeError(error), 'error'); return; }
    Object.assign(p, data);
    aviso(campo === 'vendido'
      ? `${tituloDe(p)}: ${valor ? 'marcado como vendido' : 'vuelve a estar disponible'}`
      : `${tituloDe(p)}: ${valor ? 'visible en la tienda' : 'oculto de la tienda'}`);
    pintar();
  });
}

function filaHTML(p) {
  const meta = [p.equipo, [p.coleccion, p.anio].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  const oferta = p.precio_anterior > p.precio;
  return `
    <tr data-id="${esc(p.id)}" class="${p.vendido ? 'es-vendido' : ''}${!p.visible ? ' es-oculto' : ''}">
      <td class="miniatura">${p.foto_frente ? `<img src="${esc(p.foto_frente)}" alt="" loading="lazy">` : '<span class="sin-foto">Sin foto</span>'}</td>
      <td>
        <strong>${esc(tituloDe(p))}</strong>
        <small>${esc(p.id)}${meta ? ' · ' + esc(meta) : ''}</small>
      </td>
      <td>${esc(nombreCategoria(p.categoria))}</td>
      <td class="der">${plata(p.precio)}${oferta ? `<small class="tachado">${plata(p.precio_anterior)}</small>` : ''}</td>
      <td class="centro"><input type="checkbox" class="switch" data-campo="vendido" aria-label="Vendido"${p.vendido ? ' checked' : ''}></td>
      <td class="centro"><input type="checkbox" class="switch" data-campo="visible" aria-label="Visible"${p.visible ? ' checked' : ''}></td>
      <td class="acciones">
        <a class="enlace" href="carta.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener" title="Ver en la tienda">Ver</a>
        <button type="button" class="boton boton-chico boton-secundario" data-editar>Editar</button>
        <button type="button" class="icono-borrar" data-borrar aria-label="Eliminar ${esc(tituloDe(p))}">✕</button>
      </td>
    </tr>`;
}

async function eliminarProducto(p, alTerminar) {
  if (!confirm(`¿Eliminar "${tituloDe(p)}" (${p.id})? Se borra con sus fotos y no se puede deshacer.\n\nSi solo se vendió, mejor marcalo como vendido.`)) return;
  const { error } = await sb.from('productos').delete().eq('id', p.id);
  if (error) { aviso(mensajeError(error), 'error'); return; }
  await borrarFotos([p.foto_frente, p.foto_dorso]).catch(() => {});
  estado.productos = estado.productos.filter(x => x.id !== p.id);
  aviso(`${tituloDe(p)} eliminado`);
  alTerminar();
}

/* ===== Editor (nuevo / editar) ===== */

let editor = null;   // { original, fotos: { frente: {url, archivo, preview}, dorso: {...} } }

function sugerencias(campo) {
  return [...new Set(estado.productos.map(p => p[campo]).filter(Boolean).map(s => String(s).trim()))]
    .sort((a, b) => a.localeCompare(b, 'es')).map(v => `<option value="${esc(v)}">`).join('');
}

function abrirEditor(id, base = null) {
  const original = id ? estado.productos.find(p => p.id === id) : null;
  const p = original ? copia(original) : {
    categoria: 'cartas', nombre: '', jugador: '', equipo: '', seleccion: '', coleccion: '', anio: '',
    precio: null, precio_anterior: null, vendido: false, visible: true, ...(base || {})
  };
  editor = {
    original,
    fotos: {
      frente: { url: original ? original.foto_frente : null, archivo: null, preview: null },
      dorso: { url: original ? original.foto_dorso : null, archivo: null, preview: null }
    }
  };

  const dlg = $('#editor');
  dlg.innerHTML = `
    <form method="dialog" class="editor-form" id="form-producto" novalidate>
      <div class="editor-cabecera">
        <h2 id="editor-titulo">${original ? `Editar ${esc(original.id)}` : 'Nuevo producto'}</h2>
        <button type="button" class="icono-borrar" data-cerrar aria-label="Cerrar">✕</button>
      </div>

      <div class="editor-cuerpo">
        <div class="editor-fotos">
          ${['frente', 'dorso'].map(lado => `
            <div class="foto-zona" data-lado="${lado}" tabindex="0" role="button" aria-label="Foto del ${lado}">
              <span class="foto-etiqueta">${lado === 'frente' ? 'Frente' : 'Dorso'}${lado === 'dorso' ? ' <small>opcional</small>' : ''}</span>
              <div class="foto-vista"></div>
              <input type="file" accept="image/*" hidden>
            </div>`).join('')}
          <p class="ayuda">Arrastrá la foto o hacé clic. Se achica sola antes de subirse.</p>
        </div>

        <div class="editor-campos">
          <label class="campo"><span>Categoría</span>
            <select name="categoria">${CONFIG.categorias.map(c => `<option value="${c.id}"${p.categoria === c.id ? ' selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select>
          </label>
          <label class="campo solo-otros"><span>Nombre del producto</span>
            <input name="nombre" value="${esc(p.nombre || '')}" placeholder="Folio para 360 cartas" autocomplete="off">
          </label>
          <label class="campo"><span class="etiqueta-jugador">Jugador</span>
            <input name="jugador" value="${esc(p.jugador || '')}" list="sug-jugador" placeholder="Didier Drogba" autocomplete="off">
          </label>
          <div class="campos-fila">
            <label class="campo"><span>Equipo</span><input name="equipo" value="${esc(p.equipo || '')}" list="sug-equipo" placeholder="Chelsea" autocomplete="off"></label>
            <label class="campo"><span>Selección / país</span><input name="seleccion" value="${esc(p.seleccion || '')}" list="sug-seleccion" placeholder="Costa de Marfil" autocomplete="off"></label>
          </div>
          <div class="campos-fila">
            <label class="campo"><span>Colección</span><input name="coleccion" value="${esc(p.coleccion || '')}" list="sug-coleccion" placeholder="Panini WCCF" autocomplete="off"></label>
            <label class="campo campo-chico"><span>Año</span><input name="anio" value="${esc(p.anio || '')}" placeholder="2008-2009" autocomplete="off"></label>
          </div>
          <div class="campos-fila">
            <label class="campo"><span>Precio ($)</span><input name="precio" type="number" min="0" step="100" inputmode="numeric" value="${p.precio ?? ''}" required></label>
            <label class="campo"><span>Precio antes <small>solo si está en oferta</small></span><input name="precio_anterior" type="number" min="0" step="100" inputmode="numeric" value="${p.precio_anterior ?? ''}" placeholder="Sin oferta"></label>
          </div>
          <div class="casillas">
            <label class="switch-etiqueta"><input type="checkbox" class="switch" name="vendido"${p.vendido ? ' checked' : ''}><span>Vendido</span></label>
            <label class="switch-etiqueta"><input type="checkbox" class="switch" name="visible"${p.visible !== false ? ' checked' : ''}><span>Visible en la tienda</span></label>
          </div>
          <p id="editor-error" class="aviso-error" role="alert" hidden></p>
        </div>
      </div>

      <div class="editor-pie">
        ${original ? `<span class="ayuda">Cargado el ${new Date(original.creado).toLocaleDateString('es-AR')}</span>` : '<span class="ayuda">Ctrl + Enter para guardar</span>'}
        <button type="button" class="boton boton-secundario" data-cerrar>Cancelar</button>
        ${original ? '' : '<button type="button" class="boton boton-secundario" data-guardar="otro">Guardar y cargar otro</button>'}
        <button type="button" class="boton" data-guardar="cerrar">Guardar</button>
      </div>

      <datalist id="sug-jugador">${sugerencias('jugador')}</datalist>
      <datalist id="sug-equipo">${sugerencias('equipo')}</datalist>
      <datalist id="sug-seleccion">${sugerencias('seleccion')}</datalist>
      <datalist id="sug-coleccion">${sugerencias('coleccion')}</datalist>
    </form>`;

  const form = $('#form-producto');
  const ajustarCategoria = () => {
    const esCarta = form.categoria.value === 'cartas';
    $('.solo-otros', form).hidden = esCarta;
    $('.etiqueta-jugador', form).innerHTML = esCarta ? 'Jugador' : 'Jugador <small>opcional</small>';
  };
  form.categoria.addEventListener('change', () => {
    ajustarCategoria();
    // Si venía prellenado de la carta anterior, la colección y el año no aplican a otra categoría
    if (!original && base && form.categoria.value !== base.categoria) {
      if (form.coleccion.value === (base.coleccion || '')) form.coleccion.value = '';
      if (form.anio.value === (base.anio || '')) form.anio.value = '';
    }
  });
  ajustarCategoria();

  $$('.foto-zona', form).forEach(zona => prepararZona(zona));
  $$('[data-cerrar]', form).forEach(b => b.addEventListener('click', cerrarEditor));
  $$('[data-guardar]', form).forEach(b => b.addEventListener('click', () => guardarProducto(b.dataset.guardar)));
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); guardarProducto(original ? 'cerrar' : 'otro'); }
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); cerrarEditor(); }, { once: true });

  dlg.showModal();
  (original ? form.precio : (base && base.categoria === 'cartas' ? form.jugador : form.categoria)).focus();
}

function prepararZona(zona) {
  const lado = zona.dataset.lado, input = $('input', zona), vista = $('.foto-vista', zona);
  const pintar = () => {
    const f = editor.fotos[lado];
    const src = f.preview || f.url;
    vista.innerHTML = src
      ? `<img src="${esc(src)}" alt=""><button type="button" class="foto-quitar" aria-label="Quitar foto">✕</button>`
      : '<span class="foto-vacia">＋<small>Subir foto</small></span>';
    zona.classList.toggle('con-foto', !!src);
    const quitar = $('.foto-quitar', vista);
    if (quitar) quitar.addEventListener('click', e => {
      e.stopPropagation();
      if (f.preview) URL.revokeObjectURL(f.preview);
      Object.assign(f, { url: null, archivo: null, preview: null });
      pintar();
    });
  };
  const elegir = archivo => {
    if (!archivo || !archivo.type.startsWith('image/')) { aviso('Ese archivo no es una imagen', 'error'); return; }
    const f = editor.fotos[lado];
    if (f.preview) URL.revokeObjectURL(f.preview);
    Object.assign(f, { archivo, preview: URL.createObjectURL(archivo) });
    pintar();
  };
  zona.addEventListener('click', () => input.click());
  zona.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { elegir(input.files[0]); input.value = ''; });
  zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('arrastrando'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('arrastrando'));
  zona.addEventListener('drop', e => { e.preventDefault(); zona.classList.remove('arrastrando'); elegir(e.dataTransfer.files[0]); });
  pintar();
}

function cerrarEditor() {
  if (!editor) return;
  const hayCambios = Object.values(editor.fotos).some(f => f.archivo);
  if (hayCambios && !confirm('Hay fotos sin guardar. ¿Cerrar igual?')) return;
  Object.values(editor.fotos).forEach(f => f.preview && URL.revokeObjectURL(f.preview));
  editor = null;
  $('#editor').close();
}

function leerFormulario(form) {
  const categoria = form.categoria.value;
  return {
    categoria,
    nombre: categoria === 'cartas' ? null : texto(form.nombre.value),
    jugador: texto(form.jugador.value),
    equipo: texto(form.equipo.value),
    seleccion: texto(form.seleccion.value),
    coleccion: texto(form.coleccion.value),
    anio: texto(form.anio.value),
    precio: numero(form.precio.value),
    precio_anterior: numero(form.precio_anterior.value),
    vendido: form.vendido.checked,
    visible: form.visible.checked
  };
}

function validarProducto(d) {
  if (d.categoria === 'cartas' && !d.jugador) return ['jugador', 'Falta el jugador.'];
  if (d.categoria !== 'cartas' && !d.nombre) return ['nombre', 'Falta el nombre del producto.'];
  if (d.precio == null || d.precio < 0) return ['precio', 'Falta el precio.'];
  if (d.precio_anterior != null && d.precio_anterior <= d.precio) return ['precio_anterior', 'El precio de antes tiene que ser mayor al actual (o dejalo vacío si no está en oferta).'];
  if (!editor.fotos.frente.url && !editor.fotos.frente.archivo) return [null, 'Falta la foto del frente.'];
  return null;
}

async function guardarProducto(modo) {
  const form = $('#form-producto'), error = $('#editor-error');
  const d = leerFormulario(form);
  const problema = validarProducto(d);
  error.hidden = true;
  if (problema) {
    error.textContent = problema[1]; error.hidden = false;
    if (problema[0]) form[problema[0]].focus();
    return;
  }
  const botones = $$('[data-guardar], [data-cerrar]', form);
  botones.forEach(b => b.disabled = true);
  const principal = $(`[data-guardar="${modo}"]`, form), textoBoton = principal.textContent;
  const viejas = [];

  try {
    // 1) Fotos nuevas
    for (const lado of ['frente', 'dorso']) {
      const f = editor.fotos[lado];
      const anterior = editor.original ? editor.original['foto_' + lado] : null;
      if (f.archivo) {
        principal.textContent = `Subiendo ${lado}…`;
        f.url = await subirFoto(f.archivo);
        f.archivo = null;
      }
      if (anterior && anterior !== f.url) viejas.push(anterior);
      d['foto_' + lado] = f.url || null;
    }
    // 2) Datos
    principal.textContent = 'Guardando…';
    const consulta = editor.original
      ? sb.from('productos').update(d).eq('id', editor.original.id).select().single()
      : sb.from('productos').insert(d).select().single();
    const { data, error: err } = await consulta;
    if (err) throw err;

    // 3) Las fotos reemplazadas ya no se usan
    if (viejas.length) borrarFotos(viejas).catch(() => {});

    if (editor.original) Object.assign(editor.original, data);
    else estado.productos.unshift(data);
    aviso(`${tituloDe(data)} guardado (${data.id})`);
    editor = null;
    $('#editor').close();
    if (estado.tab === 'productos') tabProductos($('#admin-contenido'));

    // Cargar otro con la misma categoría, colección y año (para cargar tandas rápido)
    if (modo === 'otro') abrirEditor(null, { categoria: d.categoria, coleccion: d.coleccion, anio: d.anio, equipo: d.categoria === 'cartas' ? '' : d.equipo });
  } catch (err) {
    error.textContent = mensajeError(err); error.hidden = false;
    botones.forEach(b => b.disabled = false);
    principal.textContent = textoBoton;
  }
}

/* =====================================================================
   CÓDIGOS DE DESCUENTO
   ===================================================================== */

// datetime-local ↔ fecha guardada (con zona horaria)
function aLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
const deLocal = v => v ? new Date(v).toISOString() : null;

async function tabCodigos(cont) {
  cont.innerHTML = '<p class="cargando">Cargando…</p>';
  const { data, error } = await sb.from('codigos').select('*').order('creado');
  if (error) { cont.innerHTML = `<p class="aviso-error">${esc(mensajeError(error))}</p>`; return; }
  const filas = copia(data).map(c => ({ ...c, _original: c.codigo, _guardado: true }));
  const actualizarSucio = () => { estado.sucio = filas.some(c => !c._guardado); };

  function validarCodigo(c) {
    c.codigo = String(c.codigo || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!c.codigo) return 'Escribí el código (ej.: DROGBA11).';
    if (!(c.valor > 0)) return `Al código ${c.codigo} le falta el ${c.tipo === 'monto' ? 'monto' : 'porcentaje'}.`;
    if (c.tipo === 'porcentaje' && c.valor > 100) return `El ${c.codigo} no puede ser más de 100%.`;
    if (filas.filter(x => x.codigo === c.codigo).length > 1) return `Ya hay otro código ${c.codigo}.`;
    return null;
  }
  const filaDB = c => ({ codigo: c.codigo, tipo: c.tipo, valor: c.valor, activo: c.activo !== false, vence: c.vence || null, minimo: c.minimo || null });

  async function guardarUno(i, boton) {
    const c = filas[i];
    const problema = validarCodigo(c);
    if (problema) { aviso(problema, 'error'); return; }
    boton.disabled = true; boton.textContent = 'Guardando…';
    // Si le cambiaste el nombre al código, se borra el viejo
    if (c._original && c._original !== c.codigo) {
      const { error } = await sb.from('codigos').delete().eq('codigo', c._original);
      if (error) { aviso(mensajeError(error), 'error'); boton.disabled = false; boton.textContent = 'Guardar código'; return; }
    }
    const { error } = await sb.from('codigos').upsert(filaDB(c));
    boton.disabled = false; boton.textContent = 'Guardar código';
    if (error) { aviso(mensajeError(error), 'error'); return; }
    c._original = c.codigo;
    c._guardado = true;
    aviso(`Código ${c.codigo} guardado`);
    actualizarSucio();
    render();
  }

  function estadoDe(c) {
    if (!c._original) return '<span class="insignia gris">Nuevo</span>';
    if (c.activo === false) return '<span class="insignia gris">Apagado</span>';
    if (c.vence && new Date(c.vence) <= new Date()) return '<span class="insignia gris">Vencido</span>';
    return '<span class="insignia">Activo</span>';
  }

  function render() {
    cont.innerHTML = `
      <div class="admin-titulo"><h1>Códigos de descuento</h1>
        <button type="button" class="boton" id="nuevo-codigo">+ Nuevo código</button></div>
      <p class="ayuda ancho">El cliente lo escribe en el carrito (da igual mayúsculas o minúsculas). Se descuenta del total de los productos, ya con las ofertas aplicadas. Si ponés vencimiento, se apaga solo a esa hora. Nadie de afuera puede ver la lista de códigos.</p>
      <div class="tarjetas-codigos">
        ${filas.map((c, i) => `
          <div class="tarjeta-codigo${c._guardado ? '' : ' sin-guardar'}">
            <div class="tarjeta-codigo-cabecera">
              <label class="switch-etiqueta"><input type="checkbox" class="switch" data-k="activo" data-i="${i}"${c.activo !== false ? ' checked' : ''}><span>Activo</span></label>
              <div class="fila-acciones">${estadoDe(c)} <button type="button" class="icono-borrar" data-borrar="${i}" aria-label="Eliminar">✕</button></div>
            </div>
            <div class="campos-fila">
              <label class="campo"><span>Código</span><input data-k="codigo" data-i="${i}" value="${esc(c.codigo || '')}" placeholder="DROGBA11" class="input-codigo" autocomplete="off"></label>
              <label class="campo"><span>Tipo</span>
                <select data-k="tipo" data-i="${i}">
                  <option value="porcentaje"${c.tipo === 'porcentaje' ? ' selected' : ''}>Porcentaje (%)</option>
                  <option value="monto"${c.tipo === 'monto' ? ' selected' : ''}>Monto fijo ($)</option>
                </select></label>
              <label class="campo"><span>${c.tipo === 'monto' ? 'Monto ($)' : 'Porcentaje (%)'}</span><input type="number" min="1" inputmode="numeric" data-k="valor" data-i="${i}" value="${c.valor ?? ''}"></label>
            </div>
            <div class="campos-fila">
              <label class="campo"><span>Vence <small>opcional</small></span><input type="datetime-local" data-k="vence" data-i="${i}" value="${aLocal(c.vence)}"></label>
              <label class="campo"><span>Compra mínima <small>opcional</small></span><input type="number" min="1" inputmode="numeric" data-k="minimo" data-i="${i}" value="${c.minimo ?? ''}" placeholder="Sin mínimo"></label>
            </div>
            <div class="tarjeta-guardar">
              <span class="ayuda">${c._guardado ? '✓ Guardado' : 'Sin guardar'}</span>
              <button type="button" class="boton boton-chico" data-guardar="${i}"${c._guardado ? ' disabled' : ''}>Guardar código</button>
            </div>
          </div>`).join('') || '<p class="ayuda">Todavía no hay códigos.</p>'}
      </div>`;

    $$('[data-k]', cont).forEach(el => el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
      const c = filas[el.dataset.i], k = el.dataset.k;
      c._guardado = false;
      const tarjeta = el.closest('.tarjeta-codigo');
      tarjeta.classList.add('sin-guardar');
      $('[data-guardar]', tarjeta).disabled = false;
      $('.tarjeta-guardar .ayuda', tarjeta).textContent = 'Sin guardar';
      if (k === 'activo') c.activo = el.checked;
      else if (k === 'valor' || k === 'minimo') c[k] = numero(el.value);
      else if (k === 'vence') c.vence = deLocal(el.value);
      else if (k === 'codigo') { el.value = el.value.toUpperCase().replace(/\s+/g, ''); c.codigo = el.value; }
      else c[k] = el.value;
      actualizarSucio();
      if (k === 'tipo' || k === 'activo' || k === 'vence') render();
    }));
    $$('[data-borrar]', cont).forEach(b => b.addEventListener('click', async () => {
      const i = Number(b.dataset.borrar), c = filas[i];
      if (!confirm(`¿Eliminar el código ${c.codigo || ''}?`)) return;
      if (c._original) {
        const { error } = await sb.from('codigos').delete().eq('codigo', c._original);
        if (error) { aviso(mensajeError(error), 'error'); return; }
        aviso(`Código ${c._original} eliminado`);
      }
      filas.splice(i, 1);
      actualizarSucio(); render();
    }));
    $$('[data-guardar]', cont).forEach(b => b.addEventListener('click', () => guardarUno(Number(b.dataset.guardar), b)));
    $('#nuevo-codigo', cont).addEventListener('click', () => {
      filas.push({ codigo: '', tipo: 'porcentaje', valor: null, activo: true, vence: null, minimo: null, _guardado: false });
      actualizarSucio(); render();
      const cods = $$('[data-k="codigo"]', cont); cods[cods.length - 1].focus();
    });
  }
  render();
}

/* =====================================================================
   IMPORTAR · pasa los productos del sitio viejo (productos.json + carpeta
   imagenes/) a Supabase. Se puede correr más de una vez: saltea lo que
   ya está cargado.
   ===================================================================== */

const CATEGORIA_VIEJA = { cartas: 'cartas', jerseys: 'firmas-jerseys', firmas: 'firmas-jerseys', 'cajas-sobres': 'accesorios', sobres: 'accesorios' };
const SELECCIONES = ['Argentina', 'Brasil', 'Uruguay', 'Italia', 'España', 'Inglaterra', 'Francia', 'Alemania', 'Portugal', 'Países Bajos', 'Holanda', 'Bélgica', 'Croacia', 'Costa de Marfil'];

// Fecha aproximada de carga según la carpeta del día ("5-4/" = 5 de abril)
function fechaVieja(v) {
  const n = parseInt(String(v.id).replace(/\D/g, ''), 10) || 0;
  const m = String(v.carpeta || '').match(/^(\d{1,2})-(\d{1,2})\//);
  const base = m ? new Date(2026, Number(m[2]) - 1, Number(m[1]), 12) : new Date(2026, 1, 2, 12);
  return new Date(base.getTime() + n * 60000).toISOString();   // un minuto por ID: respeta el orden de carga
}

function convertirViejo(v) {
  const categoria = CATEGORIA_VIEJA[v.categoria] || 'cartas';
  let jugador = texto(v.jugador), precio_anterior = null;
  if (jugador && /^oferta\s+/i.test(jugador)) jugador = jugador.replace(/^oferta\s+/i, '');
  const equipo = texto(v.equipo);
  return {
    id: String(v.id).trim().toUpperCase(),
    categoria,
    nombre: categoria === 'cartas' ? null : (texto(v.nombre) || jugador),
    jugador: categoria === 'cartas' ? jugador : null,
    equipo,
    seleccion: equipo && SELECCIONES.includes(equipo) ? equipo : null,
    coleccion: texto(v.coleccion),
    anio: v.anio == null || v.anio === '' ? null : String(v.anio),
    precio: Number(v.precio) || 0,
    precio_anterior,
    vendido: String(v.vendido || '').trim().toLowerCase() === 'x',
    visible: true,
    creado: fechaVieja(v)
  };
}

async function subirFotoVieja(ruta) {
  if (!ruta) return null;
  const r = await fetch('imagenes/' + ruta.split('/').map(encodeURIComponent).join('/'));
  if (!r.ok) throw new Error(`No se encontró la foto ${ruta}`);
  const blob = await r.blob();
  return subirFoto(new File([blob], ruta.split('/').pop(), { type: blob.type || 'image/jpeg' }));
}

function tabImportar(cont) {
  cont.innerHTML = `
    <div class="admin-titulo"><h1>Importar el catálogo viejo</h1></div>
    <div class="tarjeta-info">
      <p>Pasa todos los productos de <code>productos.json</code> (con sus fotos de la carpeta <code>imagenes/</code>) a la base nueva. Las fotos se achican antes de subirse.</p>
      <ul>
        <li>Mantiene los mismos IDs (LZ-000004, LZ-000005…) y el orden en que se cargaron.</li>
        <li>Lo que ya está importado se saltea, así que si se corta podés volver a apretar el botón.</li>
        <li>Tarda unos minutos. No cierres esta pestaña mientras corre.</li>
      </ul>
      <p>Cuando termine sin errores, ya podés borrar <code>productos.json</code> y la carpeta <code>imagenes/</code> del repo.</p>
    </div>
    <button type="button" class="boton" id="importar">Importar productos</button>
    <div class="progreso" id="progreso" hidden><div class="barra"><span></span></div><p class="ayuda" id="progreso-texto"></p></div>
    <ul class="registro" id="registro"></ul>`;

  $('#importar').addEventListener('click', async e => {
    const boton = e.currentTarget, registro = $('#registro');
    const log = (t, tipo = '') => registro.insertAdjacentHTML('beforeend', `<li class="${tipo}">${esc(t)}</li>`);
    registro.innerHTML = '';
    boton.disabled = true; boton.textContent = 'Importando…';
    estado.sucio = true;   // avisa si intentás cerrar la pestaña

    let viejos;
    try {
      const r = await fetch('productos.json', { cache: 'no-store' });
      if (!r.ok) throw new Error();
      viejos = await r.json();
    } catch {
      log('No se encontró productos.json en el sitio. Si ya lo borraste, la importación ya no hace falta.', 'error');
      boton.disabled = false; boton.textContent = 'Importar productos'; estado.sucio = false;
      return;
    }

    const { data: existentes, error } = await sb.from('productos').select('id');
    if (error) { log(mensajeError(error), 'error'); boton.disabled = false; boton.textContent = 'Importar productos'; estado.sucio = false; return; }
    const ya = new Set(existentes.map(x => x.id));
    const pendientes = viejos.filter(v => v && v.id && !ya.has(String(v.id).trim().toUpperCase()));

    $('#progreso').hidden = false;
    const barra = $('#progreso .barra span'), textoProg = $('#progreso-texto');
    let hechos = 0, ok = 0, fallidos = 0;
    const avance = () => {
      barra.style.width = (pendientes.length ? hechos / pendientes.length * 100 : 100) + '%';
      textoProg.textContent = `${hechos} de ${pendientes.length} · ${ok} importados${fallidos ? ` · ${fallidos} con error` : ''}${ya.size ? ` · ${viejos.length - pendientes.length} ya estaban` : ''}`;
    };
    avance();

    // De a 3 a la vez para no saturar
    const cola = pendientes.slice();
    async function trabajador() {
      while (cola.length) {
        const v = cola.shift();
        try {
          const fila = convertirViejo(v);
          fila.foto_frente = await subirFotoVieja(v.imagen_front);
          fila.foto_dorso = await subirFotoVieja(v.imagen_back).catch(err => { log(`${fila.id}: sin dorso (${err.message})`, 'aviso'); return null; });
          const { error } = await sb.from('productos').insert(fila);
          if (error) {
            await borrarFotos([fila.foto_frente, fila.foto_dorso]).catch(() => {});
            throw error;
          }
          ok++;
        } catch (err) {
          fallidos++;
          log(`${v.id}: ${mensajeError(err)}`, 'error');
        }
        hechos++; avance();
      }
    }
    await Promise.all([trabajador(), trabajador(), trabajador()]);

    estado.sucio = false;
    boton.disabled = false; boton.textContent = 'Volver a intentar los que fallaron';
    log(fallidos
      ? `Terminó con ${fallidos} error${fallidos === 1 ? '' : 'es'}. Apretá el botón otra vez para reintentar solo esos.`
      : `Listo: ${ok} productos importados.${ya.size ? ` (${viejos.length - pendientes.length} ya estaban.)` : ''}`, fallidos ? 'error' : 'ok');
  });
}

iniciar();
