/* =========================
   RENDER CATÁLOGO (JSON)
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const catalogo = document.getElementById("catalogo");
  if (!catalogo) return;

  const categoriaActual = document.body.dataset.categoria;

  fetch("productos.json")
    .then(res => res.json())
    .then(productos => {
      const productosFiltrados = productos.filter(
        p => p.categoria === categoriaActual
      );

      if (productosFiltrados.length === 0) {
        catalogo.innerHTML =
          `<p class="proximamente">Próximamente disponible.</p>`;
        return;
      }

      productosFiltrados.forEach(producto => {
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
    })
    .catch(error => {
      console.error("Error cargando productos.json", error);
      catalogo.innerHTML =
        `<p class="proximamente">Error cargando productos.</p>`;
    });
});
