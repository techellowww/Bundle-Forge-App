import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useNavigate, useRouteError } from "react-router";
import { Button } from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const navigate = useNavigate();

  return (
    <s-page heading="Bundle Forge">
      <s-section heading="Welcome 👋">
        <s-paragraph>
          Create quantity break discounts to reward customers who buy more. Set
          up tiers like "Buy 3, get 10% off" or "Buy 5, get 20% off".
        </s-paragraph>
        <Button
          variant="primary"
          onClick={() => navigate("/app/quantityBreak")}
        >
          Create New Discount
        </Button>
      </s-section>

      <s-section heading="Manage Discounts">
        <s-paragraph>
          View and manage all your existing quantity break discounts.
        </s-paragraph>
        <Button onClick={() => navigate("/app/quantity-breaks")}>
          View All Discounts
        </Button>
      </s-section>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
