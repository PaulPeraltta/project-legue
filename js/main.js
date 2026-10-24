/**
 * LeGué | Estudio Jurídico - Script Principal (Vanilla JS)
 * - Slider Hero interactivo con pestañas (thumbnails) y auto-play
 * - Animaciones suaves al hacer scroll (IntersectionObserver)
 * - Navegación sticky, menú móvil y resaltado de sección activa
 * - Validación de formulario de contacto
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ========================================================================
     1. HERO SLIDER & PESTAÑAS INTERACTIVAS
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
  const headerBrandLink = document.querySelector(".header-brand-link");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link");

  if (headerBrandLink) {
    headerBrandLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // #inicio apunta al header sticky, que ya está en top:0: el ancla no scrollea.
  document.querySelectorAll('a[href="#inicio"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

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
  // Inicio incluye el header y el hero (que no tiene id): es la sección activa
  // hasta que otra sección cruza el 40% superior de la ventana.
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  if (sections.length && navLinks.length) {
    let navTicking = false;

    const updateActiveNav = () => {
      navTicking = false;
      let activeId = "#inicio";
      sections.forEach((sec) => {
        if (sec.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          activeId = `#${sec.id}`;
        }
      });
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === activeId);
      });
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!navTicking) {
          navTicking = true;
          requestAnimationFrame(updateActiveNav);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", updateActiveNav);
    updateActiveNav();
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
     6. FORMULARIO DE CONTACTO (Conexión con Resend vía Serverless API)
     ======================================================================== */
  const contactForm = document.getElementById("contact-form");
  const formResult = document.getElementById("form-result");

  if (contactForm && formResult) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "Enviar consulta";

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullname = (contactForm.fullname ? contactForm.fullname.value : "").trim();
      const email = (contactForm.email ? contactForm.email.value : "").trim();
      const telefono = (contactForm.telefono ? contactForm.telefono.value : "").trim();
      const message = (contactForm.message ? contactForm.message.value : "").trim();
      const gotcha = contactForm._gotcha ? contactForm._gotcha.value.trim() : "";

      // Validación rápida en el cliente
      if (!fullname || !email || !telefono || !message) {
        formResult.textContent = "Por favor, completá todos los campos obligatorios (*).";
        formResult.className = "form-result error";
        return;
      }

      if (fullname.length < 2) {
        formResult.textContent = "Por favor, ingresá tu nombre y apellido completo.";
        formResult.className = "form-result error";
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        formResult.textContent = "Por favor, ingresá una dirección de email válida (ejemplo: nombre@dominio.com).";
        formResult.className = "form-result error";
        return;
      }

      if (telefono.length < 6) {
        formResult.textContent = "Por favor, ingresá un número de teléfono de contacto válido.";
        formResult.className = "form-result error";
        return;
      }

      if (message.length < 10) {
        formResult.textContent = "Por favor, detallá un poco más tu consulta (mínimo 10 caracteres).";
        formResult.className = "form-result error";
        return;
      }

      // Estado cargando accesible
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<span></span>Enviando consulta...";
      }
      formResult.textContent = "Enviando tu consulta...";
      formResult.className = "form-result loading";

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            fullname,
            email,
            telefono,
            message,
            _gotcha: gotcha,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.ok) {
          formResult.textContent =
            data.message ||
            "¡Muchas gracias! Tu consulta fue enviada con éxito. Te responderemos a la brevedad.";
          formResult.className = "form-result success";
          contactForm.reset();
        } else {
          formResult.textContent =
            data.message ||
            "Hubo un problema al enviar tu consulta. Por favor, intentá nuevamente o comunicate directamente por WhatsApp.";
          formResult.className = "form-result error";
        }
      } catch (err) {
        formResult.textContent =
          "No pudimos conectar con el servidor de envío. Por favor, verificá tu conexión o contactanos directamente por WhatsApp.";
        formResult.className = "form-result error";
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  }

  /* ========================================================================
     7. BOTÓN FLOTANTE INTERACTIVO (FAB CON MENÚ DESPLEGABLE)
     ======================================================================== */
  const floatingWrap = document.getElementById("floating-contact");
  const floatingToggle = document.getElementById("floating-contact-toggle");
  const floatingMenu = document.getElementById("floating-contact-menu");
  const floatingScrollLink = document.querySelector(".floating-contact-scroll");

  if (floatingWrap && floatingToggle && floatingMenu) {
    function openFloatingMenu() {
      floatingWrap.classList.add("open");
      floatingToggle.setAttribute("aria-expanded", "true");
      floatingMenu.setAttribute("aria-hidden", "false");
    }

    function closeFloatingMenu(focusToggle = false) {
      if (!floatingWrap.classList.contains("open")) return;
      floatingWrap.classList.remove("open");
      floatingToggle.setAttribute("aria-expanded", "false");
      floatingMenu.setAttribute("aria-hidden", "true");
      if (focusToggle) {
        floatingToggle.focus();
      }
    }

    function toggleFloatingMenu() {
      const isOpen = floatingWrap.classList.contains("open");
      if (isOpen) {
        closeFloatingMenu(false);
      } else {
        openFloatingMenu();
      }
    }

    floatingToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFloatingMenu();
    });

    // Cerrar al hacer click fuera
    document.addEventListener("click", (e) => {
      if (!floatingWrap.contains(e.target)) {
        closeFloatingMenu(false);
      }
    });

    // Cerrar con tecla Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && floatingWrap.classList.contains("open")) {
        closeFloatingMenu(true);
      }
    });

    // Scroll suave a #contacto
    if (floatingScrollLink) {
      floatingScrollLink.addEventListener("click", (e) => {
        closeFloatingMenu(false);
        const contactSection = document.getElementById("contacto");
        if (contactSection) {
          e.preventDefault();
          contactSection.scrollIntoView({ behavior: "smooth" });
          const firstInput = contactSection.querySelector("input, textarea");
          if (firstInput) {
            setTimeout(() => firstInput.focus(), 500);
          }
        }
      });
    }

    // Cerrar menú al clickear enlaces externos
    const menuLinks = floatingMenu.querySelectorAll(".floating-menu-item");
    menuLinks.forEach((link) => {
      if (!link.classList.contains("floating-contact-scroll")) {
        link.addEventListener("click", () => {
          closeFloatingMenu(false);
        });
      }
    });
  }
});
