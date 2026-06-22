import SelectGifts from "./SelectGifts";
import ShippingDiscount from "./ShippingDiscount";

const GiftSection = ({
  selectedGiftMode,
  setSelectedGiftMode,
  giftDiscountType,
  setGiftDiscountType,
  giftValue,
  setGiftValue,
  giftQuantity,
  setGiftQuantity,
  giftProducts,
  setGiftProducts,
  shippingDiscountType,
  setShippingDiscountType,
  shippingDiscountValue,
  setShippingDiscountValue,
  enableFreeShipping,
  setEnableFreeShipping,
  freeShippingProductName,
  setFreeShippingProductName,
}) => {
  return (
    <s-section>
      <s-card padding="large">
        <s-stack direction="block" gap="base">
          <s-heading>Select gifts</s-heading>

          <s-stack direction="inline" gap="small">
            <s-button
              variant={
                selectedGiftMode === "productGift" ? "primary" : "secondary"
              }
              onClick={() => setSelectedGiftMode("productGift")}
            >
              Product gift
            </s-button>
            <s-button
              variant={
                selectedGiftMode === "shippingDiscount"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setSelectedGiftMode("shippingDiscount")}
            >
              Shipping discount as Gift
            </s-button>
          </s-stack>

          {selectedGiftMode === "productGift" && (
            <SelectGifts
              discountType={giftDiscountType}
              setDiscountType={setGiftDiscountType}
              giftValue={giftValue}
              setGiftValue={setGiftValue}
              giftQuantity={giftQuantity}
              setGiftQuantity={setGiftQuantity}
              giftProducts={giftProducts}
              setGiftProducts={setGiftProducts}
            />
          )}

          {selectedGiftMode === "shippingDiscount" && (
            <ShippingDiscount
              discountType={shippingDiscountType}
              setDiscountType={setShippingDiscountType}
              shippingDiscountValue={shippingDiscountValue}
              setShippingDiscountValue={setShippingDiscountValue}
              enableFreeShipping={enableFreeShipping}
              setEnableFreeShipping={setEnableFreeShipping}
              freeShippingProductName={freeShippingProductName}
              setFreeShippingProductName={setFreeShippingProductName}
            />
          )}
        </s-stack>
      </s-card>
    </s-section>
  );
};

export default GiftSection;
