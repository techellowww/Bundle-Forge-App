import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useRouteError, useNavigate } from "react-router";
<<<<<<< HEAD
import { useState } from "react";
// import CreateOfferModal from "../components/CreateOfferModal";
=======
import {
  Card,
  Page,
  Layout,
  Button,
  Icon,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Collapsible,
  List,
  Divider,
} from "@shopify/polaris";
import {
  ChatIcon,
  PlayCircleIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";
import CreateOfferModal from "../components/CreateOfferModal";
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

<<<<<<< HEAD
function SupportCard({ iconType, title, description, onClick }) {
  return (
    <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
=======
function SupportCard({ icon, title, description, onClick }) {
  return (
    <Card padding="500">
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
      <div
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer", outline: "none" }}
      >
<<<<<<< HEAD
        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
          <s-stack direction="inline" gap="300" alignItems="start">
            {iconType && (
              <s-box minWidth="32px" paddingBlockStart="050">
                <s-stack direction="inline" alignItems="center" justifyContent="center">
                  <s-icon type={iconType} />
                </s-stack>
              </s-box>
            )}

            <s-stack direction="block" gap="small-200">
              <s-text as="h3" variant="headingSm">
                {title}
              </s-text>

              <s-text as="p" variant="bodySm" tone="subdued">
                {description}
              </s-text>
            </s-stack>
          </s-stack>

          <s-box>
            <s-stack direction="inline" alignItems="center">
              <s-icon type="arrow-right" tone="subdued" />
            </s-stack>
          </s-box>
        </s-stack>
      </div>
    </s-box>
  );
}

export default function HelpSupport() {
  const navigate = useNavigate();
=======
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="300" blockAlign="start">
            {icon && (
              <Box minWidth="32px" paddingBlockStart="050">
                <InlineStack blockAlign="center" align="center">
                  <Icon source={icon} />
                </InlineStack>
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

          <Box>
            <InlineStack blockAlign="center">
              <Icon source={ArrowRightIcon} tone="subdued" />
            </InlineStack>
          </Box>
        </InlineStack>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  // const [openModal, setOpenModal] = useState(false);
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const handleFaqToggle = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? -1 : index));
  };

  const supportItems = [
    {
<<<<<<< HEAD
      iconType: "chat",
=======
      icon: ChatIcon,
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
      title: "Get Live Chat support",
      description:
        "Get support from our highly-skilled support team. We are only a message away!",
      onClick: () => window.open("https://your-live-chat-url.com", "_blank"),
    },
    {
<<<<<<< HEAD
      iconType: "play-circle",
=======
      icon: PlayCircleIcon,
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
      title: "View FAQs",
      description:
        "View our Frequently Asked Questions and learn more about Bundle Forge functionality.",
      onClick: () => window.open("https://your-faq-url.com", "_blank"),
    },
    {
<<<<<<< HEAD
      iconType: "play-circle",
=======
      icon: PlayCircleIcon,
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
      title: "Watch our YouTube series",
      description:
        "Watch all the step-by-step guides for the app in our YouTube series.",
      onClick: () => window.open("https://youtube.com/your-channel", "_blank"),
    },
    {
<<<<<<< HEAD
      iconType: "envelope",
=======
      icon: EnvelopeIcon,
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
      title: "Contact via email",
      description:
        "Send us an email at tech@ellowww.com for further assistance.",
      onClick: () => (window.location.href = "mailto:tech@ellowww.com"),
    },
  ];

  const faq = [
    {
      question: "How do I enable the App Embed?",
      answer:
        "To make your Upsell offers appear on your storefront, you need to enable the App Embed in your Shopify theme. This takes just a minute.",
      steps: [
        "Go to Shopify admin → Online Store → Customize.",
        "In the theme editor, open the App embeds tab.",
        "Find Libautech Smart Upsell and toggle it on.",
        "(Optional) If your theme supports app blocks, drag our block into the Product template.",
        "Click Save to make it live.",
      ],
    },
    {
      question: "My offer isn’t showing up — what should I do?",
      answer:
        "If you’ve created an Upsell offer but it isn’t appearing on your storefront, here are the most common reasons and how to fix them.",
      steps: [
        "Enable the App embed: Online Store → Themes → Customize → App embeds → Smart Upsell ON → Save.",
        "Confirm the offer is active in the app dashboard (Offers).",
        "Verify targeting (Check that the offer trigger is set to the correct products).",
        "Check placement/templates (enable the embed/block on all relevant product templates; page builders may need manual placement).",
        "Custom themes: if the “Add to cart” can’t be detected, contact us and we will help you in under 5 minutes or as soon as we are online.",
      ],
    },
    {
      question: "How do I reposition the widget?",
      answer:
        "If your theme supports app blocks, simply drag the app block to the desired location.",
      steps: [
        "Open Online Store → Customize.",
        "Navigate to the Product template.",
        "Drag the Bundle Forge app block to your preferred position.",
        "Save the theme.",
      ],
      answerSecondary:
        "If your theme doesn't support app blocks, use the placement settings or insert the provided snippet manually.",
      stepsSecondary: [
        "Open the Placement settings inside Bundle Forge.",
        "Choose the desired position.",
        "If needed, manually insert the app snippet into your theme.",
      ],
    },
    {
      question: "How do I edit an existing offer?",
      steps: [
        "Open the app → Dashboard.",
        "Find the offer and click edit button.",
        "Change anything from trigger/offer products, discounts and designs.",
        "Save and refresh your storefront to preview.",
      ],
    },
    {
      question:
        "Can I use the app with theme builders like PageFly or GemPages?",
      answer: "Yes. But the placement may require a manual step:",
      steps: [
        "Enable the App embed in the theme editor first.",
        "In your builder, add our widget as a custom block/HTML if default placement doesn’t show.",
      ],
    },
    {
      question: "What is meant by order limits in the plan page?",
      answer:
        "Order limits apply only to orders influenced by the app, not every store order.",
      steps: [
        "Only upsell-influenced orders count toward plan usage.",
        "Limits reset monthly.",
        "Hitting the cap pauses upsells until next cycle unless you upgrade.",
      ],
    },
  ];

  return (
<<<<<<< HEAD
    <s-page heading="Help & Support">
      <ui-title-bar title="Help & Support">
        <button variant="breadcrumb" onClick={() => navigate('/app')}>Dashboard</button>
      </ui-title-bar>
      <s-stack direction="block" gap="600">
        <s-section>
          {/* Support */}
          <s-box width="100%">
            <s-stack direction="block" gap="large">
              <s-text as="h2" variant="headingMd">
                Get support
              </s-text>

              <s-box
=======
    <Page backAction={{ content: 'Dashboard', onAction: () => navigate('/app') }}>
      <BlockStack gap="600">
        <Layout>
          {/* Support */}
          <Layout.Section>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Get support
              </Text>

              <Box
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                  gap: "16px",
                }}
              >
                {supportItems.map((item, index) => (
                  <SupportCard key={index} {...item} />
                ))}
<<<<<<< HEAD
              </s-box>
            </s-stack>
          </s-box>
        </s-section>

        <s-section>
          <s-box background="bg-surface" borderRadius="200" shadow="100" overflow="hidden">
            <s-stack direction="block" gap="0">
              <s-box
                paddingBlock="600"
                paddingInline="600"
                borderBlockEndWidth="025"
                borderColor="border"
              >
                <s-stack direction="block" gap="100">
                  <s-text as="h2" variant="headingMd">
                    Frequently asked questions
                  </s-text>

                  <s-text as="p" tone="subdued">
                    Learn how to configure Bundle Forge and troubleshoot common
                    questions.
                  </s-text>
                </s-stack>
              </s-box>

              {faq.map((item, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <s-box key={index}>
                    <button
                      type="button"
                      onClick={() => handleFaqToggle(index)}
                      style={{
                        width: "100%",
                        border: 0,
                        cursor: "pointer",
                        background: isOpen ? "#F6F6F7" : "transparent",
                        padding: 0,
                        textAlign: "left",
                      }}
                    >
                      <s-box paddingBlock="500" paddingInline="600">
                        <s-stack
                          direction="inline"
                          justifyContent="space-between"
                          alignItems="center"
                          wrap={false}
                        >
                          <s-box width="100%">
                            <s-text as="h3" variant="headingSm">
                              {item.question}
                            </s-text>
                          </s-box>

                          <s-box>
                            <s-icon
                              type={isOpen ? "chevron-up" : "chevron-down"}
                              tone="subdued"
                            />
                          </s-box>
                        </s-stack>
                      </s-box>
                    </button>

                    {isOpen && (
                      <s-box paddingInline="500" paddingBlockEnd="500">
                        <s-stack direction="block" gap="large">
                          {item.answer && (
                            <s-text as="p" tone="subdued">
                              {item.answer}
                            </s-text>
                          )}

                          {item.steps && (
                            <s-unordered-list>
                              {item.steps.map((step, i) => (
                                <s-list-item key={i}>{step}</s-list-item>
                              ))}
                            </s-unordered-list>
                          )}

                          {item.answerSecondary && (
                            <>
                              <s-divider />
                              <s-text as="p" tone="subdued">
                                {item.answerSecondary}
                              </s-text>
                            </>
                          )}

                          {item.stepsSecondary && (
                            <s-unordered-list>
                              {item.stepsSecondary.map((step, i) => (
                                <s-list-item key={i}>{step}</s-list-item>
                              ))}
                            </s-unordered-list>
                          )}
                        </s-stack>
                      </s-box>
                    )}

                    {index !== faq.length - 1 && <s-divider />}
                  </s-box>
                );
              })}
            </s-stack>
          </s-box>
        </s-section>
      </s-stack>
    </s-page>
=======
              </Box>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Layout.Section>
        <Card roundedAbove="sm" padding="0">
          <BlockStack gap="0">
            <Box
              paddingBlock="600"
              paddingInline="600"
              borderBlockEndWidth="025"
              borderColor="border"
            >
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Frequently asked questions
                </Text>

                <Text as="p" tone="subdued">
                  Learn how to configure Bundle Forge and troubleshoot common
                  questions.
                </Text>
              </BlockStack>
            </Box>

            {faq.map((item, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <Box key={index}>
                  <button
                    type="button"
                    onClick={() => handleFaqToggle(index)}
                    style={{
                      width: "100%",
                      border: 0,
                      cursor: "pointer",
                      background: isOpen ? "#F6F6F7" : "transparent",
                      padding: 0,
                      textAlign: "left",
                    }}
                  >
                    <Box
  paddingBlock="500"
  paddingInline="600"
>
                      <InlineStack
                        align="space-between"
                        blockAlign="center"
                        wrap={false}
                      >
                        <Box width="100%">
                          <Text as="h3" variant="headingSm">
                            {item.question}
                          </Text>
                        </Box>

                        <Box>
                          <Icon
                            source={isOpen ? ChevronUpIcon : ChevronDownIcon}
                            tone="subdued"
                          />
                        </Box>
                      </InlineStack>
                    </Box>
                  </button>

                  <Collapsible open={isOpen}>
                    <Box paddingInline="500" paddingBlockEnd="500">
                      <BlockStack gap="400">
                        {item.answer && (
                          <Text as="p" tone="subdued">
                            {item.answer}
                          </Text>
                        )}

                        {item.steps && (
                          <List type="number">
                            {item.steps.map((step, i) => (
                              <List.Item key={i}>{step}</List.Item>
                            ))}
                          </List>
                        )}

                        {item.answerSecondary && (
                          <>
                            <Divider />
                            <Text as="p" tone="subdued">
                              {item.answerSecondary}
                            </Text>
                          </>
                        )}

                        {item.stepsSecondary && (
                          <List type="number">
                            {item.stepsSecondary.map((step, i) => (
                              <List.Item key={i}>{step}</List.Item>
                            ))}
                          </List>
                        )}
                      </BlockStack>
                    </Box>
                  </Collapsible>

                  {index !== faq.length - 1 && <Divider />}
                </Box>
              );
            })}
          </BlockStack>
        </Card>
      </Layout.Section>

      {/* <CreateOfferModal open={openModal} onClose={() => setOpenModal(false)} /> */}
    </Page>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
<<<<<<< HEAD
}
=======
};
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
