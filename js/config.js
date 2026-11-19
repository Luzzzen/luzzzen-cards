/* ===== Configuración general ===== */

window.CONFIG = {
  supabase: {
    url: 'https://pepqbpayfneibyvducbl.supabase.co',
    key: 'sb_publishable_LK4ZcfMcoxvQwegHAxK7yQ_0-9H2kiB'   // clave pública, se puede compartir
  },

  marca: 'Luzzzen Cards',
  whatsapp: '5491125608635',
  instagram: 'https://instagram.com/luzzzen.cards',
  instagramUsuario: '@luzzzen.cards',

  entrega: 'Entregas sin cargo los domingos en Parque Rivadavia. Envíos a todo el país a cargo del comprador.',

  porPagina: 24,

  // "Abrí un sobre": comprar las 3 cartas juntas tiene descuento
  sobre: {
    descuento: 10,         // % de descuento por llevar el sobre entero
    porDia: 5,             // cuántos sobres por día vienen con la oferta (por navegador)
    raras: 0.12,           // el 12% de cartas más caras cuentan como "raras"
    // Probabilidad de que en un sobre salgan 0, 1, 2 o 3 raras
    chances: [0.55, 0.35, 0.09, 0.01]
  },
  diasNuevo: 7,            // "Nuevo" en las cartas agregadas hace menos de X días

  categorias: [
    { id: 'cartas',         nombre: 'Cartas individuales', corto: 'Cartas' },
    { id: 'firmas-jerseys', nombre: 'Firmas y jerseys',    corto: 'Firmas/Jerseys' },
    { id: 'accesorios',     nombre: 'Accesorios',          corto: 'Accesorios' }
  ]
};
