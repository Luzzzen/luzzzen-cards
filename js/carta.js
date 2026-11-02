/* ===== Página propia de cada producto: carta.html?id=LZ-000123 ===== */

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await CATALOGO;
  const id = (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  const p = PRODUCTOS.find(x => x.id === id);
  const cont = $('#contenido');

  if (!p) {
    cont.innerHTML = `
      <div class="vacio">
        <h2>${ok ? 'No encontramos este producto' : 'No se pudo cargar el catálogo'}</h2>
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
  const linkFiltro = (k, v) => `<a href="catalogo.html?${k}=${encodeURIComponent(v)}">${esc(v)}</a>`;
  const filas = [
    p.categoria === 'cartas' && p.jugador ? ['Jugador', linkFiltro('jugador', p.jugador)] : null,
    p.equipo ? ['Equipo', linkFiltro('equipo', p.equipo)] : null,
    p.seleccion ? ['Selección', linkFiltro('sel', p.seleccion)] : null,
    p.coleccion ? ['Colección', linkFiltro('q', p.coleccion)] : null,
    p.anio ? ['Año', esc(p.anio)] : null,
    ['Categoría', `<a href="catalogo.html?cat=${p.categoria}">${esc(cat ? cat.nombre : p.categoria)}</a>`],
    ['Código', esc(p.id)]
  ].filter(Boolean);

  cont.innerHTML = `
    <nav class="migas" aria-label="Ruta">
      <a href="catalogo.html">Catálogo</a><span>/</span>
      <a href="catalogo.html?cat=${p.categoria}">${esc(cat ? cat.nombre : '')}</a><span>/</span>
      <span>${esc(p.titulo)}</span>
    </nav>

    <article class="ficha">
      <div class="ficha-visor">
        <div class="visor" id="visor">
          <div class="cara frente">${p.frente ? `<img src="${esc(p.frente)}" alt="${esc(p.titulo)}, frente">` : '<span class="sin-foto">Sin foto</span>'}</div>
          ${p.dorso ? `<div class="cara dorso"><img src="${esc(p.dorso)}" alt="${esc(p.titulo)}, dorso"></div>` : ''}
        </div>
        ${p.dorso ? `<div class="visor-botones">
          <button type="button" class="boton boton-chico boton-secundario" id="girar" aria-pressed="false">${ICONO.girar} Ver dorso</button>
        </div>` : ''}
      </div>

      <div class="ficha-info">
        <span class="eyebrow">${esc(p.meta || (cat ? cat.nombre : ''))}</span>
        <h1>${esc(p.titulo)}</h1>
        ${p.equipo ? `<p class="ficha-equipo">${esc(p.equipo)}${p.seleccion ? ' · ' + esc(p.seleccion) : ''}</p>` : ''}

        <div class="ficha-precio">
          ${precioHTML(p)}
          ${!p.vendido && p.descuento ? `<span class="insignia oferta">−${p.descuento}%</span>` : ''}
        </div>
        <p class="ficha-estado${p.vendido ? ' vendida' : ''}">${p.vendido ? 'Vendida' : 'Disponible'}</p>

        <div class="ficha-acciones">
          ${p.vendido
            ? `<a class="boton boton-secundario" href="catalogo.html?jugador=${encodeURIComponent(p.jugador || p.titulo)}">Buscar otras de ${esc(p.jugador || p.titulo)}</a>`
            : `<button type="button" class="boton" data-agregar="${esc(p.id)}" data-texto-largo="1">Agregar al pedido</button>`}
          <button type="button" class="boton boton-secundario" id="compartir">Compartir</button>
          <a class="boton boton-secundario" target="_blank" rel="noopener"
             href="${linkWhatsApp(`¡Hola! Te consulto por ${p.titulo}${p.equipo ? ' – ' + p.equipo : ''} (${p.id}): ${location.href}`)}">${ICONO.wa} Consultar</a>
        </div>

        <dl class="datos">${filas.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        <p class="ficha-nota">${esc(CONFIG.entrega)}</p>
      </div>
    </article>

    <section class="seccion" id="relacionados" hidden>
      <div class="seccion-cabecera"><div><p class="eyebrow">Seguí mirando</p><h2 id="titulo-relacionados">También te puede interesar</h2></div></div>
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
    zoom.hidden = false;
  });
  zoom.addEventListener('click', () => zoom.hidden = true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') zoom.hidden = true; });

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
  if (relacionados.length) {
    $('#carril-relacionados').innerHTML = relacionados.map(x => tarjetaHTML(x)).join('');
    $('#relacionados').hidden = false;
  }
});
