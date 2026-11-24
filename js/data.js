const DEFAULT_ENDPOINT = "data/personas.json";
const ALLOWED_IMAGE_PROTOCOLS = new Set(["http:", "https:", "file:"]);

export async function loadPersonas(endpoint = DEFAULT_ENDPOINT) {
  let response;

  try {
    response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
  } catch (cause) {
    throw new Error("No se pudo conectar con el archivo de contenido.", { cause });
  }

  if (!response.ok) {
    throw new Error(`No se pudo cargar el contenido (HTTP ${response.status}).`);
  }

  let raw;

  try {
    raw = await response.json();
  } catch (cause) {
    throw new Error("El archivo de contenido no es un JSON válido.", { cause });
  }

  return normalizeContent(raw);
}

function normalizeContent(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("La estructura del contenido no es válida.");
  }

  if (!Array.isArray(raw.personas) || raw.personas.length === 0) {
    throw new Error("El folleto necesita al menos una persona para mostrarse.");
  }

  const seenIds = new Set();

  const personas = raw.personas.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`La persona número ${index + 1} no tiene datos válidos.`);
    }

    const nombre = readText(item.nombre);

    if (!nombre) {
      throw new Error(`La persona número ${index + 1} necesita un nombre.`);
    }

    const imagen = readText(item.imagen);

    if (!imagen || !isValidImageSource(imagen)) {
      throw new Error(`La imagen de "${nombre}" no es una ruta válida.`);
    }

    const id = normalizeId(item.id, index);

    if (seenIds.has(String(id))) {
      throw new Error(`El identificador de "${nombre}" está repetido.`);
    }

    seenIds.add(String(id));

    return Object.freeze({
      id,
      nombre,
      imagen,
      contexto: readText(item.contexto_imagen) ?? "",
      video: readText(item.video_youtube) ?? ""
    });
  });

  return Object.freeze({
    titulo: readText(raw.titulo) ?? "Zaquesazipa Documental",
    subtitulo: readText(raw.subtitulo) ?? "",
    personas: Object.freeze(personas),
    intro: normalizeIntro(raw.intro)
  });
}

function normalizeIntro(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const video = readText(raw.video_youtube);

  if (!video) {
    return null;
  }

  return Object.freeze({
  titulo: readText(raw.titulo) ?? "Zaquesazipa Documental",
  texto: readText(raw.texto) ?? "",
  descripcion: readText(raw.descripcion) ?? "",
  video,
  boton: readText(raw.boton) ?? "Comenzar la experiencia"
});
}

function readText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeId(value, index) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return index + 1;
}

function isValidImageSource(source) {
  try {
    const url = new URL(source, document.baseURI);
    return ALLOWED_IMAGE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}
