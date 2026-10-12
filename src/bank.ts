export type Currency = "CHF" | "EUR" | "USD";
export type ProductId = "basis" | "panorama" | "horizon";
export type Term = 6 | 12 | 24;
export interface Product {
  id: ProductId;
  name: string;
  months: Term;
  rates: Record<Currency, number>;
}
export const products: readonly Product[] = [
  {
    id: "basis",
    name: "Basis",
    months: 6,
    rates: { CHF: 1.2, EUR: 2, USD: 2.8 },
  },
  {
    id: "panorama",
    name: "Panorama",
    months: 12,
    rates: { CHF: 1.8, EUR: 2.6, USD: 3.4 },
  },
  {
    id: "horizon",
    name: "Horizon",
    months: 24,
    rates: { CHF: 2.2, EUR: 3, USD: 3.8 },
  },
];
export const MIN_AMOUNT = 10_000;
export const MAX_AMOUNT = 1_000_000;
export interface CalculationInput {
  principal: number;
  annualRate: number;
  months: number;
  compound: boolean;
}
export interface CalculationResult {
  income: number;
  total: number;
  points: { month: number; income: number; total: number }[];
}
export function clampAmount(amount: number): number {
  return Math.min(
    MAX_AMOUNT,
    Math.max(MIN_AMOUNT, Number.isFinite(amount) ? amount : MIN_AMOUNT),
  );
}
export function calculateDeposit({
  principal,
  annualRate,
  months,
  compound,
}: CalculationInput): CalculationResult {
  if (
    !Number.isFinite(principal) ||
    principal < 0 ||
    !Number.isFinite(annualRate) ||
    annualRate < 0 ||
    !Number.isInteger(months) ||
    months < 0 ||
    months > 600
  ) {
    throw new RangeError("Invalid deposit parameters");
  }
  const rate = annualRate / 100;
  const points = Array.from({ length: months + 1 }, (_, month) => {
    const income = compound
      ? principal * ((1 + rate / 12) ** month - 1)
      : (principal * rate * month) / 12;
    return { month, income, total: principal + income };
  });
  const { income, total } = points[points.length - 1];
  return { income, total, points };
}
