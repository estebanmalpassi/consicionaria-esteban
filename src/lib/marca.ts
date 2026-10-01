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
} as const;
