import { cartLinesDiscountsGenerateRun } from "./extensions/fixed-bundle-discount/src/cart_lines_discounts_generate_run.js";

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
