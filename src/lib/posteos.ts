import { MARCA } from "@/lib/marca";
import { FUEL_LABELS } from "@/types/vehicle";
import type { PlantillaPosteo } from "@/components/dealer/generador-posteo";

interface AutoPosteo {
  brand: string;
  model: string;
  version: string | null;
  year: number;
  mileageKm: number;
  fuelType: keyof typeof FUEL_LABELS;
}

interface Agencia {
  addressStreet: string | null;
  addressCity: string | null;
  province: string | null;
  phone: string | null;
}

const km = (n: number) => `${new Intl.NumberFormat("es-AR").format(n)}km`;
const direccion = (a: Agencia) => [a.addressStreet, a.addressCity, a.province].filter(Boolean).join(", ");
const hashtags = (a: AutoPosteo) =>
  `#${MARCA.nombreCorto} #${a.brand.replace(/\s/g, "")} #${a.model.replace(/\s/g, "")} #usados #autos`;

/** Textos con el mismo tono que los posteos de la agencia en Instagram. */
export function plantillasIngreso(a: AutoPosteo, ag: Agencia): PlantillaPosteo[] {
  const titulo = `${a.brand} ${a.model}`;
  const detalle = [
    a.version ? `Versión ${a.version} - Modelo ${a.year}` : `Modelo ${a.year}`,
    a.mileageKm > 0 ? `${km(a.mileageKm)} - ${FUEL_LABELS[a.fuelType]}` : FUEL_LABELS[a.fuelType],
  ].join("\n");
  const visita = `📍 Te esperamos en ${direccion(ag)}${ag.phone ? `\n📲 ${ag.phone}` : ""}`;
  return [
    {
      id: "ingreso",
      nombre: "Nuevo Ingreso",
      antetitulo: "Nuevo Ingreso",
      titulo,
      detalle,
      pie: `Vení a descubrir tu próximo vehículo en *${MARCA.nombre}*`,
      epigrafe: `🚗 NUEVO INGRESO\n${titulo}${a.version ? ` ${a.version}` : ""} · ${a.year}${a.mileageKm > 0 ? ` · ${km(a.mileageKm)}` : ""}\n\n${visita}\n${MARCA.eslogan} 🏆\n\n${hashtags(a)}`,
    },
    {
      id: "usados",
      nombre: "Usados Seleccionados",
      antetitulo: "Usados Seleccionados",
      titulo,
      detalle,
      pie: `Te esperamos en ${direccion(ag)} - ${MARCA.eslogan} -`,
      epigrafe: `✨ USADOS SELECCIONADOS\n${titulo} ${a.year}${a.mileageKm > 0 ? ` · ${km(a.mileageKm)}` : ""}\n\n${visita}\n\n${hashtags(a)}`,
    },
    {
      id: "0km",
      nombre: "0 km",
      antetitulo: "Nuevo 0km",
      titulo,
      detalle: a.version ? `Versión ${a.version}\nContamos con todas las versiones` : "Contamos con todas las versiones",
      pie: `Tu nuevo 0km lo obtenés con *${MARCA.nombre}*`,
      epigrafe: `🆕 ${titulo} 0KM\nConsultanos por todas las versiones y formas de pago.\n\n${visita}\n\n${hashtags(a)} #0km`,
    },
  ];
}

/**
 * Posteos de entrega con el formato de los que ya publica la agencia: el nombre
 * del comprador y el de la agencia van en negrita (entre *asteriscos*).
 */
export function plantillasEntrega(a: AutoPosteo, comprador: { fullName: string; city: string | null }): PlantillaPosteo[] {
  const nombre = comprador.fullName.trim().replace(/\s+/g, " ");
  const primerNombre = nombre.split(" ")[0];
  const localidad = comprador.city ? ` de la localidad de ${comprador.city}` : "";
  const auto = `${a.brand} ${a.model}`;
  return [
    {
      id: "entrega",
      nombre: "Nueva Entrega",
      antetitulo: "Nueva Entrega",
      titulo: auto,
      detalle: "",
      pie: `Felicitaciones *${nombre}* por su nueva adquisición`,
      epigrafe: `🎉 ENTREGA\n\n${nombre} ya es dueño de su ${auto}. Otra entrega más que nos llena de orgullo, gracias a la confianza de siempre.\n\n${MARCA.eslogan} acompañando a quienes eligen moverse a su manera.\n\n📲 ¿Querés ser el próximo? Consultanos hoy.\n\n${hashtags(a)} #entrega`,
    },
    {
      id: "entrega-localidad",
      nombre: "Nueva Entrega (con localidad)",
      antetitulo: "",
      titulo: "Nueva Entrega",
      detalle: `Felicitaciones ${nombre}${localidad}`,
      pie: `Gracias por confiar en los servicios de *${MARCA.nombre}*`,
      epigrafe: `¡Ya rueda el ${auto} de ${primerNombre}! 🚙\n\n${comprador.city ? `Desde ${comprador.city} nos eligieron para dar este paso. ` : ""}Gracias por confiar en nosotros. Ahora a disfrutarlo en cada viaje. 🙌\n\n¿Querés la próxima llave en tu mano? Envianos un DM o escribinos por WhatsApp 📲\n\n${hashtags(a)} #entrega`,
    },
    {
      id: "felicitaciones",
      nombre: "Felicitaciones",
      antetitulo: "",
      titulo: "¡Felicitaciones!",
      detalle: `${nombre}${comprador.city ? ` de ${comprador.city}` : ""} por su nuevo ${auto}`,
      pie: `Gracias por elegir *${MARCA.nombre}*`,
      epigrafe: `🎉 ¡Felicitaciones ${primerNombre}!\nQue disfrutes mucho tu nuevo ${auto}.\n\n${hashtags(a)}`,
    },
  ];
}
