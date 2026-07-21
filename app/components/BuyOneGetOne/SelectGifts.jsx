import {
  Card,
  BlockStack,
  InlineGrid,
  InlineStack,
  Box,
  Text,
  TextField,
  Select,
  Button,
  Thumbnail,
} from "@shopify/polaris";

const SelectGifts = ({
  discountType,
  setDiscountType,
  giftValue,
  setGiftValue,
  giftQuantity,
  setGiftQuantity,
  giftProducts,
  setGiftProducts,
}) => {
  const openGiftProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: giftProducts.map((p) => ({ id: p.id })),
      });

      if (result && result.selection) {
        setGiftProducts(
          result.selection.map((product) => ({
            id: product.id,
            title: product.title,
            images: product.images || [],
            featuredImage: product.featuredImage || null,
            vendor: product.vendor,
            productType: product.productType,
          })),
        );
      }
    } catch (error) {
      console.error("Gift product picker error:", error);
    }
  };

  const removeGiftProduct = (productId) => {
    setGiftProducts((prev) =>
      prev.filter((product) => product.id !== productId),
    );
  };

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Gift
        </Text>

        <Card background="bg-surface-secondary">
          <BlockStack gap="400">
            <InlineGrid columns={2} gap="400">
              <Select
                label="Discount Type"
                value={discountType}
                onChange={setDiscountType}
                options={[
                  {
                    label: "Free (100% off)",
                    value: "free",
                  },
                  {
                    label: "Percentage",
                    value: "percentage",
                  },
                  {
                    label: "Fixed Amount",
                    value: "fixedPrice",
                  },
                ]}
              />

              {discountType === "percentage" && (
                <TextField
                  label="Discount %"
                  type="number"
                  suffix="%"
                  min={0}
                  max={100}
                  placeholder="10"
                  value={String(giftValue ?? "")}
                  onChange={setGiftValue}
                  autoComplete="off"
                />
              )}

              {discountType === "fixedPrice" && (
                <TextField
                  label="Amount Off"
                  type="number"
                  min={0}
                  placeholder="10.00"
                  value={String(giftValue ?? "")}
                  onChange={setGiftValue}
                  autoComplete="off"
                />
              )}
            </InlineGrid>

            <TextField
              label="Number of gifts for customer to receive"
              type="number"
              min={1}
              value={String(giftQuantity)}
              onChange={setGiftQuantity}
              placeholder="1"
              autoComplete="off"
            />
          </BlockStack>
        </Card>

        <Box>
          <Button variant="primary" onClick={openGiftProductPicker}>
            Select Gift Products
          </Button>
        </Box>

        {giftProducts?.length > 0 && (
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd" tone="subdued">
              Selected Gift Products ({giftProducts.length})
            </Text>

            {giftProducts.map((product) => (
              <Card key={product.id}>
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="300" blockAlign="center">
                    <Thumbnail
                      source={
                        product.featuredImage?.url ||
                        product.images?.[0]?.originalSrc ||
                        "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
                      }
                      alt={product.title}
                      size="small"
                    />

                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="medium">
                        {product.title}
                      </Text>

                      {product.vendor && (
                        <Text as="span" variant="bodySm" tone="subdued">
                          {product.vendor}
                        </Text>
                      )}
                    </BlockStack>
                  </InlineStack>

                  <Button
                    tone="critical"
                    variant="plain"
                    onClick={() => removeGiftProduct(product.id)}
                  >
                    Remove
                  </Button>
                </InlineStack>
              </Card>
            ))}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
};

export default SelectGifts;
