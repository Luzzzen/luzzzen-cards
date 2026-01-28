/* =========================
   RENDER CATÁLOGO (20 en 20)
========================= */

const catalogo = document.getElementById("catalogo");
const btnVerMas = document.getElementById("ver-mas");

const ITEMS_POR_PAGINA = 20;
let paginaActual = 0;

function renderCatalogo() {
  const inicio = paginaActual * ITEMS_POR_PAGINA;
  const fin = inicio + ITEMS_POR_PAGINA;

  const productosMostrar = productos.slice(inicio, fin);

  productosMostrar.forEach(producto => {
    const carta = document.createElement("div");
    carta.className = "carta";

    carta.innerHTML = `
      <div class="imagenes-carta">
        <img src="${producto.imagenes[0]}" alt="${producto.nombre}">
        ${producto.imagenes[1] ? `<img src="${producto.imagenes[1]}" alt="${producto.nombre} dorso">` : ""}
        <span class="icono-zoom">🔍</span>
      </div>

      <h4 class="titulo-carta">${producto.nombre}</h4>
      <p class="precio">$${producto.precio.toLocaleString()}</p>
      <button class="agregar">Agregar al pedido</button>
    `;

    catalogo.appendChild(carta);
  });

  paginaActual++;

  // Si no quedan más productos
  if (paginaActual * ITEMS_POR_PAGINA >= productos.length) {
    btnVerMas.style.display = "none";
  }
}

// Botón ver más
if (btnVerMas) {
  btnVerMas.addEventListener("click", renderCatalogo);
}

// Primera carga
renderCatalogo();
