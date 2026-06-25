let currentSection = 0;
let isAnimating = false;
const sections = [];
let scrollSnapEnabled = true;

function initScrollController() {
  const sectionEls = document.querySelectorAll('.section');
  sectionEls.forEach((el, index) => {
    sections.push({
      el,
      index,
      title: el.querySelector('.section-title, .hero-title')?.textContent || ''
    });
  });

  const dots = document.querySelectorAll('.nav-dot');
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = Number(dot.dataset.section);
      scrollToSection(index);
    });
  });

  document.querySelector('.hero-start')?.addEventListener('click', () => {
    scrollToSection(1);
  });

  document.addEventListener('wheel', handleWheel, { passive: false });
  document.addEventListener('keydown', handleKeydown);

  initScrollAnimations();
  updateActiveDot();

  window.addEventListener('resize', () => {
    scrollSnapEnabled = window.innerWidth > 768;
  });
  scrollSnapEnabled = window.innerWidth > 768;
}

function handleWheel(e) {
  if (!scrollSnapEnabled) return;
  e.preventDefault();

  if (isAnimating) return;

  const direction = e.deltaY > 0 ? 1 : -1;
  const nextIndex = currentSection + direction;

  if (nextIndex >= 0 && nextIndex < sections.length) {
    scrollToSection(nextIndex);
  }
}

function handleKeydown(e) {
  if (!scrollSnapEnabled) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault();
    scrollToSection(Math.min(currentSection + 1, sections.length - 1));
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    scrollToSection(Math.max(currentSection - 1, 0));
  } else if (e.key === 'Home') {
    e.preventDefault();
    scrollToSection(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    scrollToSection(sections.length - 1);
  }
}

function scrollToSection(index) {
  if (index === currentSection || isAnimating) return;
  if (index < 0 || index >= sections.length) return;

  isAnimating = true;
  currentSection = index;

  const target = sections[index].el;

  gsap.to(window, {
    duration: 1,
    scrollTo: { y: target, autoKill: false },
    ease: 'power3.inOut',
    onComplete: () => {
      isAnimating = false;
      updateActiveDot();
      setHeroShapeVisible(index === 0);
    }
  });

  updateActiveDot();
  setHeroShapeVisible(index === 0);
}

function updateActiveDot() {
  document.querySelectorAll('.nav-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSection);
  });
}

function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  sections.forEach((section, index) => {
    const content = section.el.querySelector('.section-content');
    if (!content) return;

    gsap.fromTo(content,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section.el,
          start: 'top 60%',
          end: 'top 30%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });
}

window.scrollToSection = scrollToSection;
window.initScrollController = initScrollController;
