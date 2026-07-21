import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <AppProvider embedded={false}>
      <s-page>
        <div style={{ maxWidth: '400px', margin: '40px auto' }}>
          <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
            <s-stack direction="block" gap="large">
              <s-text variant="headingMd" as="h1">Log in</s-text>
              <Form method="post">
                <s-stack direction="block" gap="base">
                  <s-text-field
                    label="Shop domain"
                    name="shop"
                    type="text"
                    autoComplete="on"
                    value={shop}
                    onInput={(e) => setShop(e.target.value)}
                    error={errors?.shop}
                  />
                  <s-button submit primary>Log in</s-button>
                </s-stack>
              </Form>
            </s-stack>
          </s-box>
        </div>
      </s-page>
    </AppProvider>
  );
}
