import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useNavigate, useRouteError } from "react-router";
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
} from "@shopify/polaris";
import {
  ChatIcon,
  PlayCircleIcon,
  EnvelopeIcon,
  ArrowRightIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";
import CreateOfferModal from "../components/CreateOfferModal";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

function SupportCard({ icon, title, description, onClick }) {
  return (
    <Card padding="500">
      <Box onClick={onClick} style={{ cursor: "pointer" }}>
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
      </Box>
    </Card>
  );
}

function StatCard({ value, label }) {
  return (
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
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);

  const supportItems = [
    {
      icon: ChatIcon,
      title: "Get Live Chat support",
      description:
        "Get support from our highly-skilled support team. We are only a message away!",
      onClick: () => window.open("https://your-live-chat-url.com", "_blank"),
    },
    {
      icon: PlayCircleIcon,
      title: "View FAQs",
      description:
        "View our Frequently Asked Questions and learn more about Bundle Forge functionality.",
      onClick: () => window.open("https://your-faq-url.com", "_blank"),
    },
    {
      icon: PlayCircleIcon,
      title: "Watch our YouTube series",
      description:
        "Watch all the step-by-step guides for the app in our YouTube series.",
      onClick: () => window.open("https://youtube.com/your-channel", "_blank"),
    },
    {
      icon: EnvelopeIcon,
      title: "Contact via email",
      description:
        "Send us an email at support@ellowww.com for further assistance.",
      onClick: () => (window.location.href = "mailto:support@ellowww.com"),
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

            <Box
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                gap: "16px",
              }}
            >
              {supportItems.map((item, index) => (
                <SupportCard key={index} {...item} />
              ))}
            </Box>
          </BlockStack>
        </Layout.Section>

        {/* Stats */}
        <Layout.Section>
          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
              gap: "16px",
            }}
          >
            <StatCard value="0" label="Active Offers" />
            <StatCard value="0" label="Total Offers" />
          </Box>
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
