export const calculateResalePrice = (costPrice: number, percentage: number): number => {
    const priceWithMargin = costPrice * (1 + percentage / 100);
    // Round up to nearest integer (Real) as per user request (e.g. 182.29 -> 183)
    return Math.ceil(priceWithMargin);
};
