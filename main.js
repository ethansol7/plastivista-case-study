document.documentElement.classList.add("js");

const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.12,
  },
);

revealItems.forEach((item) => revealObserver.observe(item));

const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  {
    rootMargin: "-20% 0px -68% 0px",
    threshold: 0.01,
  },
);

sections.forEach((section) => activeObserver.observe(section));

window.addEventListener("load", () => {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (!target) return;
  window.setTimeout(() => {
    target.scrollIntoView({ block: "start", behavior: "auto" });
    revealItems.forEach((item) => item.classList.add("is-visible"));
    target.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
  }, 120);
});

const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxStage = document.querySelector("[data-lightbox-stage]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");

if (lightbox && lightboxImage && lightboxCaption && lightboxStage && lightboxClose) {
  const lightboxItems = Array.from(document.querySelectorAll("main img")).map((image) => {
    const caption = image.closest("figure")?.querySelector("figcaption")?.textContent.trim() || "";
    image.classList.add("lightbox-trigger");
    image.setAttribute("role", "button");
    image.setAttribute("tabindex", "0");
    image.setAttribute("aria-label", `Open image viewer${image.alt ? `: ${image.alt}` : ""}`);
    return { image, caption };
  });

  let activeIndex = -1;
  let lastFocusedElement = null;
  let savedScrollY = 0;
  let closeTimer = 0;

  const setPageScrollLock = (locked) => {
    if (locked) {
      savedScrollY = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return;
    }

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
  };

  const updateNavState = () => {
    const disabled = lightboxItems.length < 2;
    lightboxPrev.disabled = disabled;
    lightboxNext.disabled = disabled;
  };

  const setLightboxImage = (index) => {
    const item = lightboxItems[index];
    if (!item) return;

    activeIndex = index;
    lightboxImage.src = item.image.currentSrc || item.image.src;
    lightboxImage.alt = item.image.alt || "";

    if (item.caption) {
      lightboxCaption.hidden = false;
      lightboxCaption.textContent = item.caption;
    } else {
      lightboxCaption.hidden = true;
      lightboxCaption.textContent = "";
    }

    updateNavState();
  };

  const openLightbox = (index) => {
    window.clearTimeout(closeTimer);
    lastFocusedElement = document.activeElement;
    setLightboxImage(index);
    setPageScrollLock(true);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      lightbox.classList.add("is-open");
      lightboxClose.focus({ preventScroll: true });
    });
  };

  const closeLightbox = () => {
    if (lightbox.hidden) return;

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    setPageScrollLock(false);

    closeTimer = window.setTimeout(() => {
      lightbox.hidden = true;
      lightboxImage.removeAttribute("src");
      activeIndex = -1;
      lastFocusedElement?.focus?.({ preventScroll: true });
    }, 260);
  };

  const showRelativeImage = (direction) => {
    if (activeIndex < 0 || lightboxItems.length < 2) return;
    const nextIndex = (activeIndex + direction + lightboxItems.length) % lightboxItems.length;
    setLightboxImage(nextIndex);
  };

  lightboxItems.forEach((item, index) => {
    item.image.addEventListener("click", () => openLightbox(index));
    item.image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLightbox(index);
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => showRelativeImage(-1));
  lightboxNext.addEventListener("click", () => showRelativeImage(1));
  lightbox.addEventListener("click", (event) => {
    const clickedControl = event.target.closest("button");
    const clickedImage = event.target === lightboxImage;

    if (!clickedControl && !clickedImage) {
      closeLightbox();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showRelativeImage(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showRelativeImage(1);
    }
  });
}
