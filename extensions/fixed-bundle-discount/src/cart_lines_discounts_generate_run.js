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

  const { offerPercentage, productIds, minQuantity } = config;
  console.error("Loaded offer configuration: " + JSON.stringify({ offerPercentage, productIds, minQuantity }));
  console.error("Checkbox enabled/disabled state: " + (minQuantity != null ? "enabled" : "disabled"));
  console.error("minQuantity value: " + String(minQuantity));
  
  if (!offerPercentage || !productIds?.length) return { operations: [] };

  // Count required quantities for each product in the bundle
  const requiredQtys = {};
  for (const id of productIds) {
    requiredQtys[id] = (requiredQtys[id] || 0) + 1;
  }

  // Count quantities present in the cart for each required product
  const cartQtys = {};
  for (const id of Object.keys(requiredQtys)) {
    cartQtys[id] = 0;
  }

  input.cart.lines.forEach((line) => {
    const productId = line.merchandise?.product?.id;
    if (productId && requiredQtys[productId]) {
      cartQtys[productId] += line.quantity;
    }
  });

  console.error("Cart quantities for each bundle product: " + JSON.stringify(cartQtys));

  // Validate minimum quantity condition if it's checked
  const minQty = parseInt(minQuantity, 10);
  if (!isNaN(minQty) && minQty > 0) {
    let isEligible = true;
    for (const id of Object.keys(requiredQtys)) {
      if (cartQtys[id] !== minQty) {
        console.error("Eligibility result: failed for product " + id + " (qty " + cartQtys[id] + " !== " + minQty + ")");
        isEligible = false;
        break;
      }
    }
    
    if (!isEligible) {
      return { operations: [] };
    }
    console.error("Eligibility result: passed");
  } else {
    console.error("Eligibility result: skipped (minQuantity not enabled)");
  }

  // Calculate the number of complete bundles
  let bundleCount = Infinity;
  for (const id of Object.keys(requiredQtys)) {
    const bundlesPossible = Math.floor(cartQtys[id] / requiredQtys[id]);
    if (bundlesPossible < bundleCount) {
      bundleCount = bundlesPossible;
    }
  }

  if (bundleCount === 0 || bundleCount === Infinity) {
    console.error("Bundle count: " + bundleCount);
    return { operations: [] };
  }

  console.error("Bundle count: " + bundleCount);

  // Generate targets applying the discount only to the required quantities for the complete bundles
  const targets = [];
  
  // Track how many items we still need to discount for each product
  const remainingDiscountQty = {};
  for (const id of Object.keys(requiredQtys)) {
    remainingDiscountQty[id] = requiredQtys[id] * bundleCount;
  }

  // Distribute the discount quantity across cart lines
  for (const line of input.cart.lines) {
    const productId = line.merchandise?.product?.id;
    if (productId && remainingDiscountQty[productId] > 0) {
      const discountQty = Math.min(line.quantity, remainingDiscountQty[productId]);
      targets.push({
        cartLine: {
          id: line.id,
          quantity: discountQty
        }
      });
      remainingDiscountQty[productId] -= discountQty;
    }
  }

  if (!targets.length) {
    console.error("Generated discount targets: []");
    return { operations: [] };
  }

  console.error("Generated discount targets: " + JSON.stringify(targets));

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
