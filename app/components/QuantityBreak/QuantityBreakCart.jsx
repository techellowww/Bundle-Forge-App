import { useState } from "react";

const QuantityBreakcart = ({
  discountTitle,
  discountDescription,
  tiers,
  selectedProducts,
  saveOffer,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(tiers.length - 1);

  const baseProduct = selectedProducts[0];
  const basePrice = baseProduct?.price || 1000;

  const calculateDiscountedPrice = (tier) => {
    const val = Number(tier.value) || 0;
    if (tier.discountType === "percentage")
      return basePrice - (basePrice * val) / 100;
    if (tier.discountType === "amount") return basePrice - val;
    if (tier.discountType === "fixedPrice") return val;
    return basePrice;
  };

  const selectedTier = tiers[selectedIndex];
  const unitPrice = calculateDiscountedPrice(selectedTier);
  const totalOriginal = basePrice * (Number(selectedTier?.quantity) || 0);
  const totalDiscounted = unitPrice * (Number(selectedTier?.quantity) || 0);

  return (
    <s-box paddingBlockEnd="base">
      <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack direction="block" gap="large">
          <s-stack direction="block" gap="small-100">
            <s-text as="h2" variant="headingMd">
              {discountTitle || "Volume discount save"}
            </s-text>
            <s-text as="p" tone="subdued">
              {discountDescription || "Best deals selected for you!"}
            </s-text>
          </s-stack>

          <s-stack direction="block" gap="small-200">
            {tiers?.map((tier, index) => {
              const isSelected = selectedIndex === index;
              const tierUnitPrice = calculateDiscountedPrice(tier);
              const tierTotal = tierUnitPrice * tier.quantity;
              const tierOriginalTotal = basePrice * tier.quantity;

              return (
                <div
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  style={{ cursor: "pointer", outline: "none" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedIndex(index);
                    }
                  }}
                >
                  <s-box padding="base" borderRadius="small-200" border={isSelected ? "brand solid" : "base subdued solid"} background={isSelected ? "brand-secondary" : "base"}>
                    <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                      <s-stack direction="inline" gap="base" alignItems="center">
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: isSelected ? "2px solid #005bd3" : "1px solid #8c9196", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isSelected && (
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#005bd3" }} />
                          )}
                        </div>

                        <s-stack direction="inline" gap="small-200" alignItems="center">
                          <s-text as="span" fontWeight="bold">
                            {tier.tierTitle || "Bundle"}
                          </s-text>

                          {tier.labelEnabled && (
                            <s-badge tone="attention">
                              {tier.labelText}
                            </s-badge>
                          )}

                          {tier.tagEnabled && (
                            <s-text as="span" tone="subdued" variant="bodySm">
                              ({tier.tagText})
                            </s-text>
                          )}
                        </s-stack>
                      </s-stack>

                      <s-stack direction="block" gap="0" alignItems="end">
                        <s-text as="span" fontWeight="bold">
                          ₹{tierTotal.toLocaleString()}
                        </s-text>
                        <s-text
                          as="span"
                          tone="subdued"
                          textDecorationLine="line-through"
                          variant="bodySm"
                        >
                          ₹{tierOriginalTotal.toLocaleString()}
                        </s-text>
                      </s-stack>
                    </s-stack>
                  </s-box>
                </div>
              );
            })}
          </s-stack>

          <s-stack direction="block" gap="base">
            <s-divider></s-divider>
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-text as="span" variant="headingSm">Total bundle price :</s-text>
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <s-text as="span" variant="headingMd" fontWeight="bold">
                  ₹{totalDiscounted.toLocaleString()}
                </s-text>
                <s-text
                  as="span"
                  tone="subdued"
                  textDecorationLine="line-through"
                  variant="bodySm"
                >
                  ₹{totalOriginal.toLocaleString()}
                </s-text>
              </s-stack>
            </s-stack>

            <s-button
              variant="primary"
              size="large"
              fullWidth
              onClick={() => saveOffer(selectedTier)}
            >
              Add bundles to cart (
              {selectedTier.label || `${selectedTier.value}% OFF`})
            </s-button>
          </s-stack>
        </s-stack>
      </s-box>
    </s-box>
  );
};

export default QuantityBreakcart;
