document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("quantity-break-root");
  if (!root) return;

  const productId = root.dataset.productId;

  try {
    const res = await fetch(`/apps/quantity-break?productId=${productId}`);
    const data = await res.json();

    if (!data?.tiers?.length) {
      root.innerHTML = "<p>No offers available</p>";
      return;
    }

    root.innerHTML = data.tiers
      .map(
        (tier) => `
      <div style="border:1px solid #ddd;padding:12px;margin-bottom:10px;border-radius:8px">
        <strong>${tier.tierTitle}</strong>
        <p>Buy ${tier.quantity} → Save ${tier.value}${tier.discountType === "percentage" ? "%" : ""}</p>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    console.error("Error loading quantity break:", err);
  }
});
