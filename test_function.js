const config = {
  offerPercentage: 20,
  minQuantity: null,
  productIds: ["gid://shopify/Product/Tshirt", "gid://shopify/Product/Shoe"]
};

const input = {
  cart: {
    lines: [
      { id: "line1", quantity: 1, merchandise: { product: { id: "gid://shopify/Product/Tshirt" } } },
      { id: "line2", quantity: 1, merchandise: { product: { id: "gid://shopify/Product/Shoe" } } },
      { id: "line3", quantity: 3, merchandise: { product: { id: "gid://shopify/Product/Shirt" } } },
      { id: "line4", quantity: 3, merchandise: { product: { id: "gid://shopify/Product/Pant" } } }
    ]
  }
};

const { offerPercentage, productIds, minQuantity } = config;

const requiredQtys = {};
for (const id of productIds) {
  requiredQtys[id] = (requiredQtys[id] || 0) + 1;
}

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

let isEligible = true;
const minQty = parseInt(minQuantity, 10);
if (!isNaN(minQty) && minQty > 0) {
  for (const id of Object.keys(requiredQtys)) {
    if (cartQtys[id] < minQty) {
      isEligible = false;
      break;
    }
  }
}

if (!isEligible) {
  console.log("Not eligible");
  process.exit(0);
}

let bundleCount = Infinity;
for (const id of Object.keys(requiredQtys)) {
  const bundlesPossible = Math.floor(cartQtys[id] / requiredQtys[id]);
  if (bundlesPossible < bundleCount) {
    bundleCount = bundlesPossible;
  }
}

if (bundleCount === 0 || bundleCount === Infinity) {
  console.log("Bundle count is 0 or Infinity");
  process.exit(0);
}

const remainingDiscountQty = {};
for (const id of Object.keys(requiredQtys)) {
  remainingDiscountQty[id] = requiredQtys[id] * bundleCount;
}

const targets = [];
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

console.log(JSON.stringify(targets, null, 2));
