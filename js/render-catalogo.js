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
     LAZY LOADING (GLOBAL)
  ========================= */

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove("lazy");
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: "200px",
      threshold: 0.1
    }
  );

  function activarLazyLoading() {
    document.querySelectorAll("img.lazy").forEach(img => {
      observer.observe(img);
    });
  }

  /* =========================
     CARGA JSON
  ========================= */
  const barra = document.getElementById("barra-progreso");
  if (barra) barra.style.width = "40%";

  fetch("productos.json")
    .then(res => res.json())
    .then(productos => {
      if (barra) barra.style.width = "80%";

      productosCategoria = productos.filter(
        p => p.categoria === categoriaActual
      );
      productosFiltrados = [...productosCategoria];
      paginaActual = 1;

      renderPagina();

      if (barra) {
        barra.style.width = "100%";
        setTimeout(() => { barra.style.opacity = "0"; }, 300);
        setTimeout(() => { barra.style.width = "0%"; barra.style.opacity = "1"; }, 650);
      }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

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

  const tieneBack = producto.imagen_back && producto.imagen_back !== "";
  const vendido = producto.vendido === "x"; // ⭐ ESTA LÍNEA FALTABA

  carta.innerHTML = `
    <div class="imagenes-carta">
      <img
        data-src="imagenes/${producto.imagen_front}"
        alt="${producto.nombre}"
        class="lazy"
      >
      ${
        tieneBack
          ? `<img
               data-src="imagenes/${producto.imagen_back}"
               alt="${producto.nombre} dorso"
               class="lazy"
             >`
          : ""
      }
      <span class="icono-zoom">🔍</span>
      ${vendido ? `<span class="badge-vendido">Vendido</span>` : ""}
    </div>

    <h4 class="titulo-carta">${producto.nombre}</h4>
    <p class="precio">$${producto.precio.toLocaleString()}</p>

    <button
  class="agregar ${vendido ? "vendido" : ""}"
  data-id="${producto.id}"
  data-nombre="${producto.nombre}"
  data-precio="${producto.precio}"
  data-imagen="imagenes/${producto.imagen_front}"
  ${vendido ? "disabled" : ""}
>
  ${vendido ? "Vendido" : "Agregar al pedido"}
</button>
`;

  catalogo.appendChild(carta);
});

    activarLazyLoading();
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
