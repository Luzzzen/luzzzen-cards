# Luzzzen Cards

Tienda de cartas de fútbol coleccionables, firmas, jerseys y accesorios.
Sitio estático en GitHub Pages (`luzzzen.com.ar`) con los productos en Supabase y panel de admin propio.

- **Instagram:** @luzzzen.cards
- **WhatsApp pedidos:** +54 9 11 2560-8635
- **Entregas:** domingos en Parque Rivadavia · envíos a todo el país a cargo del comprador

---

## Cómo está armado

```
/
├── index.html          → Inicio: buscador, categorías, últimas agregadas, ofertas, "Abrí un sobre"
├── catalogo.html       → Catálogo con filtros y orden (?cat=cartas | firmas-jerseys | accesorios)
├── carta.html          → Página de cada producto (?id=LZ-000123)
├── admin.html          → Panel (no aparece en buscadores)
├── cartas.html, jerseys.html, firmas.html, sobres.html
│                       → Páginas viejas: redirigen al catálogo nuevo para no romper links
├── 404.html
├── css/
│   ├── estilos.css     → Tienda (paleta azul Chelsea + naranja Costa de Marfil)
│   └── admin.css       → Panel
├── js/
│   ├── config.js       → Datos de Supabase, WhatsApp, Instagram, categorías
│   ├── comun.js        → Cabecera, pie, tarjetas, carrito y códigos de descuento
│   ├── datos.js        → Trae los productos de Supabase (con copia de respaldo en el navegador)
│   ├── inicio.js, catalogo.js, carta.js
│   └── admin.js        → Panel: productos, códigos e importador
├── img/                → Logo
├── supabase/esquema.sql → Base de datos completa (tablas, permisos, fotos)
└── .github/workflows/mantener-supabase.yml → Evita que Supabase pause el proyecto
```

## Base de datos (Supabase)

| Tabla | Para qué |
|---|---|
| `productos` | Todo el catálogo. El ID (`LZ-000222`…) se asigna solo. |
| `codigos` | Códigos de descuento. Nadie de afuera puede leer la lista: la tienda solo pregunta si un código vale (`validar_codigo`). |
| `admins` | Mails que pueden usar el panel. |

Las fotos van al bucket público `fotos`. El panel las achica a 1000 px en WebP (~50 KB cada una) antes de subirlas.

**Orden:** por fecha de carga, lo último primero. Ya no hay que tocar ningún `CORTE`.
**Oferta:** si un producto tiene "precio antes" mayor al precio, se muestra tachado con el % de descuento.
**Vendidos:** siguen visibles con la etiqueta "Vendida" y van al final del listado. Para sacarlos, apagá "Visible".

## Cargar productos

1. Entrá a `luzzzen.com.ar/admin.html`.
2. **+ Nuevo producto** → arrastrá la foto del frente (y del dorso, si tiene) → completá → **Guardar**.
3. Para cargar una tanda: **Guardar y cargar otro** deja la misma categoría, colección y año.

Para marcar algo como vendido u ocultarlo, usá los interruptores de la lista. No hace falta abrirlo.

## Códigos de descuento

Pestaña **Códigos de descuento**: porcentaje o monto fijo, interruptor de activo, vencimiento opcional (se apaga solo) y compra mínima opcional.
El descuento se aplica sobre el total de productos, ya con las ofertas. El cliente lo escribe en el carrito (da igual mayúsculas o minúsculas) y sale en el mensaje de WhatsApp.

> El mensaje de WhatsApp se puede editar antes de mandarlo, así que alguien podría inventar un descuento a mano. Como cada pedido lo confirmás vos, lo ves antes de cobrar.

## Puesta en marcha (una sola vez)

1. Supabase → **SQL Editor** → pegar `supabase/esquema.sql` (con tu mail en la última línea) → **Run**.
2. Supabase → **Authentication → Users → Add user**: tu mail y una contraseña (marcá "Auto Confirm User").
3. Supabase → **Authentication → Sign In / Providers**: apagá **Allow new users to sign up**.
4. Subir el sitio al repo.
5. En el panel, pestaña **Importar** → **Importar productos**. Cuando termine sin errores, borrar `productos.json` y la carpeta `imagenes/` del repo.
6. GitHub → pestaña **Actions** → "Mantener Supabase activo" → **Run workflow** una vez para probarlo.
