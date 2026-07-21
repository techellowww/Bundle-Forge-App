function cartLinesDiscountsGenerateRun(input) {
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

  // Validate minimum quantity condition if it's checked
  if (minQuantity) {
    for (const id of Object.keys(requiredQtys)) {
      if (cartQtys[id] < minQuantity) {
        return { operations: [] };
      }
    }
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
    return { operations: [] };
  }

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

  return { operations: targets };
}

const input = {
  cart: {
    lines: [
      {
        id: "gid://shopify/CartLine/1",
        quantity: 2,
        merchandise: {
          product: {
            id: "gid://shopify/Product/1"
          }
        }
      },
      {
        id: "gid://shopify/CartLine/2",
        quantity: 2,
        merchandise: {
          product: {
            id: "gid://shopify/Product/2"
          }
        }
      }
    ]
  },
  discount: {
    metafield: {
      value: JSON.stringify({
        offerPercentage: 20,
        minQuantity: 2,
        productIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
        status: "active"
      })
    }
  }
};

const result = cartLinesDiscountsGenerateRun(input);
console.log(JSON.stringify(result, null, 2));
