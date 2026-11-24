import { loadPersonas } from "./data.js";
import { Carousel } from "./carousel.js";
import { Modal } from "./modal.js";
import { Intro } from "./intro.js";
import { getEmbedUrl } from "./youtube.js";
import { fitText } from "./fit-text.js";

const VARIANTS = ["olive", "terracotta"];
const appState = { introOpen: false };

const refs = {
  carousel: document.getElementById("carousel"),
  track: document.getElementById("carouselTrack"),
  carouselStatus: document.getElementById("carouselStatus"),
  navigation: document.getElementById("navigation"),
  prevButton: document.getElementById("prevButton"),
  nextButton: document.getElementById("nextButton"),
  homeButton: document.getElementById("homeButton"),
  currentLabel: document.getElementById("pageCurrent"),
  totalLabel: document.getElementById("pageTotal"),
  progress: document.getElementById("pageProgress"),
  status: document.getElementById("appStatus"),
  modal: document.getElementById("personModal"),
  intro: document.getElementById("intro")
};

init();

async function init() {
  const modal = new Modal(refs.modal);
  const intro = new Intro(refs.intro, {
    onStart: startExperience
  });

  refs.status.hidden = false;

  if (window.location.protocol === "file:") {
    showError(new Error("Abre el folleto desde un servidor HTTP local para cargar sus datos."));
    return;
  }

  try {
    const content = await loadPersonas();

  //renderCover(content);
    content.personas.forEach((persona, index) => {
      renderPersona(persona, index, modal);
    });

    createCarousel(modal);
if (content.intro) {
  refs.homeButton.addEventListener("click", () => {
    appState.introOpen = true;
    refs.carousel.setAttribute("inert", "");
    refs.navigation.hidden = true;

    const shown = intro.show(content.intro);

    if (!shown) {
      startExperience({ focus: false });
    }
  });
}
    document.title = `${content.titulo} · Documental Zaquesazipa`;
    refs.status.hidden = true;

    if (content.intro) {
      appState.introOpen = true;
      refs.carousel.setAttribute("inert", "");
      const shown = intro.show(content.intro);

      if (!shown) {
        startExperience({ focus: false });
      }
    } else {
      startExperience({ focus: false });
    }
  } catch (error) {
    console.error(error);
    showError(error);
  }
}

function startExperience({ focus = true } = {}) {
  appState.introOpen = false;
  refs.carousel.removeAttribute("inert");
  refs.navigation.hidden = false;

  if (focus) {
    window.requestAnimationFrame(() => {
      refs.nextButton.focus({ preventScroll: true });
    });
  }
}

function createCarousel(modal) {
  const slides = refs.track.querySelectorAll(".carousel__slide");

  if (slides.length === 0) {
    throw new Error("No hay páginas para mostrar en el folleto.");
  }

  return new Carousel({
    track: refs.track,
    slides,
    prevButton: refs.prevButton,
    nextButton: refs.nextButton,
    currentLabel: refs.currentLabel,
    totalLabel: refs.totalLabel,
    progress: refs.progress,
    status: refs.carouselStatus,
    canNavigate: () => !modal.isOpen && !appState.introOpen
  });
}

function renderCover(content) {
  const slide = createSlide("carousel__slide--cover", content.titulo);
  slide.dataset.label = "Portada";

  const cover = el("article", "cover");

  cover.append(
    decorativeImage("cover__decor cover__decor--leaves", "assets/images/botanical-decoration.svg"),
    decorativeImage("cover__decor cover__decor--brush", "assets/images/brush-saffron.svg")
  );

  const contentBox = el("div", "cover__content");
  const title = buildTitle(content.titulo);
  contentBox.append(title);

  const dash = el("span", "cover__dash");
  dash.setAttribute("aria-hidden", "true");

  const subtitle = el("p", "cover__subtitle");
  subtitle.textContent = content.subtitulo;

  contentBox.append(dash, subtitle);

  cover.append(contentBox);
  slide.append(cover);
  refs.track.append(slide);
  fitText(title);

  if (!content.subtitulo) {
    subtitle.hidden = true;
  }
}

function buildTitle(title) {
  const heading = document.createElement("h1");
  heading.className = "cover__title";
  heading.setAttribute("aria-label", title);

  const words = title.split(/\s+/).filter(Boolean);
  const [first, ...rest] = words;

  const firstLine = el("span", "cover__title-line cover__title-line--first");
  firstLine.textContent = first ?? title;
  heading.append(firstLine);

  if (rest.length === 0) {
    return heading;
  }

  const secondLine = el("span", "cover__title-line cover__title-line--second");
  const [maybeConnector, ...tail] = rest;
  const isConnector = rest.length >= 2 && maybeConnector.length <= 2;

  if (isConnector) {
    const conjunction = el("span", "cover__title-conjunction");
    conjunction.textContent = maybeConnector;

    const word = el("span", "cover__title-word");
    word.textContent = tail.join(" ");

    secondLine.append(conjunction, word);
  } else {
    const word = el("span", "cover__title-word");
    word.textContent = rest.join(" ");
    secondLine.append(word);
  }

  heading.append(secondLine);
  return heading;
}

function renderPersona(persona, index, modal) {
  const variant = VARIANTS[index % VARIANTS.length];
  const slide = createSlide("carousel__slide--person", persona.nombre);
  slide.dataset.label = persona.nombre;

  const person = el("article", "person");
  const figure = el("figure", "person__figure");

  const mediaButton = el("button", "person__media");
  mediaButton.type = "button";
  mediaButton.setAttribute("aria-haspopup", "dialog");
  mediaButton.setAttribute("aria-controls", "personModal");
  mediaButton.setAttribute("aria-label", `Abrir la historia de ${persona.nombre}`);

  const image = el("img", "person__image person__image--interactive");
  image.src = persona.imagen;
  image.alt = `Retrato de ${persona.nombre}`;
  image.width = 900;
  image.height = 900;
  image.decoding = "async";
  image.loading = index === 0 ? "eager" : "lazy";
  image.draggable = false;

  const overlay = el("span", "person__overlay");
  overlay.setAttribute("aria-hidden", "true");

  const story = el("span", "person__story");
  const hasVideo = Boolean(getEmbedUrl(persona.video));
  story.append(createPlayIcon(), document.createTextNode(hasVideo ? "Ver historia" : "Leer historia"));
  overlay.append(story);

  mediaButton.append(image, overlay);
  mediaButton.addEventListener("click", () => {
    modal.open(persona, { variant });
  });

  const brush = el(
    "div",
    variant === "terracotta" ? "person__brush person__brush--terracotta" : "person__brush"
  );

  const name = document.createElement("h2");
  name.className = "person__name";
  name.textContent = persona.nombre;

  brush.append(name);

  figure.append(mediaButton, brush);

  person.append(
    decorativeImage("person__decor person__decor--top", "assets/images/botanical-decoration.svg"),
    figure,
    decorativeImage("person__decor person__decor--bottom", "assets/images/botanical-decoration.svg")
  );

  slide.append(person);
  refs.track.append(slide);
  fitText(name);
}

function createSlide(modifier, label) {
  const slide = document.createElement("section");
  slide.className = `carousel__slide ${modifier}`;
  slide.setAttribute("role", "group");
  slide.setAttribute("aria-roledescription", "diapositiva");
  slide.setAttribute("aria-label", label);
  return slide;
}

function decorativeImage(className, src) {
  const image = el("img", className);
  image.src = src;
  image.alt = "";
  image.decoding = "async";
  image.setAttribute("aria-hidden", "true");
  return image;
}

function createPlayIcon() {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("class", "person__story-icon");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const path = document.createElementNS(namespace, "path");
  path.setAttribute("d", "M5 3.4v9.2L12 8 5 3.4Z");
  path.setAttribute("fill", "currentColor");

  svg.append(path);
  return svg;
}

function el(tagName, className) {
  const element = document.createElement(tagName);
  element.className = className;
  return element;
}

function showError(error) {
  refs.track.replaceChildren();
  refs.navigation.hidden = true;
  refs.status.hidden = false;
  refs.status.classList.add("status--error");
  refs.status.replaceChildren();

  const message = el("p", "status__text");
  message.textContent = error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado al cargar el folleto.";

  const helper = el("p", "status__text");
  helper.textContent = "Verifica que data/personas.json exista y que el folleto se abra desde un servidor HTTP local.";

  const retry = el("button", "status__retry");
  retry.type = "button";
  retry.textContent = "Reintentar";
  retry.addEventListener("click", () => window.location.reload());

  refs.status.append(message, helper, retry);
}
