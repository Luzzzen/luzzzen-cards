/* ===== Catálogo desde Supabase =====
   Trae los productos visibles en un solo pedido. Guarda una copia en el
   navegador: si la base no responde, la tienda muestra la última copia. */

(function () {
  const CLAVE_CACHE = 'lz-catalogo-v1';
  const { url, key } = CONFIG.supabase;
  const CAMPOS = 'id,categoria,nombre,jugador,equipo,seleccion,coleccion,anio,precio,precio_anterior,vendido,foto_frente,foto_dorso,creado';

  async function traer() {
    const control = new AbortController();
    const corte = setTimeout(() => control.abort(), 9000);
    try {
      const r = await fetch(`${url}/rest/v1/productos?select=${CAMPOS}&order=creado.desc`, {
        headers: { apikey: key }, signal: control.signal
      });
      if (!r.ok) throw new Error('productos: ' + r.status);
      return await r.json();
    } finally { clearTimeout(corte); }
  }

  // De la fila de la base al formato que usa la tienda
  function normalizar(p) {
    const esCarta = p.categoria === 'cartas';
    const titulo = (esCarta ? (p.jugador || p.nombre) : (p.nombre || p.jugador)) || 'Sin nombre';
    const meta = [p.coleccion, p.anio].filter(Boolean).join(' · ');
    const anterior = p.precio_anterior && p.precio_anterior > p.precio ? p.precio_anterior : null;
    return {
      id: p.id,
      categoria: p.categoria,
      titulo,
      jugador: p.jugador || '',
      equipo: p.equipo || '',
      seleccion: p.seleccion || '',
      coleccion: p.coleccion || '',
      anio: p.anio || '',
      meta,
      precio: p.precio || 0,
      precioAnterior: anterior,
      descuento: anterior ? Math.round((1 - p.precio / anterior) * 100) : 0,
      vendido: !!p.vendido,
      frente: p.foto_frente || '',
      dorso: p.foto_dorso || '',
      creado: p.creado ? new Date(p.creado).getTime() : 0,
      busqueda: normalizarTexto([p.id, titulo, p.jugador, p.nombre, p.equipo, p.seleccion, p.coleccion, p.anio].join(' '))
    };
  }

  window.CATALOGO = (async () => {
    let filas = null, ok = true;
    try {
      filas = await traer();
      try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(filas)); } catch {}
    } catch (error) {
      console.error('No se pudo cargar el catálogo', error);
      try { filas = JSON.parse(localStorage.getItem(CLAVE_CACHE)); } catch {}
      ok = !!filas;
    }
    window.PRODUCTOS = (filas || []).map(normalizar);
    return ok;
  })();
})();
