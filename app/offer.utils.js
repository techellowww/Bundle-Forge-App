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
  return date ? new Date(date).toLocaleDateString() : "—";
};
