const QuantityBreakTier = ({ tiers, setTiers }) => {
  const addTier = () => {
    setTiers([
      ...tiers,
      {
        tierTitle: "",
        quantity: "",
        discountType: "percentage",
        value: "",
        subTitleEnabled: false,
        subTitleText: "",
        labelEnabled: false,
        labelText: "",
        tagEnabled: false,
        tagText: "",
        preSelect: false,
      },
    ]);
  };

  const removeTier = (index) => {
    const updated = tiers.filter((_, i) => i !== index);
    setTiers(updated);
  };

  const updateTier = (index, field, value) => {
    const updated = [...tiers];
    if (field === "quantity" || field === "value") {
      updated[index][field] = value === "" ? "" : Number(value);
    } else {
      updated[index][field] = value;
    }
    setTiers(updated);
  };

  return (
    <s-section>
      <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack gap="large">
          <s-heading>Quantity Breaks</s-heading>

          {tiers?.map((tier, index) => (
            <s-box background="surface" borderRadius="300" shadow="100"
              key={index}
              padding="medium"
              border="base"
              borderRadius="base"
            >
              <s-heading gap="medium">Quantity Tier {index + 1}</s-heading>
              <s-text-field
                label="Tier Title"
                placeholder="New Tier"
                value={tier.tierTitle}
                onChange={(e) => updateTier(index, "tierTitle", e.target.value)}
              />
              <s-stack gap="large">
                <s-grid
                  gridTemplateColumns="1fr 1fr 1fr auto"
                  gap="large"
                  alignItems="end"
                >
                  <s-text-field
                    label="Minimum Quantity"
                    type="number"
                    value={tier.quantity}
                    onChange={(e) =>
                      updateTier(index, "quantity", e.target.value)
                    }
                  />

                  <s-select
                    label="Discount Type"
                    value={tier.discountType}
                    onChange={(e) =>
                      updateTier(index, "discountType", e.target.value)
                    }
                  >
                    <s-option value="percentage">Percentage</s-option>
                    <s-option value="amount">Amount Off</s-option>
                    <s-option value="fixedPrice">Fixed Price</s-option>
                  </s-select>

                  {tier.discountType === "percentage" && (
                    <s-text-field
                      label="Discount %"
                      type="number"
                      suffix="%"
                      value={tier.value}
                      onChange={(e) =>
                        updateTier(index, "value", e.target.value)
                      }
                    />
                  )}

                  {tier.discountType === "amount" && (
                    <s-money-field
                      label="Amount Off"
                      value={tier.value}
                      onChange={(e) =>
                        updateTier(index, "value", e.target.value)
                      }
                    />
                  )}

                  {tier.discountType === "fixedPrice" && (
                    <s-money-field
                      label="Fixed Price"
                      value={tier.value}
                      onChange={(e) =>
                        updateTier(index, "value", e.target.value)
                      }
                    />
                  )}
                </s-grid>

                <s-section>
                  <s-heading size="small">Schedule</s-heading>
                  <s-stack gap="small">
                    <s-grid gridTemplateColumns="0.5fr 1fr" gap="small">
                      <s-checkbox
                        label="Sub Title"
                        checked={tier.subTitleEnabled}
                        onChange={(e) =>
                          updateTier(index, "subTitleEnabled", e.target.checked)
                        }
                      />
                      {tier.subTitleEnabled && (
                        <s-text-field
                          placeholder="Buy More Save More"
                          value={tier.subTitleText}
                          onChange={(e) =>
                            updateTier(index, "subTitleText", e.target.value)
                          }
                        />
                      )}
                    </s-grid>

                    <s-grid gridTemplateColumns="0.5fr 1fr" gap="small">
                      <s-checkbox
                        label="Label"
                        checked={tier.labelEnabled}
                        onChange={(e) =>
                          updateTier(index, "labelEnabled", e.target.checked)
                        }
                      />
                      {tier.labelEnabled && (
                        <s-text-field
                          placeholder="20% discount"
                          value={tier.labelText}
                          onChange={(e) =>
                            updateTier(index, "labelText", e.target.value)
                          }
                        />
                      )}
                    </s-grid>

                    <s-grid gridTemplateColumns="0.5fr 1fr" gap="small">
                      <s-checkbox
                        label="Tag"
                        checked={tier.tagEnabled}
                        onChange={(e) =>
                          updateTier(index, "tagEnabled", e.target.checked)
                        }
                      />
                      {tier.tagEnabled && (
                        <s-text-field
                          placeholder="Trending"
                          value={tier.tagText}
                          onChange={(e) =>
                            updateTier(index, "tagText", e.target.value)
                          }
                        />
                      )}
                    </s-grid>

                    <s-grid gap="small">
                      <s-checkbox
                        label="Pre-Select"
                        checked={tier.preSelect}
                        onChange={(e) =>
                          updateTier(index, "preSelect", e.target.checked)
                        }
                      />
                    </s-grid>
                  </s-stack>
                </s-section>
                {tiers?.length > 1 && (
                  <s-button
                    variant="plain"
                    tone="critical"
                    onClick={() => removeTier(index)}
                    style={{ justifySelf: "end", marginTop: "24px" }}
                  >
                    Remove
                  </s-button>
                )}
              </s-stack>
            </s-box>
          ))}

          <s-box paddingBlockStart="small">
            <s-button onClick={addTier}>+ Add Tier</s-button>
          </s-box>
        </s-stack>
      </s-box>
    </s-section>
  );
};

export default QuantityBreakTier;
