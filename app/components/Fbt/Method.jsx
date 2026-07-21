import UpsellManualMethod from "./UpsellManualMethod";
import UpsellManualRandom from "./UpsellManualRandom";

const Method = ({
  selectedGiftMode,
  setSelectedGiftMode,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  bundledProducts,
  setBundledProducts,
  randomCount,
  setRandomCount,
  randomSourceType,
  setRandomSourceType,
  randomSourceValue,
  setRandomSourceValue,
}) => {
  return (
    <s-section>
      <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack direction="block" gap="base">
          <s-heading>Bundled products</s-heading>

          <s-stack direction="inline" gap="small">
            <s-button
              variant={selectedGiftMode === "manual" ? "primary" : "secondary"}
              onClick={() => setSelectedGiftMode("manual")}
            >
              Manual
            </s-button>
            <s-button
              variant={selectedGiftMode === "random" ? "primary" : "secondary"}
              onClick={() => setSelectedGiftMode("random")}
            >
              Random
            </s-button>
          </s-stack>

          {selectedGiftMode === "manual" && (
            <UpsellManualMethod
              bundledProducts={bundledProducts}
              setBundledProducts={setBundledProducts}
            />
          )}

          {selectedGiftMode === "random" && (
            <UpsellManualRandom
              randomCount={randomCount}
              setRandomCount={setRandomCount}
              randomSourceType={randomSourceType}
              setRandomSourceType={setRandomSourceType}
              randomSourceValue={randomSourceValue}
              setRandomSourceValue={setRandomSourceValue}
            />
          )}
        </s-stack>
      </s-box>
    </s-section>
  );
};

export default Method;
