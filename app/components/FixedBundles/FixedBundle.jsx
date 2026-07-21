import { useState } from "react";
import { useNavigate } from "react-router";

const FixedBundle = ({ offer }) => {
  const navigate = useNavigate();
  const isEditing = !!offer;

  const [title, setTitle] = useState(
    offer?.title ?? "Frequently Bought Together #1",
  );
  const [description, setDescription] = useState(
    offer?.description ?? "Purchase and save up to 20%",
  );
  const [startDate, setStartDate] = useState(
    offer?.startDate
      ? new Date(offer.startDate).toISOString().split("T")[0]
      : null,
  );
  const [endDate, setEndDate] = useState(
    offer?.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : null,
  );
  const [offerPercentage, setOfferPercentage] = useState(
    offer?.offerPercentage != null ? String(offer.offerPercentage) : "",
  );
  const [requireMinQty, setRequireMinQty] = useState(
    offer?.minQuantity != null && offer.minQuantity > 0,
  );
  const [minQuantity, setMinQuantity] = useState(
    offer?.minQuantity != null ? String(offer.minQuantity) : "1",
  );
  const [status, setStatus] = useState(offer?.status ?? "active");
  const [selectProducts, setSelectProducts] = useState(
    offer?.products?.map((p) => ({
      id: p.productId,
      title: p.title,
      vendor: p.vendor,
      productType: p.productType,
      featuredImage: p.imageUrl ? { url: p.imageUrl } : null,
      images: [],
      price: null,
    })) || [],
  );

  const [saving, setSaving] = useState(false);

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

  const saveOffer = async () => {
    if (selectProducts.length < 2 || selectProducts.length > 4) {
      alert("Please select between 2 and 4 products for the bundle.");
      return;
    }

    const pct = parseFloat(offerPercentage);
    if (!offerPercentage || isNaN(pct) || pct <= 0 || pct > 100) {
      alert("Please enter a valid offer percentage between 1 and 100.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(isEditing && { id: offer.id }),
        title,
        description,
        startDate,
        endDate,
        status,
        offerPercentage: pct,
        minQuantity: requireMinQty ? parseInt(minQuantity, 10) || 1 : null,
        giftProducts: selectProducts.map((p) => ({
          id: p.id,
          title: p.title,
          vendor: p.vendor ?? null,
          productType: p.productType ?? null,
          featuredImage: p.featuredImage ?? null,
          images: p.images ?? [],
        })),
      };

      const res = await fetch("/api/fixed-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        navigate("/app/fixed-bundles");
      } else {
        alert(data.error || "Something went wrong.");
        console.error("Save failed:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <s-page>
<<<<<<< HEAD
=======
      <s-grid gridTemplateColumns="2fr 1fr" gap="large">
        <s-stack direction="block" gap="large">
          <BundleOffer
            title={title}
            setTitle={setTitle}
            status={status}
            setStatus={setStatus}
            description={description}
            setDescription={setDescription}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            selectProducts={selectProducts}
            setSelectProducts={setSelectProducts}
            offerPercentage={offerPercentage}
            setOfferPercentage={setOfferPercentage}
            requireMinQty={requireMinQty}
            setRequireMinQty={setRequireMinQty}
            minQuantity={minQuantity}
            setMinQuantity={setMinQuantity}
          />
        </s-stack>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

      <style>{`
        .offer-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--p-space-400, 16px);
          align-items: start;
        }
        @media (min-width: 768px) {
          .offer-layout-grid {
            grid-template-columns: minmax(0, 7fr) minmax(0, 3fr);
          }
        }
        .offer-main-col {
          display: grid;
          gap: var(--p-space-400, 16px);
        }
        .offer-summary-col {
          position: sticky;
          top: var(--p-space-400, 16px);
        }
      `}</style>

      <ui-title-bar title={isEditing ? "Edit Fixed Bundle Offer" : "Create Fixed Bundle Offer"}>
        <button variant="breadcrumb" onClick={() => navigate('/app/fixed-bundles')}>Fixed Bundles</button>
        <button variant="primary" onClick={saveOffer} disabled={saving}>
          {saving ? "Saving…" : (isEditing ? "Update Offer" : "Save Offer")}
        </button>
        <button onClick={() => navigate("/app/fixed-bundles")}>Cancel</button>
      </ui-title-bar>

      <div className="offer-layout-grid">
        <div className="offer-main-col">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
            {/* 1. Offer Information */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-100, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Offer Information</s-text>
                  <s-text tone="subdued" as="p">Basic details and status of the offer.</s-text>
                </div>
                <s-text-field
                  label="Offer title"
                  value={title}
                  onInput={(e) => setTitle(e.target.value)}
                  autoComplete="off"
                />
                <s-text-field
                  label="Discount description"
                  value={description}
                  onInput={(e) => setDescription(e.target.value)}
                  autoComplete="off"
                />
                <s-select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <s-option value="active">Active</s-option>
                  <s-option value="inactive">Inactive</s-option>
                </s-select>
              </div>
            </s-box>

            {/* 2. Products */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-100, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Products</s-text>
                  <s-text tone="subdued" as="p">Select the products eligible for this offer. Select a minimum of 2 and a maximum of 4 products.</s-text>
                </div>

                <s-box paddingBlockEnd="200">
                  <s-button
                    onClick={openGiftProductPicker}
                    disabled={isAtLimit}
                  >
                    {isAtLimit ? "Maximum products selected" : "Select Products"}
                  </s-button>
                </s-box>

                {selectProducts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-300, 16px)" }}>
                    <s-text as="p" variant="bodyMd">
                      Selected Products ({selectProducts.length}/{MAX_PRODUCTS})
                    </s-text>

                    {selectProducts.map((product) => {
                      const discounted = getDiscountedPrice(product.price);

                      return (
                        <s-box
                          key={product.id}
                          padding="200"
                          borderWidth="025"
                          borderColor="border"
                          borderRadius="200"
                        >
                          <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                            <s-stack direction="inline" gap="300" alignItems="center">
                              <s-thumbnail
                                source={
                                  product.featuredImage?.url ||
                                  product.images?.[0]?.url ||
                                  product.images?.[0]?.originalSrc ||
                                  "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
                                }
                                alt={product.title}
                                size="small"
                              />

                              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                                <s-text as="span" fontWeight="medium" variant="bodyMd">
                                  {product.title}
                                </s-text>

                                {product.vendor && (
                                  <s-text as="span" variant="bodySm" tone="subdued">
                                    {product.vendor}
                                  </s-text>
                                )}

                                {product.price != null && (
                                  <s-stack direction="inline" gap="300">
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
                              </div>
                            </s-stack>

                            <s-button
                              tone="critical"
                              variant="plain"
                              onClick={() => removeGiftProduct(product.id)}
                            >
                              Remove
                            </s-button>
                          </s-stack>
                        </s-box>
                      );
                    })}
                  </div>
                )}
              </div>
            </s-box>

            {/* 3. Discount Configuration */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-100, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Discount Configuration</s-text>
                  <s-text tone="subdued" as="p">Configure the discount percentage customers receive when purchasing the complete bundle.</s-text>
                </div>
                <s-text-field
                  label="Offer percentage"
                  type="number"
                  suffix="%"
                  value={offerPercentage}
                  onInput={(e) => setOfferPercentage(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </s-box>

            {/* 4. Purchase Conditions */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-100, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Purchase Conditions</s-text>
                  <s-text tone="subdued" as="p">Set minimum quantities required to trigger the offer.</s-text>
                </div>
                <s-checkbox
                  label="Require minimum purchase quantity"
                  checked={requireMinQty}
                  onChange={(e) => setRequireMinQty(e.target.checked)}
                />
                {requireMinQty && (
                  <s-text-field
                    label="Minimum quantity to purchase"
                    type="number"
                    value={minQuantity}
                    onInput={(e) => setMinQuantity(e.target.value)}
                    autoComplete="off"
                    min="1"
                  />
                )}
              </div>
            </s-box>

            {/* 5. Schedule */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-100, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Schedule</s-text>
                  <s-text tone="subdued" as="p">Define when the offer starts and ends.</s-text>
                </div>
                <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                  <s-text-field
                    label="Start date"
                    type="date"
                    value={startDate || ""}
                    onInput={(e) => setStartDate(e.target.value)}
                    autoComplete="off"
                  />
                  <s-text-field
                    label="End date"
                    type="date"
                    value={endDate || ""}
                    onInput={(e) => setEndDate(e.target.value)}
                    autoComplete="off"
                  />
                </s-grid>
              </div>
            </s-box>
          </div>
        </div>

        <div className="offer-summary-col">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <s-text as="h2" variant="headingMd">Summary</s-text>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                  <li>Applies to selected products</li>
                  <li>
                    {offerPercentage
                      ? `Customers get ${offerPercentage}% off when buying all bundle products`
                      : "Customers get a discount when buying all bundle products"}
                  </li>
                  <li>Active immediately after saving</li>
                </ul>
              </div>
            </s-box>
          </div>
        </div>
      </div>
    </s-page>
  );
};

export default FixedBundle;
