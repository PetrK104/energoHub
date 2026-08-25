(function () {
  const pinWrapper = document.querySelector(".process");
  const steps = document.querySelectorAll(".process-step");
  if (!pinWrapper || !steps.length) return;

  const MOBILE_BP = 1100;
  let ticking = false;

  function setActive(index) {
    steps.forEach((s, i) => s.classList.toggle("is-active", i === index));
  }

  function updateDesktop() {
    const rect = pinWrapper.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    let p = scrollable > 0 ? -rect.top / scrollable : 0;
    p = Math.min(1, Math.max(0, p));
    const index = Math.min(steps.length - 1, Math.floor(p * steps.length));
    setActive(index);
  }

  function updateMobile() {
    const triggerY = window.innerHeight * 0.55;
    let activeIndex = 0;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top + r.height / 2 <= triggerY) activeIndex = i;
    });
    setActive(activeIndex);
  }

  function update() {
    ticking = false;
    window.innerWidth <= MOBILE_BP ? updateMobile() : updateDesktop();
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
