document.addEventListener("DOMContentLoaded", () => {

  const sorpresaContainer = document.getElementById("carta-sorpresa");
  const ultimasContainer = document.getElementById("ultimas-cartas");

  fetch("productos.json")
    .then(res => res.json())
    .then(productos => {

      const cartas = productos.filter(
  p => p.categoria === "cartas" && p.vendido !== "x"
);
      /* =========================
         CARTA SORPRESA
      ========================= */

      const cartasBuenas = cartas.filter(p => p.precio > 3000 && p.vendido !== "x");

      if (cartasBuenas.length && sorpresaContainer) {

        const randomCarta = cartasBuenas[Math.floor(Math.random() * cartasBuenas.length)];

        sorpresaContainer.appendChild(crearCarta(randomCarta));
      }


      /* =========================
         ÚLTIMAS AGREGADAS
      ========================= */

      const ultimas = [...cartas]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 8);

      ultimas.forEach(carta => {
        if (ultimasContainer) {
          ultimasContainer.appendChild(crearCarta(carta));
        }
      });

    });


  /* =========================
     CREAR CARTA
  ========================= */

  function crearCarta(producto) {

    const carta = document.createElement("div");
    carta.className = "carta";

    const tieneBack = producto.imagen_back && producto.imagen_back !== "";
    const vendido = producto.vendido === "x";

    carta.innerHTML = `

      <div class="imagenes-carta">

        <img
          src="imagenes/${producto.imagen_front}"
          alt="${producto.nombre}"
        >

        ${
          tieneBack
            ? `<img
                src="imagenes/${producto.imagen_back}"
                alt="${producto.nombre} dorso"
              >`
            : ""
        }

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

    return carta;
  }

});
