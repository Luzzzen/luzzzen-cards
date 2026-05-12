# Luzzzen Cards

Tienda de cartas coleccionables de fútbol. Sitio estático hosteado en GitHub Pages.

**URL:** https://luzzzen.github.io/luzzzen-cards  
**Repo:** https://github.com/Luzzzen/luzzzen-cards  
**Instagram:** @luzzzen.cards  
**WhatsApp pedidos:** +5491125608635  
**Entregas:** Domingos en Parque Rivadavia

---

## Estructura de archivos

```
/
├── index.html           → Página principal
├── cartas.html          → Catálogo de cartas individuales
├── jerseys.html         → Catálogo de Jerseys y Firmas (categorías "jerseys" + "firmas")
├── firmas.html          → Catálogo de Cajas y Sobres (categoría "cajas-sobres")
├── sobres.html          → Catálogo de Accesorios (categoría "sobres")
├── productos.json       → Base de datos de todos los productos
├── style.css            → Estilos globales (paleta azul profundo + naranja)
├── index-productos.js   → Lógica exclusiva del index (carta sorpresa + últimas agregadas)
├── js/
│   ├── render-catalogo.js  → Renderiza catálogo, buscador y paginación
│   └── carrito.js          → Lógica del carrito (localStorage, drawer, WhatsApp)
└── imagenes/
    └── [carpeta-por-dia]/  → Fotos organizadas por fecha de carga (ej: 5-11/)
```

---

## Categorías

Las categorías se definen en el campo `"categoria"` de cada producto en `productos.json`.

| Valor en JSON     | Página          | Muestra como       |
|-------------------|-----------------|--------------------|
| `cartas`          | cartas.html     | Cartas             |
| `jerseys`         | jerseys.html    | Jerseys y Firmas   |
| `firmas`          | jerseys.html    | Jerseys y Firmas   |
| `cajas-sobres`    | firmas.html     | Cajas y Sobres     |
| `sobres`          | sobres.html     | Accesorios         |

> `jerseys.html` filtra por ambas categorías (`jerseys` y `firmas`) a la vez.  
> Los nombres de los archivos HTML no cambiaron para no romper links existentes.

---

## Estructura de un producto en productos.json

```json
{
  "id": "LZ-000169",
  "categoria": "cartas",
  "jugador": "Nombre del jugador",
  "equipo": "Equipo",
  "coleccion": "Panini WCCF",
  "anio": "2014-2015",
  "nombre": "Jugador - Equipo - Colección - Año",
  "precio": 3000,
  "vendido": "",
  "carpeta": "5-11/",
  "frente": "LZ-000169-front",
  "dorso": "LZ-000169-back",
  "jpgref": ".jpg",
  "imagen_front": "5-11/LZ-000169-front.jpg",
  "imagen_back": "5-11/LZ-000169-back.jpg"
}
```

- `"vendido": "x"` → la carta aparece como vendida y el botón queda deshabilitado.
- `"imagen_back": ""` → carta sin dorso, no muestra segunda imagen.

---

## IDs

Formato: `LZ-XXXXXX` (número de 6 dígitos con ceros a la izquierda).  
El último ID cargado es el más alto en el JSON.  
Siempre revisar cuál es el próximo ID disponible antes de cargar.

---

## Orden de visualización en el catálogo

Las cartas se ordenan por tanda de carga: **la tanda más reciente aparece primero**, y dentro de cada tanda el orden es **ascendente** (la primera carta cargada en esa tanda aparece antes).

La lógica está en `js/render-catalogo.js`:

```js
const CORTE = 168; // ← actualizar este número con cada nueva carga
// Todo lo que tenga ID > CORTE es "tanda nueva" y aparece primero
.sort((a, b) => {
  const numA = parseInt(a.id.toString().replace(/\D/g, ""));
  const numB = parseInt(b.id.toString().replace(/\D/g, ""));
  const tandaA = numA > CORTE ? 1 : 0;
  const tandaB = numB > CORTE ? 1 : 0;
  if (tandaB !== tandaA) return tandaB - tandaA;
  return numA - numB;
});
```

**⚠️ Cada vez que cargues una tanda nueva, actualizá el número `CORTE`** al último ID de la tanda anterior. Por ejemplo, si la tanda anterior terminó en LZ-000214, el CORTE pasa a ser `214`.

---

## Flujo de carga de cartas nuevas

1. **Sacar fotos** con el Samsung S20FE (frente y dorso de cada carta).
2. **Pasar fotos a la PC** via Google Fotos o cable USB.
3. **Comprimir fotos** con IrfanView:
   - File → Batch Conversion/Rename
   - Output: JPG, calidad 60-65
   - Resize: ancho máximo 800px
4. **Renombrar fotos** al formato `LZ-XXXXXX-front.jpg` / `LZ-XXXXXX-back.jpg`.  
   Usar el script `.bat` generado por el Cargador, o armar uno manualmente.
5. **Cargar datos** con el Cargador (`luzzzen-cargador.html`, abrirlo en Chrome localmente):
   - Subir las fotos del día
   - Ingresar ID inicial y carpeta del día (ej: `5-11`)
   - Emparejar frente y dorso de cada carta
   - Completar datos (jugador, equipo, colección, precio, categoría)
   - Generar y descargar el JSON
6. **Mergear el JSON**: pegar el contenido generado al final de `productos.json`, antes del último `]`. Agregar una coma después del último item existente.
7. **Subir al repo** via GitHub online:
   - Subir las imágenes a la carpeta del día en `/imagenes/`
   - Actualizar `productos.json`
   - Actualizar el `CORTE` en `js/render-catalogo.js`

---

## Herramientas locales

### luzzzen-cargador.html
Abrirlo en Chrome. No requiere instalación ni servidor.  
Genera el JSON de cartas nuevas usando el nombre original de cada foto.  
No renombra archivos — el renombrado se hace aparte con el `.bat`.

---

## Diseño

- **Paleta:** azul profundo (`#060e1a`) + naranja (`#e67e22`) + blanco
- **Fuentes:** Inter (body) + Playfair Display (títulos)
- **Cartas:** fondo blanco, hover con zoom, flip al pasar el mouse si tiene dorso
- **Responsive:** mobile-first, buscador, paginación de 24 items por página
- **Lazy loading** activado en todas las imágenes del catálogo

---

## Notas varias

- El JSON no tiene un campo de fecha de carga — el orden se maneja por el número de ID y el valor `CORTE` en el JS.
- `productos.js` (en la raíz) es un archivo legacy con 4 productos de prueba. No se usa en producción, no borrar por las dudas.
- El carrito usa `localStorage` para persistir entre páginas.
- Los pedidos se envían por WhatsApp con un mensaje pre-armado que incluye todos los productos y el total.
