const UpsellManualRandom = ({
  randomCount,
  setRandomCount,
  randomSourceType,
  setRandomSourceType,
  randomSourceValue,
  setRandomSourceValue,
}) => {
  return (
    <s-stack direction="block" gap="base">
      <s-grid
        padding="base"
        background="subdued"
        border="base"
        borderRadius="base"
        gridTemplateColumns="1fr 1fr"
        gap="small"
      >
        <s-text-field
          label="Number of upsell products"
          type="number"
          min="1"
          max="10"
          placeholder="3"
          value={String(randomCount)}
          onChange={(e) => setRandomCount(e.target.value)}
        />

        <s-select
          label="Pick products from"
          value={randomSourceType}
          onChange={(e) => {
            setRandomSourceType(e.target.value);
            setRandomSourceValue("");
          }}
        >
          <s-option value="selectedType">Selected type only</s-option>
          <s-option value="selectedVendor">Selected vendor only</s-option>
          <s-option value="selectedCollection">
            Selected collection only
          </s-option>
        </s-select>
      </s-grid>

      {randomSourceType === "selectedType" && (
        <s-text-field
          label="Product type"
          placeholder="e.g. T-Shirt"
          value={randomSourceValue}
          onChange={(e) => setRandomSourceValue(e.target.value)}
        />
      )}

      {randomSourceType === "selectedVendor" && (
        <s-text-field
          label="Vendor name"
          placeholder="e.g. Nike"
          value={randomSourceValue}
          onChange={(e) => setRandomSourceValue(e.target.value)}
        />
      )}

      {randomSourceType === "selectedCollection" && (
        <s-text-field
          label="Collection title"
          placeholder="e.g. Summer Sale"
          value={randomSourceValue}
          onChange={(e) => setRandomSourceValue(e.target.value)}
        />
      )}
    </s-stack>
  );
};

export default UpsellManualRandom;
