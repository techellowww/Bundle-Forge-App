import { PrismaClient } from '@prisma/client';


async function check() {
  const prisma = new PrismaClient();
  const session = await prisma.session.findFirst({
    orderBy: { id: 'desc' }
  });
  
  if (!session) {
    console.log("No session found");
    return;
  }
  
  const res = await fetch(`https://${session.shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken,
    },
    body: JSON.stringify({
      query: `query {
        shopifyFunctions(first: 50) {
          nodes { id apiType title }
        }
      }`
    })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check().catch(console.error);
