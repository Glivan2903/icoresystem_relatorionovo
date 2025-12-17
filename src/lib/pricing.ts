export const calculateResalePrice = (costPrice: number, percentage: number): number => {
    const priceWithMargin = costPrice * (1 + percentage / 100);
    // Round up to nearest 0.10
    // e.g. 157.81 -> 157.90
    // Math.ceil(157.81 * 10) -> Math.ceil(1578.1) -> 1579
    // 1579 / 10 -> 157.90
    return Math.ceil(priceWithMargin * 10) / 10;
};
