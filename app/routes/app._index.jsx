import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useNavigate, useRouteError, useLoaderData } from "react-router";
import {
  Page,
  Layout,
  Card,
  Button,
  Icon,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Grid,
} from "@shopify/polaris";
import {
  ChatIcon,
  PlayCircleIcon,
  EnvelopeIcon,
  ArrowRightIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";
import CreateOfferModal from "../components/CreateOfferModal";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const shop = await db.shop.findUnique({
    where: { domain: session.shop },
    include: {
      _count: {
        select: {
          bxgyOffers: true,
          fbtOffers: true,
          fixedBundles: true,
          quantityBreakOffers: true,
        },
      },
    },
  });

  if (!shop) {
    return { activeOffers: 0, totalOffers: 0 };
  }

  // Count active offers
  const activeBxgy = await db.bxgyOffer.count({ where: { shopId: shop.id, status: "active" } });
  const activeFbt = await db.frequentlyBoughtOffer.count({ where: { shopId: shop.id, status: "active" } });
  const activeFixed = await db.fixedBundleOffer.count({ where: { shopId: shop.id, status: "active" } });
  const activeQb = await db.quantityBreakOffer.count({ where: { shopId: shop.id, status: "active" } });

  const activeOffers = activeBxgy + activeFbt + activeFixed + activeQb;
  const totalOffers = 
    shop._count.bxgyOffers + 
    shop._count.fbtOffers + 
    shop._count.fixedBundles + 
    shop._count.quantityBreakOffers;

  return { activeOffers, totalOffers };
};

function SupportCard({ icon, title, description, url }) {
  return (
    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6, xl: 6 }}>
      <a 
        href={url} 
        target={url.startsWith("http") ? "_blank" : "_self"} 
        rel="noreferrer" 
        style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
      >
        <Card padding="500">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="300" blockAlign="start">
              {icon && (
                <Box
                  minWidth="32px"
                  paddingBlockStart="050"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Icon source={icon} />
                </Box>
              )}

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  {title}
                </Text>

                <Text as="p" variant="bodySm" tone="subdued">
                  {description}
                </Text>
              </BlockStack>
            </InlineStack>

            <Box
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon source={ArrowRightIcon} tone="subdued" />
            </Box>
          </InlineStack>
        </Card>
      </a>
    </Grid.Cell>
  );
}

function StatCard({ value, label }) {
  return (
    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 3, lg: 6, xl: 6 }}>
      <Card>
        <Box paddingBlock="400">
          <BlockStack align="center" gap="100">
            <Text as="p" variant="heading2xl">
              {value}
            </Text>

            <Text as="p" variant="bodySm" tone="subdued">
              {label}
            </Text>
          </BlockStack>
        </Box>
      </Card>
    </Grid.Cell>
  );
}

export default function Dashboard() {
  const { activeOffers, totalOffers } = useLoaderData();
  const [openModal, setOpenModal] = useState(false);

  const supportItems = [
    {
      icon: ChatIcon,
      title: "Get Live Chat support",
      description:
        "Get support from our highly-skilled support team. We are only a message away!",
      url: "https://your-live-chat-url.com",
    },
    {
      icon: PlayCircleIcon,
      title: "View FAQs",
      description:
        "View our Frequently Asked Questions and learn more about Bundle Forge functionality.",
      url: "https://your-faq-url.com",
    },
    {
      icon: PlayCircleIcon,
      title: "Watch our YouTube series",
      description:
        "Watch all the step-by-step guides for the app in our YouTube series.",
      url: "https://youtube.com/your-channel",
    },
    {
      icon: EnvelopeIcon,
      title: "Contact via email",
      description:
        "Send us an email at support@ellowww.com for further assistance.",
      url: "mailto:support@ellowww.com",
    },
  ];

  return (
    <Page
      title="Bundle Forge"
      subtitle="Create and manage bundle offers to increase AOV"
      primaryAction={{
        content: "Create Offer",
        onAction: () => setOpenModal(true),
      }}
    >
      <BlockStack gap="600">
        <Layout>
          {/* Support */}
          <Layout.Section>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Get support
              </Text>
              <Grid>
                {supportItems.map((item, index) => (
                  <SupportCard key={index} {...item} />
                ))}
              </Grid>
            </BlockStack>
          </Layout.Section>

          {/* Stats */}
          <Layout.Section>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Offer Analytics
              </Text>
              <Grid>
                <StatCard value={activeOffers.toString()} label="Active Offers" />
                <StatCard value={totalOffers.toString()} label="Total Offers" />
              </Grid>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <CreateOfferModal open={openModal} onClose={() => setOpenModal(false)} />
    </Page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
