import { formatEther } from "viem";

/**
 * Formats a bigint to a human-readable string with fixed decimals
 * @param value - BigInt value to format
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string
 */
export const formatBigInt = (value: bigint | undefined, decimals = 4): string => {
  if (value === undefined) return "0.0000";
  return parseFloat(formatEther(value)).toFixed(decimals);
};

/**
 * Formats a number or string to a fixed decimal string
 * @param value - Value to format
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string
 */
export const formatNumber = (value: number | string | undefined, decimals = 4): string => {
  if (value === undefined) return "0.0000";
  return parseFloat(value.toString()).toFixed(decimals);
};

/**
 * Extracts action parameters from LLM response
 * @param llmResponse - The full LLM response text
 * @returns Action info or null if no action found
 */
export const extractActionFromResponse = (llmResponse: string): { 
  actionType: string; 
  params: string[];
  actionLine: string;
} | null => {
  const lines = llmResponse.split('\n');
  const actionLine = lines.find(line => line.startsWith("ACTION:"));
  
  if (!actionLine) return null;
  
  const parts = actionLine.split(":");
  if (parts.length < 2) return null;
  
  return {
    actionType: parts[1],
    params: parts.slice(2),
    actionLine,
  };
};

// export function extractActionFromResponse(response: string) {
//   // Regex to match ACTION:TYPE:param1:param2:...
//   const actionRegex = /ACTION:([A-Z]+):([^:\n]+)(?::([^:\n]+))?(?::([^:\n]+))?(?::([^:\n]+))?/;
//   const match = response.match(actionRegex);
  
//   if (!match) return null;
  
//   const actionLine = match[0];
//   const actionType = match[1];
  
//   // Filter out undefined params and collect valid ones
//   const params = match.slice(2).filter(param => param !== undefined);
  
//   return {
//     actionLine,
//     actionType,
//     params
//   };
// }