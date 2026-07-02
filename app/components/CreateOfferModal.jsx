import {
  Modal,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Box,
} from "@shopify/polaris";

import {
  DiscountIcon,
  ProductIcon,
  GiftCardIcon,
} from "@shopify/polaris-icons";

import { useNavigate } from "react-router";

export default function CreateOfferModal({ open, onClose }) {
  const navigate = useNavigate();

  const offers = [
    {
      title: "Quantity Break",
      description: "Offer tiered discounts based on purchased quantity.",
      icon: DiscountIcon,
      route: "/app/quantityBreak",
    },
    {
      title: "Fixed Bundle",
      description: "Sell multiple products together as a bundle.",
      icon: ProductIcon,
      route: "/app/fixed-bundle",
    },
    {
      title: "Buy X Get Y",
      description: "Reward customers with free or discounted products.",
      icon: GiftCardIcon,
      route: "/app/buyXgetY",
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Choose offer type" large>
      <Modal.Section>
        <Box paddingBlockEnd="400">
          <Text variant="headingMd" alignment="center" as="h2">
            Choose an offer type to begin
          </Text>
        </Box>

        <BlockStack gap="400">
          {offers.map((offer) => (
            <Card key={offer.title} roundedAbove="sm">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="400" blockAlign="center">
                  <Box
                    background="bg-surface-secondary"
                    padding="500"
                    borderRadius="300"
                    minWidth="70px"
                  >
                    <offer.icon width={30} height={30} />
                  </Box>

                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h3">
                      {offer.title}
                    </Text>

                    <Text variant="bodyMd" tone="subdued" as="p">
                      {offer.description}
                    </Text>
                  </BlockStack>
                </InlineStack>

                <Button
                  variant="primary"
                  onClick={() => {
                    onClose();
                    navigate(offer.route);
                  }}
                >
                  Start
                </Button>
              </InlineStack>
            </Card>
          ))}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
