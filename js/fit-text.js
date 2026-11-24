const trackedElements = new Set();
let listenersReady = false;

export function fitText(element) {
  if (!element) {
    return;
  }

  trackedElements.add(element);
  setupListeners();
  fitElement(element);
}

function setupListeners() {
  if (listenersReady) {
    return;
  }

  listenersReady = true;

  let frame = 0;
  const schedule = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      trackedElements.forEach((element) => fitElement(element));
    });
  };

  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("load", schedule, { once: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(schedule);
  }
}

function fitElement(element) {
  element.style.removeProperty("font-size");

  const container = element.parentElement;

  if (!container) {
    return;
  }

  const startSize = parseFloat(window.getComputedStyle(element).fontSize);

  if (!Number.isFinite(startSize) || startSize <= 0) {
    return;
  }

  if (fitsAtSize(element, startSize)) {
    return;
  }

  const minSize = Math.max(10, startSize * 0.45);

  if (!fitsAtSize(element, minSize)) {
    element.style.fontSize = `${minSize}px`;
    return;
  }

  let low = minSize;
  let high = startSize;
  let best = minSize;

  for (let step = 0; step < 14; step += 1) {
    const mid = (low + high) / 2;

    if (fitsAtSize(element, mid)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  element.style.fontSize = `${best}px`;
}

function fitsAtSize(element, size) {
  element.style.fontSize = `${size}px`;
  return element.scrollWidth <= element.clientWidth + 1;
}
