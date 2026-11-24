import { createPlayer } from "./youtube.js";

export class Intro {
  constructor(root, { onStart } = {}) {
    if (!root) {
      throw new Error("No se encontró la vista introductoria.");
    }

    this.root = root;
    this.title = root.querySelector(".intro__title");
    this.lead = root.querySelector(".intro__lead");
    this.description = root.querySelector(".intro__description");
    this.button = root.querySelector(".intro__button");
    this.videoWrap = root.querySelector(".intro__video-wrap");
    this.onStart = onStart;

    this.isOpen = false;
    this.onKeyDown = this.onKeyDown.bind(this);

    this.button.addEventListener("click", () => this.finish());
  }

  show(config) {
    const player = createPlayer(config.video, {
      title: "Zaquesazipa Documental",
      className: "intro__video",
      autoplay: false
    });

    if (!player) {
      return false;
    }

    player.setAttribute("tabindex", "-1");

    this.clearVideo();
    this.videoWrap.appendChild(player);
    this.videoWrap.hidden = false;

    this.title.textContent = config.titulo;
    
const [first, ...rest] = config.texto.split(" • ");

this.lead.replaceChildren();

if (rest.length > 0) {
  const bold = document.createElement("strong");
  bold.textContent = first;

  const regular = document.createElement("span");
  regular.textContent = ` • ${rest.join(" • ")}`;

  this.lead.append(bold, regular);
} else {
  this.lead.textContent = config.texto;
}


    this.lead.hidden = config.texto.length === 0;
    this.description.textContent = config.descripcion || "";
this.description.hidden = !config.descripcion;
    this.button.textContent = config.boton;

    this.root.classList.remove("intro--closing");
    this.root.hidden = false;
    this.root.removeAttribute("inert");
    this.root.setAttribute("aria-hidden", "false");

    this.isOpen = true;
    document.addEventListener("keydown", this.onKeyDown, true);

    window.requestAnimationFrame(() => {
      this.button.focus({ preventScroll: true });
    });

    return true;
  }

  finish() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    document.removeEventListener("keydown", this.onKeyDown, true);

    this.root.classList.add("intro--closing");
    this.root.setAttribute("aria-hidden", "true");
    this.root.setAttribute("inert", "");

    this.clearVideo();

    window.setTimeout(() => {
      if (!this.isOpen) {
        this.root.hidden = true;
        this.root.classList.remove("intro--closing");
      }
    }, 520);

    if (typeof this.onStart === "function") {
      this.onStart();
    }
  }

  clearVideo() {
    this.videoWrap.replaceChildren();
    this.videoWrap.hidden = true;
  }

  onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.finish();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      this.button.focus({ preventScroll: true });
    }
  }
}
