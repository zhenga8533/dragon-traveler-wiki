export interface CodeReward {
  name: string;
  quantity: number;
}

export interface Code {
  code: string;
  reward: CodeReward[];
  active: boolean;
}
