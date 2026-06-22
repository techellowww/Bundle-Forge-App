const UpsellManualMethod = ({ bundledProducts, setBundledProducts }) => {
  const openProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });
      if (result?.selection?.length) {
        const newProducts = result.selection.map((p) => ({
          id: p.id,
          title: p.title,
          images: p.images || [],
          vendor: p.vendor,
        }));
        // Merge — avoid duplicates
        setBundledProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [
            ...prev,
            ...newProducts.filter((p) => !existingIds.has(p.id)),
          ];
        });
      }
    } catch (err) {
      console.error("Product picker error:", err);
    }
  };

  const removeProduct = (id) =>
    setBundledProducts((prev) => prev.filter((p) => p.id !== id));

  return (
    <s-stack direction="block" gap="base">
      <s-button onClick={openProductPicker}>Select bundled products</s-button>

      {bundledProducts?.length > 0 && (
        <s-stack direction="block" gap="small">
          {bundledProducts.map((product) => (
            <s-card key={product.id}>
              <s-grid
                gridTemplateColumns="auto 1fr auto"
                gap="small"
                blockAlignment="center"
              >
                <img
                  src={product.images?.[0]?.originalSrc || "/placeholder.png"}
                  width="40"
                  height="40"
                  alt={product.title}
                  style={{ borderRadius: "4px", objectFit: "cover" }}
                />
                <div>
                  <s-text variant="bodyMd">{product.title}</s-text>
                  {product.vendor && (
                    <s-text variant="bodySm" tone="subdued">
                      {product.vendor}
                    </s-text>
                  )}
                </div>
                <s-button
                  tone="critical"
                  variant="plain"
                  onClick={() => removeProduct(product.id)}
                >
                  Remove
                </s-button>
              </s-grid>
            </s-card>
          ))}
        </s-stack>
      )}
    </s-stack>
  );
};

export default UpsellManualMethod;
