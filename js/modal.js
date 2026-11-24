import { createPlayer } from "./youtube.js";
import { fitText } from "./fit-text.js";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export class Modal {
  constructor(root) {
    if (!root) {
      throw new Error("No se encontró la estructura del modal.");
    }

    this.root = root;
    this.dialog = root.querySelector(".modal__dialog");
    this.closeButton = root.querySelector(".modal__close");
    this.photo = root.querySelector(".modal__photo");
    this.brush = root.querySelector(".modal__brush");
    this.name = root.querySelector(".modal__name");
    this.context = root.querySelector(".modal__context");
    this.videoWrap = root.querySelector(".modal__video-wrap");

    this.isOpen = false;
    this.lastFocusedElement = null;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onRootClick = this.onRootClick.bind(this);

    this.closeButton.addEventListener("click", () => this.close());
    this.root.addEventListener("click", this.onRootClick);
  }

  open(person, { variant = "olive" } = {}) {
    if (!person || this.isOpen) {
      return;
    }

    this.populate(person, variant);

    this.lastFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    this.isOpen = true;
    this.root.removeAttribute("inert");
    this.root.setAttribute("aria-hidden", "false");
    this.root.classList.add("modal--open");
    document.addEventListener("keydown", this.onKeyDown, true);

    window.requestAnimationFrame(() => {
      this.dialog.scrollTop = 0;
      this.closeButton.focus({ preventScroll: true });
    });
  }

  close() {
    if (!this.isOpen) {
      return;
    }

    this.isOpen = false;
    this.root.classList.remove("modal--open");
    this.root.setAttribute("aria-hidden", "true");
    this.root.setAttribute("inert", "");
    document.removeEventListener("keydown", this.onKeyDown, true);

    this.clearVideo();

    if (this.lastFocusedElement && this.lastFocusedElement.isConnected) {
      this.lastFocusedElement.focus({ preventScroll: true });
    }

    this.lastFocusedElement = null;
  }

  populate(person, variant) {
    this.name.textContent = person.nombre;
    fitText(this.name);
    this.photo.src = person.imagen;
    this.photo.alt = `Retrato de ${person.nombre}.`;
    this.context.innerHTML = person.contexto || "Esta historia estará disponible muy pronto.";
    this.brush.classList.toggle("modal__brush--terracotta", variant === "terracotta");

    this.clearVideo();

    const player = createPlayer(person.video, {
      title: `Video de la historia de ${person.nombre}`
    });

    if (player) {
      this.videoWrap.appendChild(player);
      this.videoWrap.hidden = false;
    }
  }

  clearVideo() {
    this.videoWrap.replaceChildren();
    this.videoWrap.hidden = true;
  }

  onRootClick(event) {
    if (event.target === this.root) {
      this.close();
    }
  }

  onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(this.dialog.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter((element) => element.getClientRects().length > 0);

    if (focusable.length === 0) {
      event.preventDefault();
      this.dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && (current === first || !this.dialog.contains(current))) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && (current === last || !this.dialog.contains(current))) {
      event.preventDefault();
      first.focus();
    }
  }
}
