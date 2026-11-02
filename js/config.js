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
  diasNuevo: 7,            // "Nuevo" en las cartas agregadas hace menos de X días

  categorias: [
    { id: 'cartas',         nombre: 'Cartas individuales', corto: 'Cartas' },
    { id: 'firmas-jerseys', nombre: 'Firmas y jerseys',    corto: 'Firmas/Jerseys' },
    { id: 'accesorios',     nombre: 'Accesorios',          corto: 'Accesorios' }
  ]
};
