import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
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
  if (!input.cart.lines.length) return { operations: [] };

  const raw = input.discount.metafield?.value;
  if (!raw) return { operations: [] };

  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    return { operations: [] };
  }

  if (config?.status === "inactive") {
    return { operations: [] };
  }

  if (config?.endDate && new Date(config.endDate).getTime() < Date.now()) {
    return { operations: [] };
  }

  const { offerPercentage, productIds } = config;
  if (!offerPercentage || !productIds?.length) return { operations: [] };

  const cartProductIds = input.cart.lines.map(
    (line) => line.merchandise.product.id,
  );

  const allInCart = productIds.every((id) => cartProductIds.includes(id));
  if (!allInCart) return { operations: [] };

  const targets = input.cart.lines
    .filter((line) => productIds.includes(line.merchandise.product.id))
    .map((line) => ({ cartLine: { id: line.id } }));

  if (!targets.length) return { operations: [] };

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: [
            {
              message: `${offerPercentage}% off bundle`,
              targets,
              value: {
                percentage: { value: parseFloat(offerPercentage) },
              },
            },
          ],
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}
