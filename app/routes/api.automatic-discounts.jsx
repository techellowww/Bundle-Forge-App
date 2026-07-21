import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useRouteError } from "react-router";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const productGid = url.searchParams.get("productGid");
  // e.g. "gid://shopify/Product/123456"

  const FETCH_AUTOMATIC_DISCOUNTS = `
    query getAutomaticDiscounts {
      automaticDiscountNodes(first: 50) {
        edges {
          node {
            id
            automaticDiscount {
              ... on DiscountAutomaticBasic {
                title
                status
                startsAt
                endsAt
                summary
                minimumRequirement {
                  ... on DiscountMinimumQuantity {
                    greaterThanOrEqualToQuantity
                  }
                  ... on DiscountMinimumSubtotal {
                    greaterThanOrEqualToSubtotal {
                      amount
                      currencyCode
                    }
                  }
                }
                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }
                    }
                  }
                  items {
                    ... on AllDiscountItems {
                      allItems
                    }
                    ... on DiscountProducts {
                      products(first: 10) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                    }
                    ... on DiscountCollections {
                      collections(first: 10) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                    }
                  }
                }
              }
              ... on DiscountAutomaticBxgy {
                title
                status
                startsAt
                endsAt
                summary
              }
              ... on DiscountAutomaticApp {
                title
                status
                startsAt
                endsAt
              }
              ... on DiscountAutomaticFreeShipping {
                title
                status
                startsAt
                endsAt
                summary
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await admin.graphql(FETCH_AUTOMATIC_DISCOUNTS);
    const data = await res.json();

    const allNodes = data?.data?.automaticDiscountNodes?.edges || [];

    // Filter only ACTIVE discounts
    const activeDiscounts = allNodes
      .map((e) => e.node)
      .filter((node) => node.automaticDiscount?.status === "ACTIVE")
      .map((node) => {
        const d = node.automaticDiscount;

        // Check if this discount applies to this product
        let appliesToProduct = false;
        const items = d?.customerGets?.items;

        if (items?.allItems === true) {
          appliesToProduct = true;
        } else if (items?.products?.edges?.length > 0 && productGid) {
          appliesToProduct = items.products.edges.some(
            (e) => e.node.id === productGid,
          );
        } else if (!items) {
          // DiscountAutomaticBxgy, App, FreeShipping — show for all products
          appliesToProduct = true;
        }

        return {
          id: node.id,
          title: d.title,
          status: d.status,
          summary: d.summary || null,
          startsAt: d.startsAt,
          endsAt: d.endsAt,
          appliesToProduct,
          discountValue: d?.customerGets?.value?.percentage
            ? { type: "percentage", value: d.customerGets.value.percentage * 100 }
            : d?.customerGets?.value?.amount
              ? {
                  type: "amount",
                  value: d.customerGets.value.amount.amount,
                  currency: d.customerGets.value.amount.currencyCode,
                }
              : null,
        };
      })
      .filter((d) => d.appliesToProduct);

    return Response.json({ discounts: activeDiscounts });
  } catch (err) {
    console.error("Failed to fetch automatic discounts:", err);
    return Response.json({ discounts: [], error: err.message }, { status: 500 });
  }
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
