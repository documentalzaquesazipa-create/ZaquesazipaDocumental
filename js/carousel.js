const SWIPE_THRESHOLD = 48;
const SWIPE_RATIO = 1.35;

export class Carousel {
  constructor({
    track,
    slides,
    prevButton,
    nextButton,
    currentLabel,
    totalLabel,
    progress,
    status,
    canNavigate = () => true,
    onChange
  }) {
    if (!track || !slides || slides.length === 0) {
      throw new Error("El carrusel necesita diapositivas para funcionar.");
    }

    this.track = track;
    this.slides = Array.from(slides);
    this.total = this.slides.length;
    this.prevButton = prevButton;
    this.nextButton = nextButton;
    this.currentLabel = currentLabel;
    this.totalLabel = totalLabel;
    this.progress = progress;
    this.status = status;
    this.canNavigate = canNavigate;
    this.onChange = onChange;

    this.index = -1;
    this.pointer = null;
    this.suppressClickUntil = 0;
    this.root = track.closest(".carousel") ?? track;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);
    this.handleClickCapture = this.handleClickCapture.bind(this);

    this.bindEvents();
    this.goTo(0, { announce: false });
  }

  next() {
    this.goTo(this.index + 1);
  }

  prev() {
    this.goTo(this.index - 1);
  }

  goTo(target, { announce = true } = {}) {
    if (this.total === 0) {
      return;
    }

    const normalized = ((target % this.total) + this.total) % this.total;
    this.index = normalized;

    this.track.style.transform = `translate3d(-${normalized * 100}%, 0, 0)`;
    this.updateSlides();
    this.updateChrome();

    if (announce) {
      this.announce();
    }

    if (typeof this.onChange === "function") {
      this.onChange(normalized, this.slides[normalized]);
    }
  }

  updateSlides() {
    this.slides.forEach((slide, position) => {
      const isActive = position === this.index;
      slide.classList.toggle("carousel__slide--active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));

      if (isActive) {
        slide.removeAttribute("inert");
      } else {
        slide.setAttribute("inert", "");
      }
    });
  }

  updateChrome() {
    if (this.currentLabel) {
      this.currentLabel.textContent = pad(this.index + 1);
    }

    if (this.totalLabel) {
      this.totalLabel.textContent = pad(this.total);
    }

    if (this.progress) {
      const percentage = ((this.index + 1) / this.total) * 100;
      this.progress.style.width = `${percentage}%`;
    }
  }

  announce() {
    if (!this.status) {
      return;
    }

    const label = this.slides[this.index].dataset.label ?? "";
    this.status.textContent = `Página ${this.index + 1} de ${this.total}${label ? `: ${label}` : ""}`;
  }

  bindEvents() {
    this.prevButton?.addEventListener("click", () => this.prev());
    this.nextButton?.addEventListener("click", () => this.next());

    document.addEventListener("keydown", this.handleKeyDown);
    this.root.addEventListener("pointerdown", this.handlePointerDown, { passive: true });
    this.root.addEventListener("pointerup", this.handlePointerUp, { passive: true });
    this.root.addEventListener("pointercancel", this.handlePointerCancel, { passive: true });
    this.root.addEventListener("click", this.handleClickCapture, true);
  }

  handleKeyDown(event) {
    if (!this.canNavigate()) {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const target = event.target;

    if (target instanceof HTMLElement && target.closest("input, textarea, select")) {
      return;
    }

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        this.next();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.prev();
        break;
      case "Home":
        event.preventDefault();
        this.goTo(0);
        break;
      case "End":
        event.preventDefault();
        this.goTo(this.total - 1);
        break;
      default:
        break;
    }
  }

  handlePointerDown(event) {
    if (event.pointerType === "mouse") {
      return;
    }

    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
  }

  handlePointerUp(event) {
    if (!this.pointer || this.pointer.id !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - this.pointer.x;
    const deltaY = event.clientY - this.pointer.y;
    this.pointer = null;

    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_RATIO;

    if (!isHorizontal || Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return;
    }

    this.suppressClickUntil = performance.now() + 420;

    if (deltaX < 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  handlePointerCancel() {
    this.pointer = null;
  }

  handleClickCapture(event) {
    if (performance.now() < this.suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}
