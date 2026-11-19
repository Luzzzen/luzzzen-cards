/* ===== Página propia de cada producto: carta.html?id=LZ-000123 ===== */

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await CATALOGO;
  const id = (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  const p = PRODUCTOS.find(x => x.id === id);
  const cont = $('#contenido');

  if (!p) {
    cont.innerHTML = `
      <div class="vacio">
        <h1>${ok ? 'No encontramos este producto' : 'No se pudo cargar el catálogo'}</h1>
        <p>${ok ? 'Puede que ya no esté publicado.' : 'Revisá tu conexión y probá de nuevo en un rato.'}</p>
        <a class="boton" href="catalogo.html">Ir al catálogo</a>
      </div>`;
    document.title = 'No encontrado · Luzzzen Cards';
    return;
  }

  document.title = `${p.titulo}${p.equipo ? ' · ' + p.equipo : ''} · Luzzzen Cards`;
  const desc = $('meta[name="description"]');
  if (desc) desc.content = `${p.titulo}${p.meta ? ' · ' + p.meta : ''} — ${plata(p.precio)} en Luzzzen Cards.`;

  const cat = CONFIG.categorias.find(c => c.id === p.categoria);
  // "Ver más de": atajos al catálogo con lo que tiene esta carta (reemplaza la tabla que repetía los datos)
  const atajo = (k, v) => `<a class="atajo" href="catalogo.html?${k}=${encodeURIComponent(v)}&disp=1">${esc(v)}</a>`;
  const atajos = [
    p.categoria === 'cartas' && p.jugador ? atajo('jugador', p.jugador) : '',
    p.equipo ? atajo('equipo', p.equipo) : '',
    p.seleccion && p.seleccion !== p.equipo ? atajo('sel', p.seleccion) : '',
    p.coleccion ? atajo('q', p.coleccion) : ''
  ].filter(Boolean).join('');
  if (p.vendido) document.title = `Vendida: ${p.titulo} · Luzzzen Cards`;

  cont.innerHTML = `
    <nav class="migas" aria-label="Ruta">
      <a href="catalogo.html">Catálogo</a><span>/</span>
      <a href="catalogo.html?cat=${p.categoria}">${esc(cat ? cat.nombre : '')}</a><span>/</span>
      <span>${esc(p.titulo)}</span>
    </nav>

    <article class="ficha">
      <div class="ficha-visor">
        <div class="visor${p.vendido ? ' vendida' : ''}" id="visor">
          ${p.vendido ? '<span class="insignia vendida visor-insignia">Vendida</span>' : ''}
          <div class="cara frente">${p.frente ? `<img src="${esc(p.frente)}" alt="${esc(p.titulo)}, frente">` : '<span class="sin-foto">Sin foto</span>'}</div>
          ${p.dorso ? `<div class="cara dorso"><img src="${esc(p.dorso)}" alt="${esc(p.titulo)}, dorso"></div>` : ''}
        </div>
        ${p.dorso ? `<div class="visor-botones">
          <button type="button" class="boton boton-chico boton-secundario" id="girar" aria-pressed="false">${ICONO.girar} Ver dorso</button>
        </div>` : ''}
      </div>

      <div class="ficha-info">
        <span class="ficha-meta">${esc(p.meta || (cat ? cat.nombre : ''))}</span>
        <h1>${esc(p.titulo)}</h1>
        ${p.equipo ? `<p class="ficha-equipo">${esc(p.equipo)}${p.seleccion && p.seleccion !== p.equipo ? ' · ' + esc(p.seleccion) : ''}</p>` : ''}

        <div class="ficha-precio">
          ${precioHTML(p)}
          ${!p.vendido && p.descuento ? `<span class="insignia oferta">−${p.descuento}%</span>` : ''}
        </div>
        <p class="ficha-estado${p.vendido ? ' vendida' : ''}">${p.vendido ? 'Ya se vendió. Abajo tenés otras parecidas.' : 'Disponible'}</p>

        <div class="ficha-acciones">
          ${p.vendido
            ? `<a class="boton" href="#relacionados">Ver parecidas</a>`
            : `<button type="button" class="boton" data-agregar="${esc(p.id)}" data-texto-largo="1">Agregar al pedido</button>`}
          <button type="button" class="boton boton-secundario" id="compartir">Compartir</button>
          <a class="boton boton-secundario" target="_blank" rel="noopener"
             href="${linkWhatsApp(`¡Hola! Te consulto por ${p.titulo}${p.equipo ? ' – ' + p.equipo : ''} (${p.id}): ${location.href}`)}">${ICONO.wa} Consultar</a>
        </div>

        ${atajos ? `<div class="ver-mas-de"><p>Ver más de</p><div class="atajos">${atajos}</div></div>` : ''}
        <p class="ficha-nota">${esc(CONFIG.entrega)}</p>
        <p class="ficha-codigo">Código <span>${esc(p.id)}</span></p>
      </div>
    </article>

    <section class="seccion" id="relacionados" hidden>
      <div class="seccion-cabecera"><h2 id="titulo-relacionados">${p.vendido ? 'Parecidas disponibles' : 'También te puede interesar'}</h2></div>
      <div class="carril" id="carril-relacionados"></div>
    </section>`;

  refrescarBotones();

  // Frente / dorso
  const visor = $('#visor'), girar = $('#girar');
  if (girar) girar.addEventListener('click', () => {
    const g = visor.classList.toggle('girado');
    girar.setAttribute('aria-pressed', g);
    girar.innerHTML = `${ICONO.girar} ${g ? 'Ver frente' : 'Ver dorso'}`;
  });

  // Zoom
  const zoom = $('#zoom');
  visor.addEventListener('click', () => {
    const src = visor.classList.contains('girado') ? p.dorso : p.frente;
    if (!src) return;
    $('img', zoom).src = src;
    $('img', zoom).alt = p.titulo;
    zoom.hidden = false;
    document.body.classList.add('sin-scroll');
    $('.zoom-cerrar', zoom).focus();
  });
  visor.setAttribute('tabindex', '0');
  visor.setAttribute('role', 'button');
  visor.setAttribute('aria-label', 'Ampliar foto');
  visor.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); visor.click(); } });
  const cerrarZoom = () => { if (zoom.hidden) return; zoom.hidden = true; document.body.classList.remove('sin-scroll'); visor.focus(); };
  zoom.addEventListener('click', cerrarZoom);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarZoom(); });

  // Compartir
  $('#compartir').addEventListener('click', async () => {
    const datos = { title: p.titulo, text: `${p.titulo} en Luzzzen Cards`, url: location.href };
    if (navigator.share) { try { await navigator.share(datos); } catch {} return; }
    try { await navigator.clipboard.writeText(location.href); aviso('Link copiado'); }
    catch { prompt('Copiá el link:', location.href); }
  });

  // Relacionados: mismo jugador, después mismo equipo, después misma colección
  const puntaje = x =>
    (p.jugador && x.jugador === p.jugador ? 4 : 0) +
    (p.equipo && x.equipo === p.equipo ? 2 : 0) +
    (p.coleccion && x.coleccion === p.coleccion ? 1 : 0);
  const relacionados = PRODUCTOS
    .filter(x => x.id !== p.id && !x.vendido && puntaje(x) > 0)
    .sort((a, b) => puntaje(b) - puntaje(a) || b.creado - a.creado)
    .slice(0, 10);
  if (!relacionados.length) relacionados.push(...PRODUCTOS.filter(x => x.id !== p.id && !x.vendido && x.categoria === 'cartas').sort((a, b) => b.creado - a.creado).slice(0, 10));
  if (relacionados.length) {
    $('#carril-relacionados').innerHTML = relacionados.map(x => tarjetaHTML(x)).join('');
    $('#relacionados').hidden = false;
  }
});
