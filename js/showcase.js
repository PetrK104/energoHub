(function () {
  const images = document.querySelectorAll(".showcase-image");
  const prevBtn = document.getElementById("showcasePrev");
  const nextBtn = document.getElementById("showcaseNext");

  if (!images.length || !prevBtn || !nextBtn) return;

  let current = 0;

  function show(index) {
    current = (index + images.length) % images.length;
    images.forEach((img, i) => {
      img.classList.toggle("is-active", i === current);
    });
  }

  prevBtn.addEventListener("click", () => show(current - 1));
  nextBtn.addEventListener("click", () => show(current + 1));
})();
