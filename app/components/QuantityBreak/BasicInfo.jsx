const BasicInfo = ({
  title,
  setTitle,
  discountTitle,
  setDiscountTitle,
  discountDescription,
  setDiscountDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  return (
    <s-section>
      <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack gap="large">
          <s-heading>Basic information</s-heading>

          <s-text-field
            label="Offer Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <s-paragraph>
            For internal purpose only, not display to customers.
          </s-paragraph>
          <s-heading>Display on widget</s-heading>
          <s-text-field
            label="Discount Title"
            value={discountTitle}
            onChange={(e) => setDiscountTitle(e.target.value)}
          />
          <s-text-field
            label="Discount description"
            value={discountDescription}
            onChange={(e) => setDiscountDescription(e.target.value)}
          />
          <s-grid gridTemplateColumns="1fr 1fr" gap="small">
            <s-date-field
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <s-date-field
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </s-grid>
        </s-stack>
      </s-box>
    </s-section>
  );
};

export default BasicInfo;
