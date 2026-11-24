const EMBED_HOST = "https://www.youtube-nocookie.com/embed/";
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com"
]);

export function extractVideoId(input) {
  if (typeof input !== "string" || input.trim().length === 0) {
    return null;
  }

  let url;

  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (!ALLOWED_HOSTS.has(host)) {
    return null;
  }

  let videoId = null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/embed/")) {
    videoId = url.pathname.split("/")[2] ?? null;
  } else if (url.pathname.startsWith("/shorts/")) {
    videoId = url.pathname.split("/")[2] ?? null;
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }

  return videoId;
}

export function getEmbedUrl(input, { autoplay = true } = {}) {
  const videoId = extractVideoId(input);

  if (!videoId) {
    return null;
  }

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1"
  });

  if (autoplay) {
    params.set("autoplay", "1");
  }

  return `${EMBED_HOST}${videoId}?${params.toString()}`;
}

export function createPlayer(input, {
  title = "Video de YouTube",
  className = "modal__video",
  autoplay = true
} = {}) {
  const src = getEmbedUrl(input, { autoplay });

  if (!src) {
    return null;
  }

  const iframe = document.createElement("iframe");
  iframe.className = className;
  iframe.src = src;
  iframe.title = title;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.setAttribute("loading", "eager");

  return iframe;
}
