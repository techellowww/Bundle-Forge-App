import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

export default function CreateOfferModal() {
  const navigate = useNavigate();
  const buttonRefs = useRef([]);

  const offers = [
    {
      title: "Quantity Break",
      description: "Offer tiered discounts based on purchased quantity.",
      icon: "discount",
      route: "/app/quantityBreak",
    },
    {
      title: "Fixed Bundle",
      description: "Sell multiple products together as a bundle.",
      icon: "product",
      route: "/app/fixed-bundle",
    },
    {
      title: "Buy X Get Y",
      description: "Reward customers with free or discounted products.",
      icon: "gift-card",
      route: "/app/buyXgetY",
    },
  ];

  useEffect(() => {
    // Attach native DOM event listeners because React Synthetic Events 
    // are blocked when Shopify App Bridge extracts the ui-modal.
    const handlers = buttonRefs.current.map((btn, index) => {
      if (!btn) return null;
      
      const handler = (e) => {
        e.preventDefault();
        shopify.modal.hide('create-offer-modal');
        navigate(offers[index].route);
      };
      
      btn.addEventListener('click', handler);
      return { btn, handler };
    });

    return () => {
      handlers.forEach((item) => {
        if (item) item.btn.removeEventListener('click', item.handler);
      });
    };
  }, [navigate]);

  return (
    <ui-modal id="create-offer-modal" variant="base">
      <ui-title-bar title="Choose offer type">
        <button variant="primary" onClick={() => shopify.modal.hide('create-offer-modal')}>
          Close
        </button>
      </ui-title-bar>
      
      <s-box padding="large">
        <s-stack direction="block" gap="large">
          <s-text alignment="center" variant="headingLg" as="h2">
            Choose an offer type to begin
          </s-text>

          {offers.map((offer, index) => (
            <s-box 
              key={offer.title} 
              padding="base" 
              background="base" 
              borderRadius="base"
              border="base subdued solid"
            >
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" gap="base" alignItems="center">
                  <s-box
                    background="subdued"
                    padding="base"
                    borderRadius="base"
                  >
                    <s-icon source={offer.icon}></s-icon>
                  </s-box>

                  <s-stack direction="block" gap="small-200">
                    <s-text as="h3" variant="headingMd">
                      {offer.title}
                    </s-text>
                    <s-text as="p" tone="subdued">
                      {offer.description}
                    </s-text>
                  </s-stack>
                </s-stack>

                <s-button 
                  variant="primary"
                  ref={(el) => (buttonRefs.current[index] = el)}
                >
                  Start
                </s-button>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
      </s-box>
    </ui-modal>
  );
}
