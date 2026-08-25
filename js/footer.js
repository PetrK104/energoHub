(function () {
  const form = document.getElementById("footerNewsletter");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.reset();
  });
})();
