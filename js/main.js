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

      // Deslizamiento con el dedo (solo tablet y mobile)
      let touchStartX = 0;
      let touchStartY = 0;

      heroWrap.addEventListener(
        "touchstart",
        (event) => {
          if (window.innerWidth > 1024) return;
          touchStartX = event.touches[0].clientX;
          touchStartY = event.touches[0].clientY;
          stopHeroAutoPlay();
        },
        { passive: true }
      );

      heroWrap.addEventListener(
        "touchend",
        (event) => {
          if (window.innerWidth > 1024) return;
          const dx = event.changedTouches[0].clientX - touchStartX;
          const dy = event.changedTouches[0].clientY - touchStartY;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            goToHeroSlide(currentHeroSlide + (dx < 0 ? 1 : -1));
          }
          startHeroAutoPlay();
        },
        { passive: true }
      );
    }
  }

  /* ========================================================================
     2. CARRUSEL EN SERVICIOS (Desktop, Tablet y Mobile)
     ======================================================================== */
  {
    const serviceBlocks = document.querySelectorAll(".services-block");

    serviceBlocks.forEach((block) => {
      const grid = block.querySelector(".services-grid");
      const prevBtn = block.querySelector(".prev-btn");
      const nextBtn = block.querySelector(".next-btn");
      const dots = Array.from(block.querySelectorAll(".services-dot"));
      const cards = grid ? Array.from(grid.querySelectorAll(".service-why-card")) : [];

      if (!grid || !cards.length) return;

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function getCardsPerView() {
        const isBlock2 = block.classList.contains("services-block-2") || block.dataset.block === "2" || block === serviceBlocks[1];
        if (window.innerWidth >= 1280) {
          return isBlock2 ? 4 : 3;
        }
        if (window.innerWidth > 1024) return 3;
        if (window.innerWidth >= 768) return isBlock2 ? 3 : 2;
        return 1;
      }

      function getMaxIndex() {
        return Math.max(0, cards.length - getCardsPerView());
      }

      function getCardScrollOffset(index) {
        const targetCard = cards[index];
        if (!targetCard) return 0;
        const isMobile = window.innerWidth <= 767;
        if (isMobile) {
          return Math.max(0, targetCard.offsetLeft - grid.offsetLeft - 24);
        }
        return Math.max(0, targetCard.offsetLeft - grid.offsetLeft);
      }

      function scrollToIndex(index) {
        const maxIdx = getMaxIndex();
        const clampedIndex = Math.max(0, Math.min(index, maxIdx));
        const offset = getCardScrollOffset(clampedIndex);

        grid.scrollTo({
          left: offset,
          behavior: prefersReduced ? "auto" : "smooth"
        });
      }

      function getCurrentIndex() {
        const maxIdx = getMaxIndex();
        const maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth);

        if (maxScroll <= 0) return 0;
        if (grid.scrollLeft >= maxScroll - 6) {
          return maxIdx;
        }

        const isMobile = window.innerWidth <= 767;
        const currentScroll = grid.scrollLeft + (isMobile ? 24 : 0);

        let closestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, index) => {
          if (index > maxIdx) return;
          const cardLeft = card.offsetLeft - grid.offsetLeft;
          const distance = Math.abs(cardLeft - currentScroll);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        return closestIndex;
      }

      function updateControlsState() {
        const maxIdx = getMaxIndex();
        const maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth);
        const activeIndex = getCurrentIndex();

        // Actualizar visibilidad y estado de los puntos de posición
        dots.forEach((dot, index) => {
          if (index > maxIdx) {
            dot.style.display = "none";
          } else {
            dot.style.display = "";
          }
          const isActive = index === activeIndex;
          dot.classList.toggle("active", isActive);
          dot.setAttribute("aria-current", isActive ? "true" : "false");
        });

        // Actualizar botones anterior / siguiente
        if (prevBtn) {
          const isAtStart = grid.scrollLeft <= 4;
          prevBtn.disabled = isAtStart;
          prevBtn.setAttribute("aria-disabled", isAtStart ? "true" : "false");
        }
        if (nextBtn) {
          const isAtEnd = grid.scrollLeft >= maxScroll - 4 || maxScroll <= 0;
          nextBtn.disabled = isAtEnd;
          nextBtn.setAttribute("aria-disabled", isAtEnd ? "true" : "false");
        }
      }

      // Eventos en botones
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          const currentIdx = getCurrentIndex();
          scrollToIndex(currentIdx - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          const currentIdx = getCurrentIndex();
          scrollToIndex(currentIdx + 1);
        });
      }

      // Eventos en dots
      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          scrollToIndex(index);
        });
      });

      // Sincronizar en scroll
      let ticking = false;
      grid.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              updateControlsState();
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );

      // Sincronizar en resize de ventana
      window.addEventListener(
        "resize",
        () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              updateControlsState();
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );

      // Inicialización
      updateControlsState();
    });
  }

  /* ========================================================================
     3. HEADER STICKY & MENÚ HAMBURGUESA MOBILE
     ======================================================================== */
  const header = document.querySelector(".site-header");
  const heroSection = document.querySelector(".hero-section");
  const headerBrandLink = document.querySelector(".header-brand-link");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link");

  // Lleva la ventana al inicio del contenido de la sección (después del padding),
  // justo debajo del header, en vez de al borde superior de la sección.
  const scrollToSection = (target) => {
    const padTop = parseFloat(getComputedStyle(target).paddingTop) || 0;
    const headerH = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY + padTop - headerH - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.classList.contains("mobile-nav-link") || link.classList.contains("floating-contact-scroll")) return;
    const id = link.getAttribute("href");
    if (id.length < 2 || id === "#inicio" || id === "#main-content") return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", id);
    scrollToSection(target);
  });

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
        // Pasado el hero, el header toma el color principal
        const heroEnd = heroSection ? heroSection.offsetTop + heroSection.offsetHeight - header.offsetHeight : Infinity;
        header.classList.toggle("on-primary", window.scrollY >= heroEnd);
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
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        mobileMenu.classList.remove("open");
        menuToggle.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");

        if (target) {
          window.history.pushState(null, "", link.getAttribute("href"));
          window.setTimeout(() => {
            scrollToSection(target);
          }, 360);
        }
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
          scrollToSection(contactSection);
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
