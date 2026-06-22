import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from "../generated/api";

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass) {
    return { operations: [] };
  }

  // Read FBT config from metafield (set by your app when saving the offer)
  let config = {};
  try {
    const raw = input.discount.metafield?.value;
    if (raw) config = JSON.parse(raw);
  } catch {
    return { operations: [] };
  }

  const {
    discountType,
    discountValue,
    discountTitle = "Frequently Bought Together",
    bundledProductIds = [],
  } = config;

  if (!discountType || !bundledProductIds.length) {
    return { operations: [] };
  }

  // Find cart lines that match bundled product IDs
  const fbtLines = input.cart.lines.filter((line) => {
    const productGid = line.merchandise?.product?.id ?? "";
    const numericId = productGid.split("/").pop();
    return bundledProductIds.includes(numericId);
  });

  if (!fbtLines.length) {
    return { operations: [] };
  }

  // ── Free = 100% off cheapest bundled item only ──
  if (discountType === "free") {
    const cheapestLine = fbtLines.reduce(
      (min, line) =>
        line.cost.subtotalAmount.amount < min.cost.subtotalAmount.amount
          ? line
          : min,
      fbtLines[0],
    );

    return {
      operations: [
        {
          productDiscountsAdd: {
            candidates: [
              {
                message: discountTitle,
                targets: [{ cartLine: { id: cheapestLine.id } }],
                value: { percentage: { value: 100 } },
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        },
      ],
    };
  }

  // ── Percentage off all bundled lines ──
  if (discountType === "percentage") {
    return {
      operations: [
        {
          productDiscountsAdd: {
            candidates: [
              {
                message: discountTitle,
                targets: fbtLines.map((line) => ({
                  cartLine: { id: line.id },
                })),
                value: {
                  percentage: {
                    value: Number(discountValue),
                  },
                },
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        },
      ],
    };
  }

  // ── Fixed amount off all bundled lines ──
  if (discountType === "amount") {
    return {
      operations: [
        {
          productDiscountsAdd: {
            candidates: [
              {
                message: discountTitle,
                targets: fbtLines.map((line) => ({
                  cartLine: { id: line.id },
                })),
                value: {
                  fixedAmount: {
                    amount: Number(discountValue),
                    appliesToEachItem: true,
                  },
                },
              },
            ],
            selectionStrategy: ProductDiscountSelectionStrategy.First,
          },
        },
      ],
    };
  }

  return { operations: [] };
}
