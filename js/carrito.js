/* =========================
   VARIABLES BASE
========================= */

const botonesAgregar = document.querySelectorAll(".agregar");
const listaPedido = document.getElementById("lista-pedido");
const totalTexto = document.getElementById("total");
const botonWhatsapp = document.getElementById("whatsapp");
const botonVaciar = document.getElementById("vaciar");

const carritoFloat = document.getElementById("carrito-float");
const carritoBadge = document.getElementById("carrito-badge");

const drawer = document.getElementById("drawer-carrito");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerLista = document.getElementById("drawer-lista");
const drawerTotal = document.getElementById("drawer-total");
const cerrarDrawerBtn = document.getElementById("cerrar-drawer");
const drawerWhatsapp = document.getElementById("drawer-whatsapp");
const drawerVaciar = document.getElementById("drawer-vaciar");

let items = [];
let total = 0;

/* =========================
   LOCAL STORAGE
========================= */

function guardarCarrito() {
  localStorage.setItem("luzzzenCarrito", JSON.stringify(items));
  localStorage.setItem("luzzzenTotal", total);
}

function cargarCarrito() {
  const guardado = localStorage.getItem("luzzzenCarrito");
  const totalGuardado = localStorage.getItem("luzzzenTotal");

  if (!guardado) return;

  items = JSON.parse(guardado);
  total = parseInt(totalGuardado) || 0;

  if (listaPedido) {
    listaPedido.innerHTML = "";
    items.forEach(item => agregarItemDOM(item.nombre, item.precio));
  }

  actualizarTotal();
  actualizarCarritoFloat();
}

/* =========================
   CARRITO BASE
========================= */

function agregarItemDOM(nombre, precio) {
  if (!listaPedido) return;

  const li = document.createElement("li");
  li.innerHTML = `
    ${nombre} – $${precio.toLocaleString()}
    <button class="eliminar">✕</button>
  `;

  li.querySelector(".eliminar").addEventListener("click", () => {
    items = items.filter(i => i.nombre !== nombre);
    total -= precio;
    li.remove();

    actualizarTotal();
    actualizarCarritoFloat();
    guardarCarrito();
  });

  listaPedido.appendChild(li);
}

function actualizarTotal() {
  if (totalTexto) {
    totalTexto.innerText = `Total: $${total.toLocaleString()}`;
  }
}

/* =========================
   BOTONES AGREGAR
========================= */

botonesAgregar.forEach(boton => {
  boton.addEventListener("click", () => {
    const carta = boton.closest(".carta");
    const nombre = carta.querySelector(".titulo-carta").innerText;
    const precio = parseInt(
      carta.querySelector(".precio").innerText.replace(/\D/g, "")
    );

    if (items.some(i => i.nombre === nombre)) {
      alert("Esta carta ya está en tu pedido.");
      return;
    }

    items.push({ nombre, precio });
    agregarItemDOM(nombre, precio);

    total += precio;
    actualizarTotal();
    actualizarCarritoFloat();
    guardarCarrito();
  });
});

/* =========================
   VACIAR CARRITO
========================= */

if (botonVaciar) {
  botonVaciar.addEventListener("click", () => {
    items = [];
    total = 0;
    if (listaPedido) listaPedido.innerHTML = "";
    actualizarTotal();
    actualizarCarritoFloat();
    localStorage.clear();
  });
}

/* =========================
   WHATSAPP
========================= */

if (botonWhatsapp) {
  botonWhatsapp.addEventListener("click", () => {
    if (items.length === 0) {
      alert("No agregaste ninguna carta.");
      return;
    }

    let mensaje = `Pedido LZ-${Date.now()}%0A%0A`;

    items.forEach(i => {
      mensaje += `• ${i.nombre} - $${i.precio.toLocaleString()}%0A`;
    });

    mensaje += `%0A Total: $${total.toLocaleString()}`;

    window.open(
      `https://wa.me/5491125608635?text=${mensaje}`,
      "_blank"
    );
  });
}

/* =========================
   CARRITO FLOTANTE
========================= */

function actualizarCarritoFloat() {
  if (!carritoFloat) return;

  carritoBadge.innerText = items.length;
  carritoFloat.style.display = items.length ? "flex" : "none";
}

if (carritoFloat) {
  carritoFloat.addEventListener("click", () => {
    abrirDrawer();
  });
}

/* =========================
   DRAWER
========================= */

function abrirDrawer() {
  if (!drawer) return;

  drawerLista.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.nombre} – $${item.precio.toLocaleString()}
      <button class="eliminar">✕</button>
    `;

    li.querySelector(".eliminar").addEventListener("click", () => {
      items = items.filter(i => i.nombre !== item.nombre);
      total -= item.precio;

      guardarCarrito();
      actualizarTotal();
      actualizarCarritoFloat();
      abrirDrawer();
    });

    drawerLista.appendChild(li);
  });

  drawerTotal.innerText = `Total: $${total.toLocaleString()}`;
  drawer.classList.add("abierto");
  drawerOverlay.classList.add("activo");
}

function cerrarDrawer() {
  drawer.classList.remove("abierto");
  drawerOverlay.classList.remove("activo");
}

if (cerrarDrawerBtn) cerrarDrawerBtn.addEventListener("click", cerrarDrawer);
if (drawerOverlay) drawerOverlay.addEventListener("click", cerrarDrawer);
if (drawerWhatsapp) drawerWhatsapp.addEventListener("click", () => botonWhatsapp.click());

if (drawerVaciar) {
  drawerVaciar.addEventListener("click", () => {
    items = [];
    total = 0;
    guardarCarrito();
    cerrarDrawer();
    actualizarCarritoFloat();
    actualizarTotal();
  });
}

/* =========================
   ZOOM / MODAL DE IMÁGENES
========================= */

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const flechaIzq = document.querySelector(".flecha.izquierda");
const flechaDer = document.querySelector(".flecha.derecha");

let imagenesActuales = [];
let indiceActual = 0;

if (modal && modalImg) {
  document.querySelectorAll(".imagenes-carta").forEach(contenedor => {
    contenedor.addEventListener("click", e => {
      e.stopPropagation();

      imagenesActuales = Array.from(contenedor.querySelectorAll("img"));
      indiceActual = 0; // 🔑 SIEMPRE empieza en la frontal

      modalImg.src = imagenesActuales[indiceActual].src;
      modal.style.display = "flex";

      if (imagenesActuales.length > 1) {
        flechaIzq.style.display = "block";
        flechaDer.style.display = "block";
      } else {
        flechaIzq.style.display = "none";
        flechaDer.style.display = "none";
      }
    });
  });

  // Flecha derecha
  if (flechaDer) {
    flechaDer.addEventListener("click", e => {
      e.stopPropagation();
      indiceActual = (indiceActual + 1) % imagenesActuales.length;
      modalImg.src = imagenesActuales[indiceActual].src;
    });
  }

  // Flecha izquierda
  if (flechaIzq) {
    flechaIzq.addEventListener("click", e => {
      e.stopPropagation();
      indiceActual =
        (indiceActual - 1 + imagenesActuales.length) %
        imagenesActuales.length;
      modalImg.src = imagenesActuales[indiceActual].src;
    });
  }

  // Cerrar modal
  modal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  /* =========================
     SWIPE MOBILE
  ========================= */

  let touchStartX = 0;
  let touchEndX = 0;

  modalImg.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
  });

  modalImg.addEventListener("touchend", e => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;

    if (diff > 50 && imagenesActuales.length > 1) {
      indiceActual = (indiceActual + 1) % imagenesActuales.length;
      modalImg.src = imagenesActuales[indiceActual].src;
    }

    if (diff < -50 && imagenesActuales.length > 1) {
      indiceActual =
        (indiceActual - 1 + imagenesActuales.length) %
        imagenesActuales.length;
      modalImg.src = imagenesActuales[indiceActual].src;
    }
  });
}

/* =========================
   INIT
========================= */

cargarCarrito();
actualizarCarritoFloat();
