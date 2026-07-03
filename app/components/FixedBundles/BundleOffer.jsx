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

const BundleOffer = ({
  title,
  setTitle,
  description,
  setDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  status,
  setStatus,
  selectProducts,
  setSelectProducts,
  offerPercentage,
  setOfferPercentage,
}) => {
  const MAX_PRODUCTS = 4;

  const openGiftProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });

      if (result?.selection?.length) {
        setSelectProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));

          const newProducts = result.selection
            .filter((p) => !existingIds.has(p.id))
            .map((product) => ({
              id: product.id,
              title: product.title,
              images: product.images || [],
              featuredImage: product.featuredImage || null,
              vendor: product.vendor,
              productType: product.productType,
              price: product.variants?.[0]?.price
                ? parseFloat(product.variants[0].price)
                : null,
            }));

          const merged = [...prev, ...newProducts];

          if (merged.length > MAX_PRODUCTS) {
            shopify.toast.show(
              `Maximum ${MAX_PRODUCTS} products can be selected.`,
              { isError: true },
            );
            return prev;
          }

          return merged;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeGiftProduct = (id) => {
    setSelectProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const isAtLimit = selectProducts.length >= MAX_PRODUCTS;

  const getDiscountedPrice = (price) => {
    if (!price || !offerPercentage) return null;

    const pct = Number(offerPercentage);

    if (isNaN(pct) || pct <= 0 || pct > 100) return null;

    return (price * (1 - pct / 100)).toFixed(2);
  };

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Bundle Offer
        </Text>

        <TextField
          label="Offer title"
          value={title}
          onChange={setTitle}
          autoComplete="off"
        />

        <TextField
          label="Discount description"
          value={description}
          onChange={setDescription}
          autoComplete="off"
        />

        <InlineGrid columns={2} gap="400">
          <TextField
            label="Start date"
            type="date"
            value={startDate}
            onChange={setStartDate}
            autoComplete="off"
          />

          <TextField
            label="End date"
            type="date"
            value={endDate}
            onChange={setEndDate}
            autoComplete="off"
          />
        </InlineGrid>

        <TextField
          label="Offer percentage"
          type="number"
          suffix="%"
          value={offerPercentage}
          onChange={setOfferPercentage}
          autoComplete="off"
          helpText="Enter the discount percentage customers receive when purchasing the complete bundle."
        />

        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            Bundle Products
          </Text>

          <Text as="p" tone="subdued">
            Select a minimum of 2 and a maximum of 4 products.
          </Text>

          <Box paddingBlockStart="300">
            <Button
              variant="primary"
              onClick={openGiftProductPicker}
              disabled={isAtLimit}
            >
              {isAtLimit ? "Maximum products selected" : "Select Products"}
            </Button>
          </Box>
        </BlockStack>

        {selectProducts.length > 0 && (
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              Selected Products ({selectProducts.length}/{MAX_PRODUCTS})
            </Text>

            {selectProducts.map((product) => {
              const discounted = getDiscountedPrice(product.price);

              return (
                <Card key={product.id} roundedAbove="sm">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <Thumbnail
                        source={
                          product.featuredImage?.url ||
                          product.images?.[0]?.url ||
                          product.images?.[0]?.originalSrc ||
                          "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
                        }
                        alt={product.title}
                        size="small"
                      />

                      <BlockStack gap="100">
                        <Text as="span" fontWeight="medium">
                          {product.title}
                        </Text>

                        {product.vendor && (
                          <Text as="span" variant="bodySm" tone="subdued">
                            {product.vendor}
                          </Text>
                        )}

                        {product.price != null && (
                          <InlineStack gap="200">
                            {discounted ? (
                              <>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  <del>${product.price.toFixed(2)}</del>
                                </Text>

                                <Text as="span" variant="bodySm" tone="success">
                                  ${discounted}
                                </Text>
                              </>
                            ) : (
                              <Text as="span" variant="bodySm" tone="subdued">
                                ${product.price.toFixed(2)}
                              </Text>
                            )}
                          </InlineStack>
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
              );
            })}
          </BlockStack>
        )}

        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            {
              label: "Active",
              value: "active",
            },
            {
              label: "Inactive",
              value: "inactive",
            },
          ]}
        />
      </BlockStack>
    </Card>
  );
};

export default BundleOffer;
