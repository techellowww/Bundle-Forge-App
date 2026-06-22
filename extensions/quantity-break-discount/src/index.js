import { ProductDiscountSelectionStrategy } from "../generated/api";

export function cartLinesDiscountsGenerateRun(input) {
  const config = input.discount?.metafield?.jsonValue;

  if (config?.status === "inactive") {
    return { operations: [] };
  }

  if (config?.endDate && new Date(config.endDate).getTime() < Date.now()) {
    return { operations: [] };
  }

  if (!config?.tiers?.length || !input.cart?.lines?.length) {
    return { operations: [] };
  }

  const {
    applyTo = "allProducts",
    productIds = [],
    excludedProductIds = [],
    vendors = [],
    productTypes = [],
    collectionIds = [],
    tiers = [],
  } = config;

  const sortedTiers = [...tiers].sort(
    (a, b) => Number(b.quantity) - Number(a.quantity),
  );
  const candidates = [];

  for (const line of input.cart.lines) {
    const product = line.merchandise?.product;
    const productId = product?.id;
    const productVendor = product?.vendor ?? "";
    const productType = product?.productType ?? "";
    const productCollectionIds = (product?.collections?.edges ?? []).map(
      (e) => e.node.id,
    );

    let shouldApply = true;

    if (applyTo === "selectedProducts") {
      shouldApply = productIds.includes(productId);
    } else if (applyTo === "excludeProducts") {
      shouldApply = !excludedProductIds.includes(productId);
    } else if (applyTo === "productsInSelectedVendorTypeCollection") {
      const matchesVendor =
        vendors.length > 0 && vendors.includes(productVendor);
      const matchesType =
        productTypes.length > 0 && productTypes.includes(productType);
      const matchesCollection =
        collectionIds.length > 0 &&
        productCollectionIds.some((cid) => collectionIds.includes(cid));
      shouldApply = matchesVendor || matchesType || matchesCollection;
    } else if (applyTo === "exceptSelectedVendorTypeCollection") {
      const matchesVendor =
        vendors.length > 0 && vendors.includes(productVendor);
      const matchesType =
        productTypes.length > 0 && productTypes.includes(productType);
      const matchesCollection =
        collectionIds.length > 0 &&
        productCollectionIds.some((cid) => collectionIds.includes(cid));
      shouldApply = !(matchesVendor || matchesType || matchesCollection);
    }

    if (!shouldApply) continue;

    const matchedTier = sortedTiers.find(
      (tier) => Number(line.quantity) >= Number(tier.quantity),
    );

    if (!matchedTier) continue;

    const discountType = matchedTier.discountType || "percentage";
    const value = Number(matchedTier.value);
    let discountValue;
    let message;

    if (discountType === "percentage") {
      discountValue = { percentage: { value } };
      message = `${value}% OFF`;
    } else if (discountType === "amount") {
      discountValue = {
        fixedAmount: { amount: String(value), appliesToEachItem: true },
      };
      message = `${value} OFF`;
    } else if (discountType === "fixedPrice") {
      const originalPrice = Number(line.merchandise?.price?.amount ?? 0);
      const amountOff = Math.max(0, originalPrice - value);
      discountValue = {
        fixedAmount: { amount: String(amountOff), appliesToEachItem: true },
      };
      message = `Fixed price`;
    } else {
      continue;
    }

    candidates.push({
      message,
      targets: [{ cartLine: { id: line.id } }],
      value: discountValue,
    });
  }

  return {
    operations: candidates.length
      ? [
          {
            productDiscountsAdd: {
              candidates,
              selectionStrategy: ProductDiscountSelectionStrategy.First,
            },
          },
        ]
      : [],
  };
}
