/* =========================
   ESTADO GLOBAL
========================= */

let items = [];
let total = 0;

/* =========================
   ELEMENTOS DOM
========================= */

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
    items.forEach(item =>
  agregarItemDOM(item.nombre, item.precio, item.imagen)
);
  }

  actualizarTotal();
  actualizarCarritoFloat();
}

/* =========================
   RENDER PEDIDO (VISTA LARGA)
========================= */

function agregarItemDOM(nombre, precio, imagen) {
  if (!listaPedido) return;

  const li = document.createElement("li");
  li.innerHTML = `
    <div class="item-carrito">
      <img
        src="${imagen}"
        alt="${nombre}"
        class="thumb-carrito"
      >
      <span class="item-texto">
        ${nombre}<br>
        $${precio.toLocaleString()}
      </span>
      <button class="eliminar">✕</button>
    </div>
  `;

  li.querySelector(".eliminar").addEventListener("click", () => {
    eliminarItem(nombre);
  });

  listaPedido.appendChild(li);
}

function eliminarItem(nombre) {
  const item = items.find(i => i.nombre === nombre);
  if (!item) return;

  items = items.filter(i => i.nombre !== nombre);
  total -= item.precio;

  if (listaPedido) {
    [...listaPedido.children].forEach(li => {
      if (li.textContent.includes(nombre)) li.remove();
    });
  }

  guardarCarrito();
  actualizarTotal();
  actualizarCarritoFloat();
}

/* =========================
   TOTALES / FLOAT
========================= */

function actualizarTotal() {
  if (totalTexto) {
    totalTexto.innerText = `Total: $${total.toLocaleString()}`;
  }
}

function actualizarCarritoFloat() {
  if (!carritoFloat) return;

  carritoBadge.innerText = items.length;
  if (items.length) {
    carritoFloat.classList.add("visible");
  } else {
    carritoFloat.classList.remove("visible");
  }
}

/* =========================
   EVENT DELEGATION – AGREGAR
========================= */

document.addEventListener("click", e => {
  const boton = e.target.closest(".agregar");
  if (!boton) return;

  // ⛔ Evitar doble click / spam
  if (boton.dataset.bloqueado === "true") return;

  const nombre = boton.dataset.nombre;
  const precio = parseInt(boton.dataset.precio, 10);
  const imagen = boton.dataset.imagen;

  // ⛔ Evitar duplicados en carrito
  if (items.some(i => i.nombre === nombre)) {
    return;
  }

  /* =========================
     AGREGAR AL CARRITO
  ========================= */

  items.push({
    nombre,
    precio,
    imagen
  });

  total += precio;

  agregarItemDOM(nombre, precio, imagen);
  guardarCarrito();
  actualizarTotal();
  actualizarCarritoFloat();

  /* =========================
     FEEDBACK VISUAL (3 ESTADOS)
  ========================= */

  // Estado 2: agregado
  boton.dataset.bloqueado = "true";
  boton.classList.add("agregado");
  boton.textContent = "✓ Agregado";

  // Estado 3: en el carrito (persistente)
  setTimeout(() => {
    boton.textContent = "En el carrito";
    boton.classList.add("en-carrito");
  }, 900);

  // Mensaje fijo debajo del botón (si no existe)
  if (!boton.nextElementSibling?.classList.contains("mensaje-carrito")) {
    const msg = document.createElement("div");
    msg.className = "mensaje-carrito";
    msg.textContent = "✔ Este producto ya está en tu carrito";
    boton.after(msg);
  }
});

/* =========================
   VACIAR CARRITO
========================= */

if (botonVaciar) {
  botonVaciar.addEventListener("click", () => {
    items = [];
    total = 0;
    if (listaPedido) listaPedido.innerHTML = "";
    guardarCarrito();
    actualizarTotal();
    actualizarCarritoFloat();
  });
}

/* =========================
   WHATSAPP
========================= */

function enviarWhatsapp() {
  if (items.length === 0) {
    alert("No agregaste ningún producto.");
    return;
  }

  let mensaje = `Pedido LZ-${Date.now()}%0A%0A`;

  items.forEach(i => {
    mensaje += `• ${i.nombre} - $${i.precio.toLocaleString()}%0A`;
  });

  mensaje += `%0A Total: $${total.toLocaleString()}`;

  window.open(`https://wa.me/5491125608635?text=${mensaje}`, "_blank");
}

if (botonWhatsapp) botonWhatsapp.addEventListener("click", enviarWhatsapp);
if (drawerWhatsapp) drawerWhatsapp.addEventListener("click", enviarWhatsapp);

/* =========================
   DRAWER
========================= */

function abrirDrawer() {
  if (!drawer) return;

  drawerLista.innerHTML = "";

  items.forEach(item => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="item-carrito">
        <img
          src="${item.imagen}"
          alt="${item.nombre}"
          class="thumb-carrito"
        >
        <span class="item-texto">
          ${item.nombre}<br>
          $${item.precio.toLocaleString()}
        </span>
        <button class="eliminar">✕</button>
      </div>
    `;

    li.querySelector(".eliminar").addEventListener("click", () => {
      eliminarItem(item.nombre);
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

if (carritoFloat) carritoFloat.addEventListener("click", abrirDrawer);
if (cerrarDrawerBtn) cerrarDrawerBtn.addEventListener("click", cerrarDrawer);
if (drawerOverlay) drawerOverlay.addEventListener("click", cerrarDrawer);

if (drawerVaciar) {
  drawerVaciar.addEventListener("click", () => {
    items = [];
    total = 0;
    guardarCarrito();
    cerrarDrawer();
    actualizarTotal();
    actualizarCarritoFloat();
    resetearBotonesAgregar();
  });
}

/* =========================
   ZOOM / MODAL (DINÁMICO)
========================= */

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const flechaIzq = document.querySelector(".flecha.izquierda");
const flechaDer = document.querySelector(".flecha.derecha");

let imagenesActuales = [];
let indiceActual = 0;

document.addEventListener("click", e => {
  const contenedor = e.target.closest(".imagenes-carta");
  if (!contenedor || !modal) return;

  imagenesActuales = Array.from(contenedor.querySelectorAll("img"));
  indiceActual = 0;

  modalImg.src = imagenesActuales[indiceActual].src;
  modal.style.display = "flex";

  const mostrar = imagenesActuales.length > 1 ? "block" : "none";
  flechaIzq.style.display = mostrar;
  flechaDer.style.display = mostrar;
});

if (flechaDer) {
  flechaDer.addEventListener("click", e => {
    e.stopPropagation();
    indiceActual = (indiceActual + 1) % imagenesActuales.length;
    modalImg.src = imagenesActuales[indiceActual].src;
  });
}

if (flechaIzq) {
  flechaIzq.addEventListener("click", e => {
    e.stopPropagation();
    indiceActual =
      (indiceActual - 1 + imagenesActuales.length) % imagenesActuales.length;
    modalImg.src = imagenesActuales[indiceActual].src;
  });
}

if (modal) {
  modal.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

function resetearBotonesAgregar() {
  document.querySelectorAll(".agregar").forEach(btn => {
    btn.dataset.bloqueado = "false";
    btn.classList.remove("agregado", "en-carrito");
    btn.textContent = "Agregar al pedido";
  });
  document.querySelectorAll(".mensaje-carrito").forEach(msg => msg.remove());
}

/* =========================
   INIT
========================= */

cargarCarrito();
actualizarCarritoFloat();
