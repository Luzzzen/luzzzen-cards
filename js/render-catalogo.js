/* =========================
   RENDER CATÁLOGO (20 en 20)
========================= */

const catalogo = document.getElementById("catalogo");
const btnVerMas = document.getElementById("ver-mas");

if (!catalogo) return;

// categoría actual desde el body
const categoriaActual = document.body.dataset.categoria;

// configuración
const ITEMS_POR_PAGINA = 20;
let paginaActual = 0;

// filtrar productos
const productosFiltrados = productos.filter(
  p => p.categoria === categoriaActual
);

function renderCatalogo() {
  const inicio = paginaActual * ITEMS_POR_PAGINA;
  const fin = inicio + ITEMS_POR_PAGINA;

  const bloque = productosFiltrados.slice(inicio, fin);

  bloque.forEach(producto => {
    const carta = document.createElement("div");
    carta.className = "carta";

    carta.innerHTML = `
      <div class="imagenes-carta">
        <img src="${producto.imagenes[0]}" alt="${producto.nombre}">
        ${
          producto.imagenes[1]
            ? `<img src="${producto.imagenes[1]}" alt="${producto.nombre} dorso">`
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
  if (paginaActual * ITEMS_POR_PAGINA >= productosFiltrados.length) {
    btnVerMas.style.display = "none";
  }
}

// botón
if (btnVerMas) {
  btnVerMas.addEventListener("click", renderCatalogo);
}

// primer render
renderCatalogo();
