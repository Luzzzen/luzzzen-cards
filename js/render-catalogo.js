/* =========================
   RENDER CATÁLOGO + BUSCADOR + PAGINACIÓN
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const catalogo = document.getElementById("catalogo");
  const buscador = document.getElementById("buscador");

  const btnAnterior = document.getElementById("btn-anterior");
  const btnSiguiente = document.getElementById("btn-siguiente");
  const btnPrimera = document.getElementById("btn-primera");
  const btnUltima = document.getElementById("btn-ultima");
  const infoPagina = document.getElementById("info-pagina");

  if (!catalogo) return;

  const categoriaActual = document.body.dataset.categoria;

  const ITEMS_POR_PAGINA = 24;
  let paginaActual = 1;

  let productosCategoria = [];
  let productosFiltrados = [];

  /* =========================
     CARGA JSON
  ========================= */

  fetch("productos.json")
    .then(res => res.json())
    .then(productos => {
      productosCategoria = productos.filter(
        p => p.categoria === categoriaActual
      );

      productosFiltrados = [...productosCategoria];
      paginaActual = 1;

      renderPagina();
    })
    .catch(error => {
      console.error("Error cargando productos.json", error);
      catalogo.innerHTML =
        `<p class="proximamente">Error cargando productos.</p>`;
    });

  /* =========================
     RENDER DE PÁGINA
  ========================= */

  function renderPagina() {
    catalogo.innerHTML = "";

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const bloque = productosFiltrados.slice(inicio, fin);

    if (bloque.length === 0) {
      catalogo.innerHTML =
        `<p class="proximamente">No se encontraron resultados.</p>`;
      actualizarPaginacion();
      return;
    }

    bloque.forEach(producto => {
      const carta = document.createElement("div");
      carta.className = "carta";

      carta.innerHTML = `
        <div class="imagenes-carta">
  <img 
    src="imagenes/${producto.imagen_front}" 
    alt="${producto.nombre}"
    loading="lazy"
  >
  ${
    producto.imagen_back
      ? `<img 
           src="imagenes/${producto.imagen_back}" 
           alt="${producto.nombre} dorso"
           loading="lazy"
         >`
      : ""
  }
  <span class="icono-zoom">🔍</span>
</div>

        <h4 class="titulo-carta">${producto.nombre}</h4>
        <p class="precio">$${producto.precio.toLocaleString()}</p>

        <button
          class="agregar"
          data-id="${producto.id}"
          data-nombre="${producto.nombre}"
          data-precio="${producto.precio}">
          Agregar al pedido
        </button>
      `;

      catalogo.appendChild(carta);
    });

    actualizarPaginacion();
  }

  /* =========================
     PAGINACIÓN UI
  ========================= */

  function actualizarPaginacion() {
    const totalPaginas = Math.ceil(
      productosFiltrados.length / ITEMS_POR_PAGINA
    );

    if (infoPagina) {
      infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    }

    btnAnterior && (btnAnterior.disabled = paginaActual === 1);
    btnPrimera && (btnPrimera.disabled = paginaActual === 1);
    btnSiguiente && (btnSiguiente.disabled = paginaActual === totalPaginas);
    btnUltima && (btnUltima.disabled = paginaActual === totalPaginas);
  }

  /* =========================
     EVENTOS PAGINACIÓN
  ========================= */

  btnAnterior?.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;
      renderPagina();
    }
  });

  btnSiguiente?.addEventListener("click", () => {
    const totalPaginas = Math.ceil(
      productosFiltrados.length / ITEMS_POR_PAGINA
    );
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderPagina();
    }
  });

  btnPrimera?.addEventListener("click", () => {
    paginaActual = 1;
    renderPagina();
  });

  btnUltima?.addEventListener("click", () => {
    paginaActual = Math.ceil(
      productosFiltrados.length / ITEMS_POR_PAGINA
    );
    renderPagina();
  });

  /* =========================
     BUSCADOR
  ========================= */

  if (buscador) {
    buscador.addEventListener("input", () => {
      const q = buscador.value.toLowerCase();

      productosFiltrados = productosCategoria.filter(p =>
        Object.values(p).some(valor =>
          String(valor).toLowerCase().includes(q)
        )
      );

      paginaActual = 1;
      renderPagina();
    });
  }
});
