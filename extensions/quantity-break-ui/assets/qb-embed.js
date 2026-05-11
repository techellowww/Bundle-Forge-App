(function () {

  // Run everywhere
  const productForm = document.querySelector('form[action*="/cart/add"]');

  if (productForm) {

    // Example: listen to quantity change
    const qtyInput = productForm.querySelector('input[name="quantity"]');

    if (qtyInput) {
      qtyInput.addEventListener("change", () => {
      });
    }
  }

  // You can also:
  // - Inject React app
  // - Listen to cart drawer
  // - Auto apply logic
})();
