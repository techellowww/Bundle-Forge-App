/**
 * Get offer status - use stored status field
 */
export const getOfferStatus = (offer) => {
  return offer.status === "active" ? "active" : "inactive";
};

/**
 * Status color mapping for badges
 */
export const getStatusColor = (status) => {
  return status === "active" ? "success" : "critical";
};

/**
 * Format date to locale string
 */
export const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
