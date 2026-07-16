import {
  Modal,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Box,
  Icon,
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
    <Modal open={open} onClose={onClose} title="Choose offer type" size="medium">
      <Modal.Section>
        <BlockStack gap="500">
          <Text alignment="center" variant="headingLg" as="h2">
            Choose an offer type to begin
          </Text>

          {offers.map((offer) => (
            <Card key={offer.title}>
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="400" blockAlign="center">
                  <Box
                    background="bg-surface-secondary"
                    padding="400"
                    borderRadius="300"
                  >
                    <Icon source={offer.icon} />
                  </Box>

                  <BlockStack gap="100">
                    <Text as="h3" variant="headingMd">
                      {offer.title}
                    </Text>

                    <Text as="p" tone="subdued">
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
