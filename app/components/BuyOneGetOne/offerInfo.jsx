const OfferInfo = ({
  title,
  setTitle,
  discountTitle,
  setDiscountTitle,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  return (
    <s-section>
      <s-card padding="large">
        <s-stack direction="block" gap="large">
          <s-box borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-heading>Buy X get Y</s-heading>

              <s-text-field
                label="Offer name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="BXGY Buy X get Y"
              />
              <s-text-field
                label="Offer title"
                value={discountTitle}
                onChange={(e) => setDiscountTitle(e.target.value)}
                placeholder="BXGY (Buy X get Y)"
              />

              <s-grid
                padding="base"
                background="subdued"
                border="base"
                borderRadius="base"
                gridTemplateColumns="1fr 1fr"
                gap="small"
              >
                <s-date-field
                  label="Start Date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(e?.target?.value ?? e?.detail?.value ?? e)
                  }
                />
                <s-date-field
                  label="End Date"
                  value={endDate}
                  onChange={(e) =>
                    setEndDate(e?.target?.value ?? e?.detail?.value ?? e)
                  }
                />
              </s-grid>
            </s-stack>
          </s-box>
        </s-stack>
      </s-card>
    </s-section>
  );
};

export default OfferInfo;
