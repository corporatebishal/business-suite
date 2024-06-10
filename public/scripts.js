document.addEventListener("DOMContentLoaded", function() {
  const menuItems = document.querySelectorAll("nav ul li a");

  menuItems.forEach(item => {
    item.addEventListener("click", function() {
      const subMenu = this.nextElementSibling;
      if (subMenu && subMenu.tagName === "UL") {
        subMenu.classList.toggle("active");
      }
    });
  });
});
