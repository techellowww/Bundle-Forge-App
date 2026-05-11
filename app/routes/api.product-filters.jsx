import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`
      query {
        shop {
          name
        }
        productTypes(first: 10) {
          edges { node }
        }
        products(first: 50) {
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

    if (json.errors) {
      return Response.json({ error: json.errors, types: [], vendors: [] });
    }

    const products = json?.data?.products?.edges?.map((e) => e.node) || [];
    const types = [
      ...new Set(products.map((p) => p.productType).filter(Boolean)),
    ];
    const vendors = [...new Set(products.map((p) => p.vendor).filter(Boolean))];

    return Response.json({ types, vendors });
  } catch (err) {
    return Response.json({ error: err.message, types: [], vendors: [] });
  }
}
