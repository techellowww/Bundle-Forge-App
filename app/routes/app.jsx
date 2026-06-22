import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        {/* <s-link href="/app/additional">Additional page</s-link> */}
        <s-link href="/app/quantityBreak">Quantity Break</s-link>
        {/* <s-link href="/app/quantity-breaks">Quantity Break List</s-link> */}
        <s-link href="/app/buyXgetY">Buy-X Get-Y</s-link>
        {/* <s-link href="/app/bxgy-list">Buy-X Get-Y List</s-link> */}
        <s-link href="/app/fbt">FBT & Upsell</s-link>
        {/* <s-link href="/app/fbt-list">FBT List</s-link> */}
        <s-link href="/app/fixed-bundle">Fixed Bundle</s-link>
        {/* <s-link href="/app/fixed-bundles">Fixed Bundle List</s-link> */}
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
