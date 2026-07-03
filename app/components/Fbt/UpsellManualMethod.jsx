const UpsellManualMethod = ({ bundledProducts, setBundledProducts }) => {
  const openProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });

      if (result?.selection?.length) {
        const newProducts = result.selection.map((product) => ({
          id: product.id,
          title: product.title,
          images: product.images || [],
          vendor: product.vendor,
        }));

        setBundledProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));

          return [
            ...prev,
            ...newProducts.filter((product) => !existingIds.has(product.id)),
          ];
        });
      }
    } catch (error) {
      console.error("Product picker error:", error);
    }
  };

  const removeProduct = (id) => {
    setBundledProducts((prev) => prev.filter((product) => product.id !== id));
  };

  return (
    <BlockStack gap="400">
      <Button variant="primary" onClick={openProductPicker}>
        Select Bundled Products
      </Button>

      {bundledProducts?.length > 0 && (
        <BlockStack gap="300">
          {bundledProducts.map((product) => (
            <Card key={product.id}>
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="300" blockAlign="center">
                  <Thumbnail
                    source={
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
                  onClick={() => removeProduct(product.id)}
                >
                  Remove
                </Button>
              </InlineStack>
            </Card>
          ))}
        </BlockStack>
      )}
    </BlockStack>
  );
};

export default UpsellManualMethod;
