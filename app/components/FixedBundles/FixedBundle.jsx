import { useState } from "react";
import { useNavigate } from "react-router";
import BundleOffer from "./BundleOffer";

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
    }
  };

  return (
    <s-page>
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

        <s-stack direction="block" gap="large">
          <s-card>
            <s-section>
              <s-heading>Summary</s-heading>
              <s-unordered-list>
                <s-list-item>Applies to selected products</s-list-item>
                <s-list-item>
                  {offerPercentage
                    ? `Customers get ${offerPercentage}% off when buying all bundle products`
                    : "Customers get a discount when buying all bundle products"}
                </s-list-item>
                <s-list-item>Active immediately after saving</s-list-item>
              </s-unordered-list>
            </s-section>
          </s-card>
        </s-stack>
      </s-grid>

      <s-box paddingBlockStart="large">
        <s-button variant="primary" onClick={saveOffer}>
          {isEditing ? "Update Offer" : "Save Offer"}
        </s-button>
      </s-box>
    </s-page>
  );
};

export default FixedBundle;
