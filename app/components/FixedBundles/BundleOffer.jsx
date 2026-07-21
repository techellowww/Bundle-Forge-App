<<<<<<< HEAD

=======
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
  Checkbox,
} from "@shopify/polaris";
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

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
  requireMinQty,
  setRequireMinQty,
  minQuantity,
  setMinQuantity,
}) => {
  const MAX_PRODUCTS = 4;

  const openGiftProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: selectProducts.map((p) => ({ id: p.id })),
      });

      if (result && result.selection) {
        if (result.selection.length > MAX_PRODUCTS) {
          shopify.toast.show(
            `Maximum ${MAX_PRODUCTS} products can be selected.`,
            { isError: true },
          );
          return;
        }

        setSelectProducts(
          result.selection.map((product) => ({
            id: product.id,
            title: product.title,
            images: product.images || [],
            featuredImage: product.featuredImage || null,
            vendor: product.vendor,
            productType: product.productType,
            price: product.variants?.[0]?.price
              ? parseFloat(product.variants[0].price)
              : null,
          }))
        );
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
    <s-box background="surface" borderRadius="300" shadow="100" padding="large">
      <s-stack direction="block" gap="large">
        <s-text as="h2" variant="headingMd">
          Bundle Offer
        </s-text>

        <s-textField
          label="Offer title"
          value={title}
          onChange={setTitle}
          autoComplete="off"
        />

        <s-textField
          label="Discount description"
          value={description}
          onChange={setDescription}
          autoComplete="off"
        />

        <s-grid columns={2} gap="base">
          <s-textField
            label="Start date"
            type="date"
            value={startDate}
            onChange={setStartDate}
            autoComplete="off"
          />

          <s-textField
            label="End date"
            type="date"
            value={endDate}
            onChange={setEndDate}
            autoComplete="off"
          />
        </s-grid>

        <s-textField
          label="Offer percentage"
          type="number"
          suffix="%"
          value={offerPercentage}
          onChange={setOfferPercentage}
          autoComplete="off"
          helpText="Enter the discount percentage customers receive when purchasing the complete bundle."
        />

<<<<<<< HEAD
        <s-checkbox label="Require minimum purchase quantity" checked={requireMinQty} onInput={(e) => setRequireMinQty(e.target.checked)} />

        {requireMinQty && (
          <s-textField
=======
        <Checkbox
          label="Require minimum purchase quantity"
          checked={requireMinQty}
          onChange={setRequireMinQty}
        />

        {requireMinQty && (
          <TextField
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
            label="Minimum quantity to purchase"
            type="number"
            value={minQuantity}
            onChange={setMinQuantity}
            autoComplete="off"
            min={1}
          />
        )}

<<<<<<< HEAD
        <s-stack direction="block" gap="small-200">
          <s-text as="h3" variant="headingSm">
=======
        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
            Bundle Products
          </s-text>

          <s-text as="p" tone="subdued">
            Select a minimum of 2 and a maximum of 4 products.
          </s-text>

          <s-box paddingBlockStart="base">
            <s-button
              variant="primary"
              onClick={openGiftProductPicker}
              disabled={isAtLimit}
            >
              {isAtLimit ? "Maximum products selected" : "Select Products"}
            </s-button>
          </s-box>
        </s-stack>

        {selectProducts.length > 0 && (
          <s-stack direction="block" gap="base">
            <s-text as="p" variant="bodyMd">
              Selected Products ({selectProducts.length}/{MAX_PRODUCTS})
            </s-text>

            {selectProducts.map((product) => {
              const discounted = getDiscountedPrice(product.price);

              return (
<<<<<<< HEAD
                <s-box key={product.id} padding="small-200" border="base subdued solid" borderRadius="small-200">
                  <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                    <s-stack direction="inline" gap="small-200" alignItems="center">
                      <s-thumbnail
=======
                <Box
                  key={product.id}
                  padding="200"
                  borderWidth="025"
                  borderColor="border"
                  borderRadius="200"
                >
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Thumbnail
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
                        source={
                          product.featuredImage?.url ||
                          product.images?.[0]?.url ||
                          product.images?.[0]?.originalSrc ||
                          "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
                        }
                        alt={product.title}
                        size="small"
                      />

<<<<<<< HEAD
                      <s-stack direction="block" gap="0">
                        <s-text as="span" fontWeight="medium" variant="bodyMd">
=======
                      <BlockStack gap="0">
                        <Text as="span" fontWeight="medium" variant="bodyMd">
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
                          {product.title}
                        </s-text>

                        {product.vendor && (
                          <s-text as="span" variant="bodySm" tone="subdued">
                            {product.vendor}
                          </s-text>
                        )}

                        {product.price != null && (
                          <s-stack direction="inline" gap="small-200">
                            {discounted ? (
                              <>
                                <s-text as="span" variant="bodySm" tone="subdued">
                                  <del>${product.price.toFixed(2)}</del>
                                </s-text>

                                <s-text as="span" variant="bodySm" tone="success">
                                  ${discounted}
                                </s-text>
                              </>
                            ) : (
                              <s-text as="span" variant="bodySm" tone="subdued">
                                ${product.price.toFixed(2)}
                              </s-text>
                            )}
                          </s-stack>
                        )}
                      </s-stack>
                    </s-stack>

                    <s-button
                      tone="critical"
                      variant="plain"
                      onClick={() => removeGiftProduct(product.id)}
                    >
                      Remove
<<<<<<< HEAD
                    </s-button>
                  </s-stack>
                </s-box>
=======
                    </Button>
                  </InlineStack>
                </Box>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
              );
            })}
          </s-stack>
        )}

        <s-select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
    <s-option value="active">Active</s-option>
    <s-option value="inactive">Inactive</s-option>
  </s-select>
      </s-stack>
    </s-box>
  );
};

export default BundleOffer;
