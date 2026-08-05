export interface DropRate {
  chance: number;
  amount: number;
}

export function calculateExpectedValue(rates: DropRate[]): number {
  return rates.reduce((sum, rate) => sum + rate.chance * rate.amount, 0);
}

export function calculateGuaranteedDropValue(rates: DropRate[]): number {
  const totalChance = rates.reduce((sum, rate) => sum + rate.chance, 0);
  return rates.reduce(
    (sum, rate) => sum + (rate.chance / totalChance) * rate.amount,
    0,
  );
}

export function calculateConditionalGuaranteedValue(rates: DropRate[]): number {
  const dropChance = rates.reduce((sum, rate) => sum + rate.chance, 0);
  const pityProbability = Math.pow(1 - dropChance, 4);
  return (
    pityProbability * calculateGuaranteedDropValue(rates) +
    (1 - pityProbability) * calculateExpectedValue(rates)
  );
}
