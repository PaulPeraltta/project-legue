/**
 * Portfolio Legue - Script Principal (Vanilla JS)
 * - Slider Hero interactivo con pestañas (thumbnails) y auto-play
 * - Animaciones suaves al hacer scroll (IntersectionObserver)
 * - Navegación sticky, menú móvil y resaltado de sección activa
 * - Cursor personalizado sutil en escritorio
 * - Validación de formulario de contacto
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ========================================================================
     1. CURSOR PERSONALIZADO (Escritorio)
     ======================================================================== */
  const cursor = document.getElementById("custom-cursor");
  const cursorInner = document.getElementById("custom-cursor-inner");

  if (cursor && cursorInner && window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener("mousemove", (e) => {
      const { clientX: x, clientY: y } = e;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cursorInner.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  /* ========================================================================
     2. HERO SLIDER & PESTAÑAS INTERACTIVAS
     ======================================================================== */
  const slides = document.querySelectorAll(".hero-slide");
  const thumbs = document.querySelectorAll(".thumb-content");
  const heroWrap = document.querySelector(".hero-slider-wrap");
  let currentSlide = 0;
  let slideInterval = null;
  const AUTO_PLAY_MS = 6000;

  function goToSlide(index) {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === currentSlide);
    });

    thumbs.forEach((thumb, i) => {
      const isActive = i === currentSlide;
      thumb.classList.toggle("active", isActive);
      thumb.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function startAutoPlay() {
    stopAutoPlay();
    slideInterval = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, AUTO_PLAY_MS);
  }

  function stopAutoPlay() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const targetIndex = parseInt(thumb.getAttribute("data-target"), 10);
      if (!Number.isNaN(targetIndex)) {
        goToSlide(targetIndex);
        startAutoPlay();
      }
    });
  });

  if (heroWrap && slides.length > 1) {
    heroWrap.addEventListener("mouseenter", stopAutoPlay);
    heroWrap.addEventListener("mouseleave", startAutoPlay);
    startAutoPlay();
  }

  /* ========================================================================
     3. HEADER STICKY & MENÚ HAMBURGUESA MOBILE
     ======================================================================== */
  const header = document.querySelector(".site-header");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link");

  window.addEventListener(
    "scroll",
    () => {
      if (header) {
        header.classList.toggle("scrolled", window.scrollY > 40);
      }
    },
    { passive: true }
  );

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    });

    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        menuToggle.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
      });
    });
  }

  /* ========================================================================
     4. RESALTADO DE SECCIÓN ACTIVA EN EL MENÚ
     ======================================================================== */
  const sections = document.querySelectorAll("header[id], section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const activeId = `#${entry.target.id}`;
            navLinks.forEach((link) => {
              link.classList.toggle("active", link.getAttribute("href") === activeId);
            });
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );

    sections.forEach((sec) => navObserver.observe(sec));
  }

  /* ========================================================================
     5. ANIMACIONES SCROLL-REVEAL (IntersectionObserver)
     ======================================================================== */
  const revealElements = document.querySelectorAll(
    ".reveal-fade, .reveal-up, .reveal-left, .reveal-right"
  );

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = parseInt(el.getAttribute("data-delay") || "0", 10);

            if (delay > 0) {
              setTimeout(() => {
                el.classList.add("reveal-visible");
              }, delay);
            } else {
              el.classList.add("reveal-visible");
            }

            observer.unobserve(el);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("reveal-visible"));
  }

  /* ========================================================================
     6. FORMULARIO DE CONTACTO
     ======================================================================== */
  const contactForm = document.getElementById("contact-form");
  const formResult = document.getElementById("form-result");

  if (contactForm && formResult) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fullname = contactForm.fullname.value.trim();
      const email = contactForm.email.value.trim();
      const telefono = contactForm.telefono.value.trim();
      const message = contactForm.message.value.trim();

      if (!fullname || !email || !telefono || !message) {
        formResult.textContent = "Por favor, completá todos los campos obligatorios (*).";
        formResult.className = "form-result error";
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        formResult.textContent = "Por favor, ingresá una dirección de email válida.";
        formResult.className = "form-result error";
        return;
      }

      formResult.textContent = "¡Gracias por tu consulta! Nos pondremos en contacto a la brevedad.";
      formResult.className = "form-result success";
      contactForm.reset();
    });
  }
});
