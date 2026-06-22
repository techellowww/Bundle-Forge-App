import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate } from "react-router";
import { Button, ButtonGroup } from "@shopify/polaris";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });

  const bundles = await prisma.fixedBundleOffer.findMany({
    where: { shopId: shop.id },
    include: { products: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ bundles });
}

export default function FixedBundlesListPage() {
  const { bundles } = useLoaderData();
  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate(`/app/fixed-bundle?id=${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch("/api/fixed-bundle", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.success) {
        shopify.toast.show("Bundle deleted");
        window.location.reload();
      } else {
        shopify.toast.show(data.error || "Delete failed", { isError: true });
      }
    } catch (err) {
      console.error(err);
      shopify.toast.show("Something went wrong", { isError: true });
    }
  };

  // const getStatus = (bundle) => {
  //   const now = new Date();
  //   const start = bundle.startDate ? new Date(bundle.startDate) : null;
  //   const end = bundle.endDate ? new Date(bundle.endDate) : null;
  //   if (bundle.status === "PAUSED") return "PAUSED";
  //   if (end && end < now) return "EXPIRED";
  //   if (start && start > now) return "SCHEDULED";
  //   return "ACTIVE";
  // };

  return (
    <s-page heading="Fixed Bundle Offers">
      <s-section>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "12px",
          }}
        >
          <Button
            variant="primary"
            onClick={() => navigate("/app/fixed-bundle")}
          >
            Create Bundle
          </Button>
        </div>

        <s-table>
          <s-table-header-row>
            <s-table-header>Title</s-table-header>
            <s-table-header>Description</s-table-header>
            <s-table-header>Products</s-table-header>
            <s-table-header>Status</s-table-header>
            <s-table-header>Start Date</s-table-header>
            <s-table-header>End Date</s-table-header>
            <s-table-header>Actions</s-table-header>
          </s-table-header-row>

          <s-table-body>
            {bundles?.length === 0 && (
              <s-table-row>
                <s-table-cell colSpan={7}>
                  <div style={{ textAlign: "center", padding: "24px" }}>
                    No bundles yet. Create your first one!
                  </div>
                </s-table-cell>
              </s-table-row>
            )}

            {bundles?.map((bundle) => (
              <s-table-row key={bundle.id}>
                <s-table-cell>{bundle.title}</s-table-cell>

                <s-table-cell>{bundle.description || "—"}</s-table-cell>

                <s-table-cell>
                  {bundle.products?.length > 0
                    ? bundle.products.map((p) => p.title).join(", ")
                    : "—"}
                </s-table-cell>

                <s-table-cell>{bundle.status}</s-table-cell>

                <s-table-cell>
                  {bundle.startDate
                    ? new Date(bundle.startDate).toLocaleDateString()
                    : "—"}
                </s-table-cell>

                <s-table-cell>
                  {bundle.endDate
                    ? new Date(bundle.endDate).toLocaleDateString()
                    : "—"}
                </s-table-cell>

                <s-table-cell>
                  <ButtonGroup>
                    <Button size="slim" onClick={() => handleEdit(bundle.id)}>
                      Edit
                    </Button>
                    <Button
                      size="slim"
                      tone="critical"
                      onClick={() => handleDelete(bundle.id)}
                    >
                      Delete
                    </Button>
                  </ButtonGroup>
                </s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
