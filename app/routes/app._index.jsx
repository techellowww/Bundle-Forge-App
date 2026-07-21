import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
<<<<<<< HEAD
import { useRouteError, useLoaderData } from "react-router";
=======
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
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
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

<<<<<<< HEAD
function SupportItem({ iconType, title, description, url }) {
  return (
    <a 
      href={url} 
      target={url.startsWith("http") ? "_blank" : "_self"} 
      rel="noreferrer" 
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <s-box padding="base" background="bg-surface-secondary" borderRadius="base">
        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
          <s-stack direction="inline" gap="base" alignItems="start">
            {iconType && (
              <s-box
                minWidth="32px"
                paddingBlockStart="small-200"
                style={{ display: "flex", justifyContent: "center" }}
              >
                <s-icon type={iconType} />
              </s-box>
            )}

            <s-stack direction="block" gap="small-200">
              <s-text as="h3" variant="headingLg">
                {title}
              </s-text>
              <s-text as="p" variant="bodyLg" tone="subdued" style={{ fontSize: '1.1rem', lineHeight: '1.5' }}>
                {description}
              </s-text>
            </s-stack>
          </s-stack>
          <s-box style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <s-icon type="arrow-right" tone="subdued" />
          </s-box>
        </s-stack>
      </s-box>
    </a>
=======
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
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
  );
}

function StatItem({ value, label }) {
  return (
<<<<<<< HEAD
    <s-box padding="large" background="bg-surface-secondary" borderRadius="base" style={{ flex: 1, textAlign: "center" }}>
      <s-stack direction="block" alignItems="center" gap="small-200">
        <s-text as="p" variant="heading3xl" style={{ fontSize: '3.5rem', fontWeight: 'bold' }}>
          {value}
        </s-text>
        <s-text as="p" variant="headingLg" tone="subdued">
          {label}
        </s-text>
      </s-stack>
    </s-box>
=======
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
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
  );
}

export default function Dashboard() {
  const { activeOffers, totalOffers } = useLoaderData();
<<<<<<< HEAD
=======
  const [openModal, setOpenModal] = useState(false);
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

  const supportItems = [
    {
      iconType: "chat",
      title: "Get Live Chat support",
      description:
        "Get support from our highly-skilled support team. We are only a message away!",
      url: "https://your-live-chat-url.com",
    },
    {
      iconType: "play-circle",
      title: "View FAQs",
      description:
        "View our Frequently Asked Questions and learn more about Bundle Forge functionality.",
      url: "https://your-faq-url.com",
    },
    {
      iconType: "play-circle",
      title: "Watch our YouTube series",
      description:
        "Watch all the step-by-step guides for the app in our YouTube series.",
      url: "https://youtube.com/your-channel",
    },
    {
      iconType: "envelope",
      title: "Contact via email",
      description:
        "Send us an email at support@ellowww.com for further assistance.",
      url: "mailto:support@ellowww.com",
    },
  ];

  return (
<<<<<<< HEAD
    <s-page heading="Bundle Forge" subheading="Create and manage bundle offers to increase AOV">
      <ui-title-bar title="Bundle Forge">
        <button variant="primary" onClick={() => document.getElementById('create-offer-modal').show()}>Create Offer</button>
      </ui-title-bar>
      <s-stack direction="block" gap="large">
        <s-section>
          <s-stack direction="block" gap="base">
            <s-text as="h2" variant="heading2xl">
              Get support
            </s-text>
            <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {supportItems.map((item, index) => (
                  <SupportItem key={index} {...item} />
                ))}
              </div>
            </s-box>
          </s-stack>
        </s-section>

        <s-section>
          <s-stack direction="block" gap="base">
            <s-text as="h2" variant="heading2xl">
              Offer Analytics
            </s-text>
            <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
              <s-stack direction="inline" gap="large" justifyContent="space-around">
                <StatItem value={activeOffers.toString()} label="Active Offers" />
                <StatItem value={totalOffers.toString()} label="Total Offers" />
              </s-stack>
            </s-box>
          </s-stack>
        </s-section>
      </s-stack>

      <CreateOfferModal />
    </s-page>
=======
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
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
