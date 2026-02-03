/* =========================
   RENDER CATÁLOGO + BUSCADOR
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const catalogo = document.getElementById("catalogo");
  const buscador = document.getElementById("buscador");
  if (!catalogo) return;

  const categoriaActual = document.body.dataset.categoria;
  let productosCategoria = [];

  fetch("productos.json")
    .then(res => res.json())
    .then(productos => {
      productosCategoria = productos.filter(
        p => p.categoria === categoriaActual
      );

      render(productosCategoria);
    })
    .catch(error => {
      console.error("Error cargando productos.json", error);
      catalogo.innerHTML =
        `<p class="proximamente">Error cargando productos.</p>`;
    });

  function render(lista) {
    catalogo.innerHTML = "";

    if (lista.length === 0) {
      catalogo.innerHTML =
        `<p class="proximamente">No se encontraron resultados.</p>`;
      return;
    }

    lista.forEach(producto => {
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

        <button
          class="agregar"
          data-id="${producto.id}"
          data-nombre="${producto.nombre}"
          data-precio="${producto.precio}"
        >
          Agregar al pedido
        </button>
      `;

      catalogo.appendChild(carta);
    });
  }

  // BUSCADOR
  if (buscador) {
    buscador.addEventListener("input", () => {
      const q = buscador.value.toLowerCase();

      const filtrados = productosCategoria.filter(p =>
        Object.values(p).some(valor =>
          String(valor).toLowerCase().includes(q)
        )
      );

      render(filtrados);
    });
  }
});
