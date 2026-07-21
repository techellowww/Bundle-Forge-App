const Discount = ({
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
}) => {
  return (
    <s-section>
      <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack direction="block" gap="large">
          <s-heading>Discount</s-heading>
          <s-grid
            padding="base"
            background="subdued"
            border="base"
            borderRadius="base"
            gridTemplateColumns="1fr 1fr"
            gap="small"
          >
            <s-select
              label="Discount type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
            >
              <s-option value="percentage">Percentage</s-option>
              <s-option value="amount">Amount</s-option>
              <s-option value="free">Cheapest item free</s-option>
            </s-select>

            {discountType !== "free" && (
              <s-text-field
                label={
                  discountType === "percentage" ? "Discount %" : "Amount off"
                }
                type="number"
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                placeholder={discountType === "percentage" ? "10" : "5.00"}
                value={String(discountValue ?? "")}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            )}
          </s-grid>
        </s-stack>
      </s-box>
    </s-section>
  );
};

export default Discount;
