// DMX API constants
export const DMX_BASE_URL = process.env.NEXT_PUBLIC_DMX_BASE_URL;
export const DMX_API_KEY = process.env.NEXT_PUBLIC_DMX_API_KEY;
export const DEFAULT_LLM_MODEL = process.env.NEXT_PUBLIC_DEFAULT_LLM_MODEL;

// Regex validation patterns
export const NUMBER_REGEX = /^\.?\d+\.?\d*$/;

// Action types for LLM responses
export const ACTION_TYPES = {
  SWAP: "SWAP",
  DEPOSIT: "DEPOSIT",
  WITHDRAW: "WITHDRAW",
};

// Pool identifiers
export const POOLS = {
  ETH_TOKEN_A: "ethtokenapool",
  ETH_TOKEN_B: "ethtokenbpool",
  TOKEN_A_TOKEN_B: "tokenatokenbpool",
};

// Token identifiers
export const TOKENS = {
  ETH: "eth",
  TOKEN_A: "tokena",
  TOKEN_B: "tokenb",
};