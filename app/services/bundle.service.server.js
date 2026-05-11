import prisma from "../db.server.js";
import {
  createFunctionDiscount,
  updateFunctionDiscount,
  deleteFunctionDiscount,
} from "./shopify-discount.service.server.js";

export const createBundleService = async (data, shop) => {
  const bundle = await prisma.bundle.create({
    data: {
      shop,
      title: data.title,
      type: data.type,
      config: data.config,
      isActive: true,
    },
  });

  try {
    const discountId = await createFunctionDiscount(shop, bundle);

    await prisma.bundle.update({
      where: { id: bundle.id },
      data: { functionId: discountId },
    });

    return bundle;
  } catch (error) {
    await prisma.bundle.delete({ where: { id: bundle.id } });
    throw error;
  }
};

export const getBundlesService = async (shop) => {
  return prisma.bundle.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
};

export const updateBundleService = async (id, data, shop) => {
  const bundle = await prisma.bundle.findFirst({
    where: { id, shop },
  });

  if (!bundle) throw new Error("Bundle not found");

  const updatedBundle = await prisma.bundle.update({
    where: { id },
    data: {
      title: data.title,
      config: data.config,
    },
  });

  if (bundle.functionId) {
    await updateFunctionDiscount(shop, updatedBundle);
  }

  return updatedBundle;
};

export const deleteBundleService = async (id, shop) => {
  const bundle = await prisma.bundle.findFirst({
    where: { id, shop },
  });

  if (!bundle) throw new Error("Bundle not found");

  if (bundle.functionId) {
    await deleteFunctionDiscount(shop, bundle.functionId);
  }

  await prisma.bundle.delete({
    where: { id },
  });

  return true;
};
