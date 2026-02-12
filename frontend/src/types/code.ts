export interface CodeReward {
  name: string;
  quantity: number;
}

export interface Code {
  code: string;
  rewards?: CodeReward[];
  /** Legacy field kept for backward compatibility */
  reward?: CodeReward[];
  active: boolean;
}
