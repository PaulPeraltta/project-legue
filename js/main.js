/**
 * LeGué | Estudio Jurídico - Script Principal (Vanilla JS)
 * - Slider Hero interactivo con indicadores y auto-play
 * - Animaciones suaves al hacer scroll (IntersectionObserver)
 * - Navegación sticky, menú móvil y resaltado de sección activa
 * - Validación de formulario de contacto
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ========================================================================
     1. HERO SLIDER & INDICADORES INTERACTIVOS
     ======================================================================== */
  {
    const heroSlides = document.querySelectorAll(".hero-slide");
    const heroDots = document.querySelectorAll(".hero-dot");
    const heroWrap = document.querySelector(".hero-slider-wrap");
    let currentHeroSlide = 0;
    let heroInterval = null;
    const HERO_AUTO_PLAY_MS = 6000;

    function goToHeroSlide(index) {
      if (!heroSlides.length) return;
      currentHeroSlide = (index + heroSlides.length) % heroSlides.length;

      heroSlides.forEach((slide, i) => {
        slide.classList.toggle("active", i === currentHeroSlide);
      });

      heroDots.forEach((dot, i) => {
        const isActive = i === currentHeroSlide;
        dot.classList.toggle("active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    }

    function startHeroAutoPlay() {
      stopHeroAutoPlay();
      heroInterval = setInterval(() => {
        goToHeroSlide(currentHeroSlide + 1);
      }, HERO_AUTO_PLAY_MS);
    }

    function stopHeroAutoPlay() {
      if (heroInterval) {
        clearInterval(heroInterval);
        heroInterval = null;
      }
    }

    heroDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const targetIndex = parseInt(dot.getAttribute("data-target"), 10);
        if (!Number.isNaN(targetIndex)) {
          goToHeroSlide(targetIndex);
          startHeroAutoPlay();
        }
      });
    });

    if (heroWrap && heroSlides.length > 1) {
      heroWrap.addEventListener("mouseenter", stopHeroAutoPlay);
      heroWrap.addEventListener("mouseleave", startHeroAutoPlay);
      startHeroAutoPlay();
    }
  }

  /* ========================================================================
     2. CARRUSEL DE SERVICIOS (Formato 'Por qué elegirnos' con auto-play y barra de progreso)
     ======================================================================== */
  {
    const servicesTrack = document.getElementById("services-carousel-track");
    const servicesViewport = document.getElementById("services-carousel-viewport");
    const servicesWrap = document.querySelector(".services-carousel-wrap");
    const servicesPrev = document.getElementById("services-prev");
    const servicesNext = document.getElementById("services-next");
    const servicesDotsContainer = document.getElementById("services-dots");

    if (servicesTrack && servicesViewport) {
      const cards = Array.from(servicesTrack.querySelectorAll(".service-why-card"));
      const totalCards = cards.length;
      let currentServiceIndex = 0;
      const AUTOPLAY_DELAY_MS = 5000;
      let isPaused = false;
      let elapsedMs = 0;
      let lastTimestamp = null;
      let animFrameId = null;

      function getCardsPerView() {
        if (window.innerWidth >= 992) return 3;
        if (window.innerWidth >= 600) return 2;
        return 1;
      }

      function getMaxServiceIndex() {
        const perView = getCardsPerView();
        return Math.max(0, totalCards - perView);
      }

      function updateActiveDotProgress(percent) {
        if (!servicesDotsContainer) return;
        const dots = servicesDotsContainer.querySelectorAll(".services-dot");
        dots.forEach((dot, idx) => {
          const fill = dot.querySelector(".services-dot-fill");
          if (!fill) return;
          if (idx === currentServiceIndex) {
            fill.style.width = `${percent}%`;
          } else {
            fill.style.width = "0%";
          }
        });
      }

      function renderServicesDots() {
        if (!servicesDotsContainer) return;
        servicesDotsContainer.innerHTML = "";
        const maxIdx = getMaxServiceIndex();
        for (let i = 0; i <= maxIdx; i++) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = `services-dot ${i === currentServiceIndex ? "active" : ""}`;
          dot.setAttribute("aria-label", `Ir al servicio ${i + 1}`);
          dot.setAttribute("aria-current", i === currentServiceIndex ? "true" : "false");

          const fill = document.createElement("span");
          fill.className = "services-dot-fill";
          fill.style.width = i === currentServiceIndex ? `${Math.min(100, (elapsedMs / AUTOPLAY_DELAY_MS) * 100)}%` : "0%";
          dot.appendChild(fill);

          dot.addEventListener("click", () => {
            goToServiceSlide(i);
          });
          servicesDotsContainer.appendChild(dot);
        }
      }

      function updateServicesTrack() {
        const maxIdx = getMaxServiceIndex();
        if (currentServiceIndex > maxIdx) {
          currentServiceIndex = maxIdx;
        }
        if (currentServiceIndex < 0) {
          currentServiceIndex = 0;
        }

        if (cards.length === 0) return;

        const firstCard = cards[0];
        const secondCard = cards[1];
        let stepWidth = firstCard.offsetWidth;
        if (secondCard) {
          stepWidth = secondCard.offsetLeft - firstCard.offsetLeft;
        }

        const offset = currentServiceIndex * stepWidth;
        servicesTrack.style.transform = `translateX(-${offset}px)`;

        // Actualizar estado activo en los dots
        if (servicesDotsContainer) {
          const dots = servicesDotsContainer.querySelectorAll(".services-dot");
          dots.forEach((dot, idx) => {
            const isActive = idx === currentServiceIndex;
            dot.classList.toggle("active", isActive);
            dot.setAttribute("aria-current", isActive ? "true" : "false");
          });
        }
      }

      function goToServiceSlide(index) {
        const maxIdx = getMaxServiceIndex();
        if (index > maxIdx) {
          currentServiceIndex = 0;
        } else if (index < 0) {
          currentServiceIndex = maxIdx;
        } else {
          currentServiceIndex = index;
        }
        elapsedMs = 0;
        updateServicesTrack();
        updateActiveDotProgress(0);
      }

      function nextServiceSlide() {
        const maxIdx = getMaxServiceIndex();
        if (currentServiceIndex >= maxIdx) {
          goToServiceSlide(0);
        } else {
          goToServiceSlide(currentServiceIndex + 1);
        }
      }

      function prevServiceSlide() {
        const maxIdx = getMaxServiceIndex();
        if (currentServiceIndex <= 0) {
          goToServiceSlide(maxIdx);
        } else {
          goToServiceSlide(currentServiceIndex - 1);
        }
      }

      function pauseServicesAutoPlay() {
        isPaused = true;
        if (servicesWrap) {
          servicesWrap.classList.add("is-paused");
        }
      }

      function resumeServicesAutoPlay() {
        isPaused = false;
        lastTimestamp = performance.now();
        if (servicesWrap) {
          servicesWrap.classList.remove("is-paused");
        }
      }

      function progressLoop(timestamp) {
        if (!lastTimestamp) {
          lastTimestamp = timestamp;
        }
        const delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        if (!isPaused && totalCards > getCardsPerView()) {
          elapsedMs += delta;
          const percent = Math.min(100, (elapsedMs / AUTOPLAY_DELAY_MS) * 100);
          updateActiveDotProgress(percent);

          if (elapsedMs >= AUTOPLAY_DELAY_MS) {
            elapsedMs = 0;
            nextServiceSlide();
          }
        }

        animFrameId = requestAnimationFrame(progressLoop);
      }

      if (servicesNext) {
        servicesNext.addEventListener("click", () => {
          nextServiceSlide();
        });
        servicesNext.addEventListener("mouseenter", pauseServicesAutoPlay);
        servicesNext.addEventListener("mouseleave", resumeServicesAutoPlay);
      }

      if (servicesPrev) {
        servicesPrev.addEventListener("click", () => {
          prevServiceSlide();
        });
        servicesPrev.addEventListener("mouseenter", pauseServicesAutoPlay);
        servicesPrev.addEventListener("mouseleave", resumeServicesAutoPlay);
      }

      cards.forEach((card) => {
        card.addEventListener("mouseenter", pauseServicesAutoPlay);
        card.addEventListener("mouseleave", resumeServicesAutoPlay);
      });

      if (servicesWrap) {
        servicesWrap.addEventListener("mouseenter", pauseServicesAutoPlay);
        servicesWrap.addEventListener("mouseleave", resumeServicesAutoPlay);
        servicesWrap.addEventListener("focusin", pauseServicesAutoPlay);
        servicesWrap.addEventListener("focusout", resumeServicesAutoPlay);
      }

      // Detener si la pestaña no está visible para evitar saltos
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          pauseServicesAutoPlay();
        } else {
          resumeServicesAutoPlay();
        }
      });

      // Soporte táctil / touch swipe en dispositivos móviles
      let touchStartX = 0;
      let touchEndX = 0;

      servicesViewport.addEventListener(
        "touchstart",
        (e) => {
          touchStartX = e.changedTouches[0].screenX;
          pauseServicesAutoPlay();
        },
        { passive: true }
      );

      servicesViewport.addEventListener(
        "touchend",
        (e) => {
          touchEndX = e.changedTouches[0].screenX;
          const diff = touchStartX - touchEndX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              nextServiceSlide();
            } else {
              prevServiceSlide();
            }
          }
          resumeServicesAutoPlay();
        },
        { passive: true }
      );

      let resizeTimer = null;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          renderServicesDots();
          updateServicesTrack();
        }, 100);
      });

      renderServicesDots();
      updateServicesTrack();
      animFrameId = requestAnimationFrame(progressLoop);
    }
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
        submitBtn.innerHTML = "Enviando consulta... <span class=\"hero-button-arrow\" aria-hidden=\"true\">→</span>";
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
