import { useState } from "react";
import { useNavigate } from "react-router";
import BasicInfo from "./BasicInfo";
import ApplyTwo from "./ApplyTwo";
import QuantityBreakTier from "./QuantityBreakTier";
import QuantityBreakcart from "./QuantityBreakcart";

const QuantityBreak = ({ offer }) => {
  const navigate = useNavigate();
  const isEditing = !!offer;

  const [title, setTitle] = useState(offer?.title ?? "Buy More Save More");
  const [discountTitle, setDiscountTitle] = useState(
    offer?.discountTitle ?? "Volume discount save",
  );
  const [discountDescription, setDiscountDescription] = useState(
    offer?.discountDescription ?? "Best deals selected for you!",
  );
  const [startDate, setStartDate] = useState(
    offer?.startDate
      ? new Date(offer.startDate).toISOString().split("T")[0]
      : null,
  );
  const [endDate, setEndDate] = useState(
    offer?.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : null,
  );

  const [subTitleEnabled, setSubTitleEnabled] = useState(false);
  const [labelEnabled, setLabelEnabled] = useState(false);
  const [tagEnabled, setTagEnabled] = useState(false);
  const [preSelect, setPreSelect] = useState(false);

  const [applyTo, setApplyTo] = useState(offer?.applyTo ?? "allProducts");

  const [selectedProducts, setSelectedProducts] = useState(
    offer?.products
      ?.filter((p) => !p.isExcluded)
      .map((p) => ({
        id: `gid://shopify/Product/${p.productId}`,
        title: p.title,
      })) ?? [],
  );

  const [excludedProducts, setExcludedProducts] = useState(
    offer?.products
      ?.filter((p) => p.isExcluded)
      .map((p) => ({
        id: `gid://shopify/Product/${p.productId}`,
        title: p.title,
      })) ?? [],
  );

  const [selectedVendors, setSelectedVendors] = useState(
    offer?.vendors?.map((v) => v.vendor) ?? [],
  );

  const [selectedTypes, setSelectedTypes] = useState(
    offer?.types?.map((t) => t.type) ?? [],
  );

  const [selectedCollections, setSelectedCollections] = useState(
    offer?.collections?.map((c) => ({
      id: `gid://shopify/Collection/${c.collectionId}`,
      title: c.title ?? "",
    })) ?? [],
  );

  const [tiers, setTiers] = useState(
    offer?.tiers?.map((t) => ({
      tierTitle: t.tierTitle ?? "New Title",
      quantity: t.quantity,
      discountType: t.discountType,
      value: t.value,
      subTitleText: t.subTitleText ?? "Buy 2 and get One",
      labelText: t.labelText ?? "Discount",
      tagText: t.tagText ?? "Most popular",
      subTitleEnabled: !!t.subTitleText,
      labelEnabled: !!t.labelText,
      tagEnabled: !!t.tagText,
      preSelect: t.preSelect ?? false,
    })) ?? [
      {
        tierTitle: "New Title",
        quantity: 1,
        discountType: "percentage",
        value: "",
        subTitleText: "Buy 2 and get One",
        labelText: "Discount",
        tagText: "Most popular",
        subTitleEnabled: false,
        labelEnabled: false,
        tagEnabled: false,
      },
    ],
  );

  const saveOffer = async () => {
    try {
      const payload = {
        ...(isEditing && { id: offer.id }),
        title,
        applyTo,
        discountTitle,
        discountDescription,
        startDate,
        endDate,
        tiers: tiers.map((t) => ({
          tierTitle: t.tierTitle,
          quantity: Number(t.quantity),
          discountType: t.discountType,
          value: Number(t.value),
          subTitleEnabled: t.subTitleEnabled,
          labelEnabled: t.labelEnabled,
          tagEnabled: t.tagEnabled,
          subTitleText: t.subTitleEnabled ? t.subTitleText : null,
          labelText: t.labelEnabled ? t.labelText : null,
          tagText: t.tagEnabled ? t.tagText : null,
          preSelect: t.preSelect ?? false,
        })),
        products: selectedProducts.map((p) => ({
          productId: p.id.split("/").pop(),
          title: p.title,
          isExcluded: false,
        })),
        excludedProducts: excludedProducts.map((p) => ({
          productId: p.id.split("/").pop(),
          title: p.title,
          isExcluded: true,
        })),
        vendors: selectedVendors,
        productTypes: selectedTypes,
        collections: selectedCollections.map((c) => ({
          collectionId: c.id.split("/").pop(),
          title: c.title,
        })),
      };

      const res = await fetch("/api/quantity-break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        navigate("/app/quantity-breaks");
      } else {
        console.error("Save failed:", data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <s-page>
      <s-grid gridTemplateColumns="2fr 1fr" gap="large">
        <s-stack direction="block" gap="large">
          <s-section>
            <BasicInfo
              title={title}
              setTitle={setTitle}
              discountTitle={discountTitle}
              setDiscountTitle={setDiscountTitle}
              discountDescription={discountDescription}
              setDiscountDescription={setDiscountDescription}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          </s-section>

          <s-section>
            <ApplyTwo
              applyTo={applyTo}
              setApplyTo={setApplyTo}
              selectedProducts={selectedProducts}
              setSelectedProducts={setSelectedProducts}
              excludedProducts={excludedProducts}
              setExcludedProducts={setExcludedProducts}
              selectedVendors={selectedVendors}
              setSelectedVendors={setSelectedVendors}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              selectedCollections={selectedCollections}
              setSelectedCollections={setSelectedCollections}
            />
          </s-section>

          <s-section>
            <QuantityBreakTier
              tiers={tiers}
              setTiers={setTiers}
              subTitleEnabled={subTitleEnabled}
              setSubTitleEnabled={setSubTitleEnabled}
              labelEnabled={labelEnabled}
              setLabelEnabled={setLabelEnabled}
              tagEnabled={tagEnabled}
              setTagEnabled={setTagEnabled}
              preSelect={preSelect}
              setPreSelect={setPreSelect}
            />
          </s-section>
        </s-stack>

        <s-stack direction="block" gap="large">
          <s-card>
            <s-section>
              <s-heading>Summary</s-heading>
              <s-unordered-list>
                <s-list-item>Applies to selected products</s-list-item>
                <s-list-item>Customers get volume discount</s-list-item>
                <s-list-item>No usage limits</s-list-item>
                <s-list-item>Active immediately</s-list-item>
              </s-unordered-list>
            </s-section>
          </s-card>

          <s-section>
            <QuantityBreakcart
              discountTitle={discountTitle}
              discountDescription={discountDescription}
              tiers={tiers}
              selectedProducts={selectedProducts}
              saveOffer={saveOffer}
            />
          </s-section>
        </s-stack>
        <s-button variant="primary" onClick={saveOffer}>
          {isEditing ? "Update Offer" : "Save Offer"}
        </s-button>
      </s-grid>
    </s-page>
  );
};

export default QuantityBreak;
