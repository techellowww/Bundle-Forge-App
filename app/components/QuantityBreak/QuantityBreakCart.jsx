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
    <Box paddingBlockEnd="400">
      <Card>
        <BlockStack gap="500">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              {discountTitle || "Volume discount save"}
            </Text>
            <Text as="p" tone="subdued">
              {discountDescription || "Best deals selected for you!"}
            </Text>
          </BlockStack>

          <BlockStack gap="200">
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
                          as="span"
                          tone="subdued"
                          textDecorationLine="line-through"
                          variant="bodySm"
                        >
                          ₹{tierOriginalTotal.toLocaleString()}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </Box>
                </div>
              );
            })}
          </BlockStack>

          <BlockStack gap="400">
            <Divider />
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="headingSm">Total bundle price :</Text>
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="headingMd" fontWeight="bold">
                  ₹{totalDiscounted.toLocaleString()}
                </Text>
                <Text
                  as="span"
                  tone="subdued"
                  textDecorationLine="line-through"
                  variant="bodySm"
                >
                  ₹{totalOriginal.toLocaleString()}
                </Text>
              </InlineStack>
            </InlineStack>

            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={() => saveOffer(selectedTier)}
            >
              Add bundles to cart (
              {selectedTier.label || `${selectedTier.value}% OFF`})
            </Button>
          </BlockStack>
        </BlockStack>
      </Card>
    </Box>
  );
};

export default QuantityBreakcart;
