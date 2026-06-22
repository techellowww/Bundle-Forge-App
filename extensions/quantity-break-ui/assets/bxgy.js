document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("bxgy-root");
  if (!root) return;

  const productId = root.dataset.productId;

  try {
    const res = await fetch(
      `/apps/quantity-break?type=bxgy&productId=${productId}`,
    );
    const data = await res.json();

    if (!data?.offers?.length) return;

    root.innerHTML = `
      <div style="margin: 16px 0;">
        <div style="
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-bottom: 10px;
        ">
          Bundle Offers
        </div>
    
        ${data.offers
          .map((offer) => {
            let subtitle = "";
            if (offer.productGift) {
              subtitle =
                offer.productGift.discountType === "free"
                  ? "Free Gift Included"
                  : `${offer.productGift.discountValue}% OFF Gift`;
            }
            if (offer.shippingGift) {
              subtitle = offer.shippingGift.enableFreeShipping
                ? "Free Shipping"
                : `${offer.shippingGift.discountValue}% Shipping OFF`;
            }

            const gifts = offer.productGift?.giftProducts?.length
              ? offer.productGift.giftProducts
                  .map(
                    (g) => `
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 13px;
                  color: #374151;
                  margin-top: 6px;
                ">
                  <span style="color: #15803d; font-weight: 700;">✓</span>
                  <span>${g.title}</span>
                </div>
              `,
                  )
                  .join("")
              : "";

            return `
            <div style="
              border: 1.5px solid #e5e7eb;
              border-radius: 10px;
              padding: 14px 16px;
              margin-bottom: 8px;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <div>
                <div style="font-size: 14px; font-weight: 600; color: #111827;">
                  ${offer.discountTitle || offer.title}
                </div>
                ${gifts}
              </div>
              <div style="
                background: #dcfce7;
                color: #15803d;
                font-size: 12px;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 20px;
                white-space: nowrap;
              ">
                ${subtitle}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  } catch (err) {
    console.error("BXGY Error:", err);
  }
});
