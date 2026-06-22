import { ProductDiscountSelectionStrategy } from "../generated/api";

export function cartLinesDiscountsGenerateRun(input) {
  const config = input.discount?.metafield?.jsonValue;

  if (config?.status === "inactive") {
    return { operations: [] };
  }

  if (config?.endDate && new Date(config.endDate).getTime() < Date.now()) {
    return { operations: [] };
  }

  if (!config || !input.cart?.lines?.length) {
    return { operations: [] };
  }

  const {
    applyTo = "allProducts",
    productIds = [],
    excludedProductIds = [],
    vendors = [],
    productTypes = [],
    collectionIds = [],
    requiredQuantity = 1,
    giftMode = "PRODUCT_GIFT",
    productGift = null,
  } = config;

  if (giftMode !== "PRODUCT_GIFT" || !productGift) {
    return { operations: [] };
  }

  const lines = input.cart.lines;

  // ── Step 1: Count qualifying quantity ───────────────────────────────────────
  let qualifyingQty = 0;

  for (const line of lines) {
    const product = line.merchandise?.product;
    if (!product) continue;

    const pid = product.id;
    const vendor = product.vendor ?? "";
    const type = product.productType ?? "";

    // Check collection membership via line.merchandise.product.inAnyCollection
    // (requires querying collections in your run.graphql — see note below)
    const inCollection = collectionIds.some((cid) =>
      product.collections?.edges?.some((e) => e.node.id === cid),
    );

    let qualifies = false;

    if (applyTo === "allProducts") {
      qualifies = true;
    } else if (applyTo === "selectedProducts") {
      qualifies = productIds.includes(pid);
    } else if (applyTo === "excludeProducts") {
      qualifies = !excludedProductIds.includes(pid);
    } else if (applyTo === "productsInSelectedVendorTypeCollection") {
      qualifies =
        vendors.includes(vendor) || productTypes.includes(type) || inCollection;
    } else if (applyTo === "exceptSelectedVendorTypeCollection") {
      qualifies = !(
        vendors.includes(vendor) ||
        productTypes.includes(type) ||
        inCollection
      );
    }

    if (qualifies) {
      qualifyingQty += Number(line.quantity);
    }
  }

  if (qualifyingQty < Number(requiredQuantity)) {
    return { operations: [] };
  }

  // ── Step 2: Build discount candidates for gift products ───────────────────
  const {
    discountType,
    discountValue,
    giftQuantity = 1,
    giftProducts = [],
  } = productGift;

  // giftProducts already have full GIDs from buildShopifyConfig
  const giftProductGids = giftProducts.map((p) => p.productId);

  const candidates = [];

  for (const line of lines) {
    const productId = line.merchandise?.product?.id;
    if (!giftProductGids.includes(productId)) continue;

    const applyQty = Math.min(Number(line.quantity), Number(giftQuantity));
    if (applyQty <= 0) continue;

    let value;
    let message;

    if (discountType === "free") {
      // "free" = 100% off
      value = { percentage: { value: "100" } };
      message = "Free gift";
    } else if (discountType === "percentage") {
      // "percentage" = N% off
      value = { percentage: { value: String(Number(discountValue)) } };
      message = `${discountValue}% off`;
    } else if (discountType === "fixedPrice") {
      // "fixedPrice" = the gift costs exactly this price
      // Shopify Functions use fixedAmount as amount-off, not final price.
      // So we store the target price and subtract from line unit price at runtime.
      const unitPrice = parseFloat(line.cost?.amountPerQuantity?.amount ?? "0");
      const targetPrice = Number(discountValue);
      const amountOff = Math.max(0, unitPrice - targetPrice).toFixed(2);

      if (parseFloat(amountOff) <= 0) continue; // already at or below target price

      value = {
        fixedAmount: {
          amount: amountOff,
          appliesToEachItem: true,
        },
      };
      message = `Gift at fixed price`;
    } else {
      continue; // unknown discountType — skip
    }

    candidates.push({
      message,
      targets: [{ cartLine: { id: line.id, quantity: applyQty } }],
      value,
    });
  }

  if (!candidates.length) return { operations: [] };

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}
