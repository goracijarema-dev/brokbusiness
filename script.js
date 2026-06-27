const shell = document.querySelector("#snapShell");
const modal = document.querySelector("#contactModal");
const closeButtons = document.querySelectorAll("[data-close-contact]");
const openButtons = document.querySelectorAll("[data-open-contact]");
const sections = [...document.querySelectorAll("[data-section]")];
const dots = [...document.querySelectorAll(".snap-dots a")];
const header = document.querySelector(".site-header");
const root = document.documentElement;
const revealElements = [...document.querySelectorAll(".reveal")];
const mobileViewport = window.matchMedia("(max-width: 820px)");
const coarsePointer = window.matchMedia("(pointer: coarse)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (window.lucide) {
  window.lucide.createIcons();
}

function setActiveSection(index) {
  if (index < 0) return;
  sections.forEach((section, sectionIndex) => {
    section.classList.toggle("is-current", sectionIndex === index);
  });
  dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
}

setActiveSection(0);

function syncMobileMotion() {
  document.body.classList.toggle("has-mobile-motion", mobileViewport.matches && !prefersReducedMotion);
}

syncMobileMotion();
if (mobileViewport.addEventListener) {
  mobileViewport.addEventListener("change", syncMobileMotion);
} else {
  mobileViewport.addListener(syncMobileMotion);
}

document.querySelectorAll("[data-scroll-to]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.getElementById(link.dataset.scrollTo);
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  });
});

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.querySelector("[data-close-contact]")?.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

openButtons.forEach((button) => button.addEventListener("click", openModal));
closeButtons.forEach((button) => button.addEventListener("click", closeModal));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { root: shell, threshold: 0.2 }
);

sections.forEach((section) => {
  [...section.querySelectorAll(".reveal")].forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index * 90, 360)}ms`);
  });
});

revealElements.forEach((element) => revealObserver.observe(element));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = sections.indexOf(entry.target);
      if (index === -1) return;
      setActiveSection(index);
    });
  },
  { root: shell, threshold: 0.55 }
);

sections.forEach((section) => sectionObserver.observe(section));

let scrollFrame = 0;

function updateScrollState() {
  const maxScroll = Math.max(shell.scrollHeight - shell.clientHeight, 1);
  const progress = shell.scrollTop / maxScroll;
  const shellRect = shell.getBoundingClientRect();
  const anchorY = shellRect.top + shell.clientHeight * 0.42;
  const activeIndex = sections.findIndex((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= anchorY && rect.bottom >= anchorY;
  });

  header.classList.toggle("is-glass", shell.scrollTop > 20);
  root.style.setProperty("--mobile-progress", progress.toFixed(4));
  setActiveSection(activeIndex);
  scrollFrame = 0;
}

shell.addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateScrollState);
  },
  { passive: true }
);

updateScrollState();

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.counted) return;
      entry.target.dataset.counted = "true";
      animateCounter(entry.target, Number(entry.target.dataset.counter));
    });
  },
  { root: shell, threshold: 0.65 }
);

document.querySelectorAll("[data-counter]").forEach((counter) => counterObserver.observe(counter));

function animateCounter(element, target) {
  if (prefersReducedMotion) {
    element.textContent = target.toLocaleString("en-US");
    return;
  }

  const duration = 1200;
  const startedAt = performance.now();

  function tick(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = Math.round(target * eased).toLocaleString("en-US");
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateX(${y * -5}deg) rotateY(${x * 7}deg) translate3d(0, -2px, 0)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  const heroStage = document.querySelector(".hero-stage");
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!heroStage) return;
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      heroStage.style.transform = `translate3d(${x * 14}px, ${y * 10}px, 0)`;
    },
    { passive: true }
  );
}

if (!prefersReducedMotion && coarsePointer.matches) {
  const pressableElements = document.querySelectorAll(
    ".job-card, .reward-card, .language-grid span, .contact-link, .ghost-button, .phone-button"
  );
  const heroStage = document.querySelector(".hero-stage");

  pressableElements.forEach((element) => {
    element.addEventListener("pointerdown", () => element.classList.add("is-pressed"));
    ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
      element.addEventListener(eventName, () => element.classList.remove("is-pressed"));
    });
  });

  function setMobileParallax(clientX, clientY) {
    if (!heroStage || !mobileViewport.matches) return;
    const rect = heroStage.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((clientY - rect.top) / rect.height - 0.5) * 8;
    root.style.setProperty("--mobile-parallax-x", `${x.toFixed(2)}px`);
    root.style.setProperty("--mobile-parallax-y", `${y.toFixed(2)}px`);
    root.style.setProperty("--mobile-phone-x", `${(-x * 0.65).toFixed(2)}px`);
    root.style.setProperty("--mobile-phone-y", `${(-y * 0.75).toFixed(2)}px`);
  }

  function resetMobileParallax() {
    root.style.setProperty("--mobile-parallax-x", "0px");
    root.style.setProperty("--mobile-parallax-y", "0px");
    root.style.setProperty("--mobile-phone-x", "0px");
    root.style.setProperty("--mobile-phone-y", "0px");
  }

  shell.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "mouse" || !heroStage) return;
      const rect = heroStage.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      setMobileParallax(event.clientX, event.clientY);
    },
    { passive: true }
  );
  shell.addEventListener("pointerleave", resetMobileParallax, { passive: true });
  shell.addEventListener("pointercancel", resetMobileParallax, { passive: true });
}

const canvas = document.querySelector("#marketCanvas");
const context = canvas?.getContext("2d");
let width = 0;
let height = 0;
let points = [];

function resizeCanvas() {
  if (!canvas || !context) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  points = Array.from({ length: 34 }, (_, index) => ({
    x: (width / 33) * index,
    base: height * (0.68 - index * 0.007),
    amp: 20 + Math.random() * 34,
    speed: 0.001 + Math.random() * 0.0018,
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawMarket(time = 0) {
  if (!context || !canvas) return;
  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(134, 239, 75, 0.02)");
  gradient.addColorStop(0.55, "rgba(89, 214, 255, 0.05)");
  gradient.addColorStop(1, "rgba(220, 200, 144, 0.03)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  if (mobileViewport.matches) {
    const scanX = (time * 0.04) % (width + 160) - 80;
    const scanGradient = context.createLinearGradient(scanX - 80, 0, scanX + 80, 0);
    scanGradient.addColorStop(0, "rgba(89, 214, 255, 0)");
    scanGradient.addColorStop(0.48, "rgba(89, 214, 255, 0.055)");
    scanGradient.addColorStop(1, "rgba(134, 239, 75, 0)");
    context.fillStyle = scanGradient;
    context.fillRect(scanX - 80, 0, 160, height);
  }

  context.save();
  context.translate(width * 0.48, height * 0.1);
  context.beginPath();
  points.forEach((point, index) => {
    const y = point.base + Math.sin(time * point.speed + point.phase) * point.amp;
    if (index === 0) context.moveTo(point.x, y);
    else context.lineTo(point.x, y);
  });
  context.strokeStyle = "rgba(134, 239, 75, 0.34)";
  context.lineWidth = 2;
  context.shadowColor = "rgba(134, 239, 75, 0.36)";
  context.shadowBlur = 18;
  context.stroke();

  points.forEach((point, index) => {
    if (index % 3 !== 0) return;
    const y = point.base + Math.sin(time * point.speed + point.phase) * point.amp;
    const candleHeight = 18 + Math.abs(Math.sin(time * 0.0012 + index)) * 48;
    context.beginPath();
    context.moveTo(point.x, y - candleHeight);
    context.lineTo(point.x, y + candleHeight);
    context.strokeStyle = index % 2 === 0 ? "rgba(134, 239, 75, 0.3)" : "rgba(255, 89, 100, 0.2)";
    context.lineWidth = 1.5;
    context.stroke();
    context.fillStyle = index % 2 === 0 ? "rgba(134, 239, 75, 0.24)" : "rgba(255, 89, 100, 0.18)";
    context.fillRect(point.x - 4, y - candleHeight * 0.25, 8, candleHeight * 0.5);
  });
  context.restore();

  if (!prefersReducedMotion) {
    requestAnimationFrame(drawMarket);
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
drawMarket();
