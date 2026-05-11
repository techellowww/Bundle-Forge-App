import { authenticate } from "../shopify.server.js";

const FUNCTION_ID = process.env.SHOPIFY_FUNCTION_ID;

export const createFunctionDiscount = async (shop, bundle) => {
  const { admin } = await authenticate.admin({ shop });

  const response = await admin.graphql(
    `
    mutation CreateDiscount(
      $title: String!,
      $functionId: String!,
      $startsAt: DateTime!
    ) {
      discountAutomaticAppCreate(
        automaticAppDiscount: {
          title: $title
          functionId: $functionId
          startsAt: $startsAt
        }
      ) {
        automaticAppDiscount {
          id
        }
        userErrors {
          message
        }
      }
    }
    `,
    {
      variables: {
        title: bundle.title,
        functionId: FUNCTION_ID,
        startsAt: new Date().toISOString(),
      },
    },
  );

  const json = await response.json();

  const errors = json.data.discountAutomaticAppCreate.userErrors;
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return json.data.discountAutomaticAppCreate.automaticAppDiscount.id;
};

export const updateFunctionDiscount = async (shop, bundle) => {
  const { admin } = await authenticate.admin({ shop });

  const response = await admin.graphql(
    `
    mutation UpdateDiscount(
      $id: ID!,
      $title: String!
    ) {
      discountAutomaticAppUpdate(
        id: $id,
        automaticAppDiscount: {
          title: $title
        }
      ) {
        automaticAppDiscount {
          id
        }
        userErrors {
          message
        }
      }
    }
    `,
    {
      variables: {
        id: bundle.functionId,
        title: bundle.title,
      },
    },
  );

  const json = await response.json();

  const errors = json.data.discountAutomaticAppUpdate.userErrors;
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return json.data.discountAutomaticAppUpdate.automaticAppDiscount.id;
};

export const deleteFunctionDiscount = async (shop, discountId) => {
  const { admin } = await authenticate.admin({ shop });

  const response = await admin.graphql(
    `
    mutation DeleteDiscount($id: ID!) {
      discountAutomaticAppDelete(id: $id) {
        deletedAutomaticAppDiscountId
        userErrors {
          message
        }
      }
    }
    `,
    {
      variables: {
        id: discountId,
      },
    },
  );

  const json = await response.json();

  const errors = json.data.discountAutomaticAppDelete.userErrors;
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return json.data.discountAutomaticAppDelete.deletedAutomaticAppDiscountId;
};
