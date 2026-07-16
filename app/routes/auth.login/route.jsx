import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";
import { Page, Card, TextField, Button, BlockStack } from "@shopify/polaris";

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
      <Page>
        <Card>
          <Form method="post">
            <BlockStack gap="400">
              <TextField
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={(value) => setShop(value)}
                autoComplete="on"
                error={errors.shop}
              />
              <Button submit variant="primary">Log in</Button>
            </BlockStack>
          </Form>
        </Card>
      </Page>
    </AppProvider>
  );
}
