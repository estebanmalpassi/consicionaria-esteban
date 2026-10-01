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
      pie: `Vení a descubrir tu próximo vehículo en ${MARCA.nombre}`,
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
      pie: `Tu nuevo 0km lo obtenés con ${MARCA.nombre}`,
      epigrafe: `🆕 ${titulo} 0KM\nConsultanos por todas las versiones y formas de pago.\n\n${visita}\n\n${hashtags(a)} #0km`,
    },
  ];
}

export function plantillasEntrega(a: AutoPosteo, comprador: { fullName: string; city: string | null }): PlantillaPosteo[] {
  const nombre = comprador.fullName.trim().split(/\s+/)[0];
  const de = comprador.city ? ` de ${comprador.city}` : "";
  const auto = `${a.brand} ${a.model}`;
  return [
    {
      id: "entrega",
      nombre: "Nueva Entrega",
      antetitulo: "",
      titulo: "Nueva Entrega",
      detalle: `Felicitaciones ${nombre}${de} por tu nuevo ${auto}`,
      pie: `Gracias por confiar en ${MARCA.nombre}`,
      epigrafe: `🔑 ¡NUEVA ENTREGA!\nFelicitaciones ${nombre}${de} por tu nuevo ${auto} 🎉\nGracias por confiar en nosotros.\n\n${hashtags(a)} #entrega`,
    },
    {
      id: "felicitaciones",
      nombre: "Felicitaciones",
      antetitulo: "",
      titulo: "¡Felicitaciones!",
      detalle: `${nombre}${de} por su nuevo ${auto}`,
      pie: `Gracias por elegir ${MARCA.nombre}`,
      epigrafe: `🎉 ¡Felicitaciones ${nombre}!\nQue disfrutes mucho tu nuevo ${auto}.\n\n${hashtags(a)}`,
    },
  ];
}
