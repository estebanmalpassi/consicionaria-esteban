/**
 * Identidad de la concesionaria. La app es de uso interno de una sola agencia,
 * así que nombre, logo y textos de marca viven acá (los datos fiscales siguen
 * en la tabla Dealership y se cargan desde la app).
 */
export const MARCA = {
  nombre: "Cartuccia Automotores",
  nombreCorto: "Cartuccia",
  eslogan: "Más de 25 años de trayectoria",
  instagram: "automotores_cartuccia",
  /** Escudo con fondo transparente (papeles, login). */
  logoEscudo: "/marca/logo-escudo.png",
  /** Escudo dentro del círculo azul (encabezado, posteos). */
  logoCirculo: "/marca/logo-circulo.png",

  // --- Portada pública ---------------------------------------------------
  /** WhatsApp de la agencia (Javier): solo dígitos, con código de país, para wa.me. */
  whatsappNumero: "5493585090730",
  whatsappVisible: "358 509-0730",
  instagramUrl: "https://www.instagram.com/automotores_cartuccia/",
  direccion: "Fray Mamerto Esquiú 57, Berrotarán, Córdoba",
  /** Departamento de la provincia (lo pide el encabezado del boleto). */
  departamento: "Río Cuarto",
  referencia: "Frente a la plaza principal",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Fray+Mamerto+Esqui%C3%BA+57%2C+Berrotar%C3%A1n%2C+C%C3%B3rdoba",
  /** Video vertical de la portada (reemplazar los archivos para cambiarlo). */
  videoFuentes: [
    { src: "/video/inicio.webm", type: "video/webm" },
    { src: "/video/inicio.mp4", type: "video/mp4" },
  ],
  videoPoster: "/video/inicio.jpg",
  historia: [
    "Comenzó hace más de 25 años de la mano de Osvaldo Cartuccia.",
    "En 2018, Javier Cartuccia se unió al equipo para dirigir y desarrollar juntos la agencia.",
  ],
} as const;

/** Link a WhatsApp de la agencia con un mensaje ya escrito. */
export function linkWhatsapp(mensaje: string) {
  return `https://wa.me/${MARCA.whatsappNumero}?text=${encodeURIComponent(mensaje)}`;
}
