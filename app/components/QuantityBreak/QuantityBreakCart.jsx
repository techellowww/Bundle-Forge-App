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
    <s-section>
      <s-card>
        <s-stack direction="block" gap="loose" alignment="center">
          <s-stack direction="block" gap="extra-tight" alignment="center">
            <s-heading variant="headingMd">
              {discountTitle || "Volume discount save"}
            </s-heading>
            <s-text tone="subdued">
              {discountDescription || "Best deals selected for you!"}
            </s-text>
          </s-stack>

          <s-stack direction="block" gap="small" width="100%">
            {tiers?.map((tier, index) => {
              const isSelected = selectedIndex === index;
              const tierUnitPrice = calculateDiscountedPrice(tier);
              const tierTotal = tierUnitPrice * tier.quantity;
              const tierOriginalTotal = basePrice * tier.quantity;

              return (
                <s-box
                  key={index}
                  padding="base"
                  borderRadius="base"
                  border={isSelected ? "bold" : "base"}
                  background={isSelected ? "surface-secondary" : "surface"}
                  onClick={() => setSelectedIndex(index)}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                >
                  <s-grid
                    gridTemplateColumns="auto 1fr auto"
                    gap="base"
                    alignment="center"
                  >
                    <s-box
                      width="20px"
                      height="20px"
                      borderRadius="full"
                      border="bold"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderColor: isSelected
                          ? "var(--s-color-border-info)"
                          : "var(--s-color-border-base)",
                      }}
                    >
                      {isSelected && (
                        <s-box
                          width="10px"
                          height="10px"
                          borderRadius="full"
                          background="info"
                        />
                      )}
                    </s-box>

                    <s-stack
                      direction="horizontal"
                      gap="tight"
                      alignment="center"
                    >
                      <s-text fontWeight="bold">
                        {tier.tierTitle || "Bundle"}
                      </s-text>

                      {tier.labelEnabled && (
                        <s-badge tone="attention" size="small">
                          {tier.labelText}
                        </s-badge>
                      )}

                      {tier.tagEnabled && (
                        <s-text tone="subdued" variant="bodySm">
                          ({tier.tagText})
                        </s-text>
                      )}
                    </s-stack>

                    <s-stack direction="block" alignment="end" gap="none">
                      <s-text fontWeight="bold">
                        ₹{tierTotal.toLocaleString()}
                      </s-text>
                      <s-text
                        tone="subdued"
                        decoration="line-through"
                        variant="bodySm"
                      >
                        ₹{tierOriginalTotal.toLocaleString()}
                      </s-text>
                    </s-stack>
                  </s-grid>
                </s-box>
              );
            })}
          </s-stack>

          <s-stack direction="block" gap="small" width="100%">
            <s-divider></s-divider>
            <s-grid gridTemplateColumns="1fr auto" alignment="center">
              <s-text variant="headingSm">Total bundle price :</s-text>
              <s-stack direction="horizontal" gap="tight" alignment="center">
                <s-text variant="headingMd" fontWeight="bold">
                  ₹{totalDiscounted.toLocaleString()}
                </s-text>
                <s-text
                  tone="subdued"
                  decoration="line-through"
                  variant="bodySm"
                >
                  ₹{totalOriginal.toLocaleString()}
                </s-text>
              </s-stack>
            </s-grid>

            <s-button
              variant="primary"
              size="large"
              fullWidth
              onClick={() => saveOffer(selectedTier)}
              style={{ backgroundColor: "#1a1a1a", color: "white" }}
            >
              Add bundles to cart (
              {selectedTier.label || `${selectedTier.value}% OFF`})
            </s-button>
          </s-stack>
        </s-stack>
      </s-card>
    </s-section>
  );
};

export default QuantityBreakcart;
