// import {
//   DeliveryDiscountSelectionStrategy,
//   DiscountClass,
// } from "../generated/api";

// /**
//   * @typedef {import("../generated/api").DeliveryInput} RunInput
//   * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
//   */

// /**
//   * @param {RunInput} input
//   * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
//   */

// export function cartDeliveryOptionsDiscountsGenerateRun(input) {
//   const firstDeliveryGroup = input.cart.deliveryGroups[0];
//   if (!firstDeliveryGroup) {
//     return {operations: []};
//   }

//   const hasShippingDiscountClass = input.discount.discountClasses.includes(
//     DiscountClass.Shipping,
//   );

//   if (!hasShippingDiscountClass) {
//     return {operations: []};
//   }

//   return {
//     operations: [
//       {
//         deliveryDiscountsAdd: {
//           candidates: [
//             {
//               message: "FREE DELIVERY",
//               targets: [
//                 {
//                   deliveryGroup: {
//                     id: firstDeliveryGroup.id,
//                   },
//                 },
//               ],
//               value: {
//                 percentage: {
//                   value: 100,
//                 },
//               },
//             },
//           ],
//           selectionStrategy: DeliveryDiscountSelectionStrategy.All,
//         },
//       },
//     ],
//   };
// }

import { DeliveryDiscountSelectionStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").DeliveryInput} RunInput
 * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const config = input.discount?.metafield?.jsonValue;

  if (!config) return { operations: [] };

  const {
    applyTo = "allProducts",
    productIds = [],
    excludedProductIds = [],
    vendors = [],
    productTypes = [],
    collectionIds = [],
    requiredQuantity = 1,
    giftMode = "PRODUCT_GIFT",
    shippingGift = null,
  } = config;

  // Only handle SHIPPING_DISCOUNT here
  if (giftMode !== "SHIPPING_DISCOUNT" || !shippingGift) {
    return { operations: [] };
  }

  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) return { operations: [] };

  const { discountType, discountValue, enableFreeShipping, freeShippingLabel } =
    shippingGift;

  let discountVal;
  let message;

  if (enableFreeShipping) {
    discountVal = { percentage: { value: 100 } };
    message = freeShippingLabel || "Free Shipping";
  } else if (discountType === "percentage") {
    discountVal = { percentage: { value: Number(discountValue) } };
    message = `${discountValue}% OFF Shipping`;
  } else if (discountType === "fixed") {
    discountVal = {
      fixedAmount: { amount: String(discountValue) },
    };
    message = `${discountValue} OFF Shipping`;
  } else {
    return { operations: [] };
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message,
              targets: [
                {
                  deliveryGroup: {
                    id: firstDeliveryGroup.id,
                  },
                },
              ],
              value: discountVal,
            },
          ],
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}
