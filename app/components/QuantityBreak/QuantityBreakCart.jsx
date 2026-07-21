import { useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Badge,
  Divider,
  Button
} from "@shopify/polaris";

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
<<<<<<< HEAD
    <s-box paddingBlockEnd="base">
      <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack direction="block" gap="large">
          <s-stack direction="block" gap="small-100">
            <s-text as="h2" variant="headingMd">
              {discountTitle || "Volume discount save"}
            </s-text>
            <s-text as="p" tone="subdued">
=======
    <Box paddingBlockEnd="400">
      <Card>
        <BlockStack gap="500">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              {discountTitle || "Volume discount save"}
            </Text>
            <Text as="p" tone="subdued">
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
              {discountDescription || "Best deals selected for you!"}
            </Text>
          </BlockStack>

<<<<<<< HEAD
          <s-stack direction="block" gap="small-200">
=======
          <BlockStack gap="200">
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
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
<<<<<<< HEAD
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
=======
                  <Box
                    padding="300"
                    borderRadius="200"
                    borderWidth={isSelected ? "050" : "025"}
                    borderColor={isSelected ? "border-brand" : "border"}
                    background={isSelected ? "bg-surface-brand" : "bg-surface"}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="300" blockAlign="center">
                        <Box
                          width="20px"
                          height="20px"
                          borderRadius="full"
                          borderWidth="025"
                          borderColor={isSelected ? "border-brand" : "border"}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && (
                            <Box
                              width="10px"
                              height="10px"
                              borderRadius="full"
                              background="bg-surface-brand-active"
                            />
                          )}
                        </Box>

                        <InlineStack gap="200" blockAlign="center">
                          <Text as="span" fontWeight="bold">
                            {tier.tierTitle || "Bundle"}
                          </Text>

                          {tier.labelEnabled && (
                            <Badge tone="attention">
                              {tier.labelText}
                            </Badge>
                          )}

                          {tier.tagEnabled && (
                            <Text as="span" tone="subdued" variant="bodySm">
                              ({tier.tagText})
                            </Text>
                          )}
                        </InlineStack>
                      </InlineStack>

                      <BlockStack gap="0" inlineAlign="end">
                        <Text as="span" fontWeight="bold">
                          ₹{tierTotal.toLocaleString()}
                        </Text>
                        <Text
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
                          as="span"
                          tone="subdued"
                          textDecorationLine="line-through"
                          variant="bodySm"
                        >
                          ₹{tierOriginalTotal.toLocaleString()}
<<<<<<< HEAD
                        </s-text>
                      </s-stack>
                    </s-stack>
                  </s-box>
=======
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </Box>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
                </div>
              );
            })}
          </BlockStack>

<<<<<<< HEAD
          <s-stack direction="block" gap="base">
            <s-divider></s-divider>
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-text as="span" variant="headingSm">Total bundle price :</s-text>
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <s-text as="span" variant="headingMd" fontWeight="bold">
                  ₹{totalDiscounted.toLocaleString()}
                </s-text>
                <s-text
=======
          <BlockStack gap="400">
            <Divider />
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="headingSm">Total bundle price :</Text>
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="headingMd" fontWeight="bold">
                  ₹{totalDiscounted.toLocaleString()}
                </Text>
                <Text
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
                  as="span"
                  tone="subdued"
                  textDecorationLine="line-through"
                  variant="bodySm"
                >
                  ₹{totalOriginal.toLocaleString()}
<<<<<<< HEAD
                </s-text>
              </s-stack>
            </s-stack>
=======
                </Text>
              </InlineStack>
            </InlineStack>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={() => saveOffer(selectedTier)}
            >
              Add bundles to cart (
              {selectedTier.label || `${selectedTier.value}% OFF`})
<<<<<<< HEAD
            </s-button>
          </s-stack>
        </s-stack>
      </s-box>
    </s-box>
=======
            </Button>
          </BlockStack>
        </BlockStack>
      </Card>
    </Box>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
  );
};

export default QuantityBreakcart;
