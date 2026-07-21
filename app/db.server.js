import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;

export async function resolveShop(domain) {
  if (!domain) throw new Error("Domain is required to resolve shop");
  let shop = await prisma.shop.findUnique({ where: { domain } });
  if (!shop) {
    shop = await prisma.shop.create({
      data: { domain, name: domain },
    });
  }
  return shop;
}
