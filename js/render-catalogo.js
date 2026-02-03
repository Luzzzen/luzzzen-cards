/* =========================
   RENDER CATÁLOGO (BASE JSON)
========================= */

const catalogo = document.getElementById("catalogo");
const btnVerMas = document.getElementById("ver-mas");

// si no hay catálogo en la página, no hacer nada
if (!catalogo) {
  console.warn("No hay #catalogo en esta página");
} else {
  // categoría actual desde el body
  const categoriaActual = document.body.dataset.categoria;

  // configuración
  const ITEMS_POR_PAGINA = 20;
  let paginaActual = 0;
  let productosFiltrados = [];

  /* =========================
     FETCH JSON
  ========================= */

  fetch("productos.json")
    .then(response => response.json())
    .then(productos => {
      console.log("Productos cargados:", productos);

      // filtrar por categoría
      productosFiltrados = productos.filter(
        p => p.categoria === categoriaActual
      );

      // primer render
      renderCatalogo();
    })
    .catch(error => {
      console.error("Error cargando productos:", error);
    });

  /* =========================
     RENDER POR BLOQUES
  ========================= */

  function renderCatalogo() {
    const inicio = paginaActual * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;

    const bloque = productosFiltrados.slice(inicio, fin);

    bloque.forEach(producto => {
      const carta = document.createElement("div");
      carta.className = "carta";

      carta.innerHTML = `
        <div class="imagenes-carta">
          <img src="imagenes/${producto.imagen_front}" alt="${producto.nombre}">
          ${
            producto.imagen_back
              ? `<img src="imagenes/${producto.imagen_back}" alt="${producto.nombre} dorso">`
              : ""
          }
          <span class="icono-zoom">🔍</span>
        </div>

        <h4 class="titulo-carta">${producto.nombre}</h4>
        <p class="precio">$${producto.precio.toLocaleString()}</p>
        <button class="agregar">Agregar al pedido</button>
      `;

      catalogo.appendChild(carta);
    });

    paginaActual++;

    // ocultar botón si no quedan más
    if (
      !btnVerMas ||
      paginaActual * ITEMS_POR_PAGINA >= productosFiltrados.length
    ) {
      if (btnVerMas) btnVerMas.style.display = "none";
    }
  }

  /* =========================
     BOTÓN VER MÁS
  ========================= */

  if (btnVerMas) {
    btnVerMas.addEventListener("click", renderCatalogo);
  }
}
