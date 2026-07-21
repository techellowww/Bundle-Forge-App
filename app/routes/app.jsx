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
      <ui-nav-menu>
        <a href="/app">Home</a>
        {/* <a href="/app/additional">Additional page</a> */}
        {/* <a href="/app/quantityBreak">Quantity Break</a> */}
        <a href="/app/allOffers">All offers</a>
        <a href="/app/helpSupport">Help Support</a>
        {/* <a href="/app/quantity-breaks">Quantity Break List</a> */}
        {/* <a href="/app/buyXgetY">Buy-X Get-Y</a> */}
        {/* <a href="/app/bxgy-list">Buy-X Get-Y List</a> */}
        {/* <a href="/app/fbt">FBT & Upsell</a> */}
        {/* <a href="/app/fbt-list">FBT List</a> */}
        {/* <a href="/app/fixed-bundle">Fixed Bundle</a> */}
        {/* <a href="/app/fixed-bundles">Fixed Bundle List</a> */}
      </ui-nav-menu>
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
