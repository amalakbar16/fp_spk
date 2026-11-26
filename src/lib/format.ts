export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDecimal(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(digits);
}

export function formatPercent(weight: number, digits = 2): string {
  return `${(weight * 100).toFixed(digits)}%`;
}

export function formatSaatyValue(value: number): string {
  const fractions: Array<[number, string]> = [
    [1 / 9, "1/9"],
    [1 / 8, "1/8"],
    [1 / 7, "1/7"],
    [1 / 6, "1/6"],
    [1 / 5, "1/5"],
    [1 / 4, "1/4"],
    [1 / 3, "1/3"],
    [1 / 2, "1/2"],
  ];

  for (const [target, label] of fractions) {
    if (Math.abs(value - target) < 1e-4) return label;
  }
  if (Math.abs(value - Math.round(value)) < 1e-4) {
    return String(Math.round(value));
  }
  return value.toFixed(3);
}

export function formatCriterionRawValue(
  criterionCode: string,
  value: number
): string {
  switch (criterionCode.toUpperCase()) {
    case "C1":
      return formatRupiah(value);
    case "C2":
      return `${Math.round(value).toLocaleString("id-ID")} rb`;
    case "C3":
    case "C4":
      return `${value} GB`;
    case "C5":
      return `${Math.round(value).toLocaleString("id-ID")} mAh`;
    case "C6":
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    default:
      return String(value);
  }
}
