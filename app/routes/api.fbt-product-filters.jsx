import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query getProductFilters {
      products(first: 250) {
        edges {
          node {
            vendor
            productType
          }
        }
      }
    }
  `);

  const json = await response.json();
  const products = json.data?.products?.edges?.map((e) => e.node) ?? [];

  const vendors = [
    ...new Set(products.map((p) => p.vendor).filter(Boolean)),
  ].sort();
  const types = [
    ...new Set(products.map((p) => p.productType).filter(Boolean)),
  ].sort();

  return Response.json({ vendors, types });
}
