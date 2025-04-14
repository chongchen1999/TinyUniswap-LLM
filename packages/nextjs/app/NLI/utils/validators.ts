import { NUMBER_REGEX } from "./constants";

/**
 * Validates if the input is a valid number format
 * @param input - String input to validate
 * @returns Boolean indicating if the input is valid
 */
export const isValidNumberInput = (input: string): boolean => {
  if (!input || !NUMBER_REGEX.test(input)) {
    return false;
  }
  return true;
};

/**
 * Validates action parameters for token operations
 * @param params - Parameters to validate
 * @returns Object with validation result and error message
 */
export const validateActionParams = (
  actionType: string,
  params: string[]
): { isValid: boolean; errorMessage: string } => {
  // Check for required parameters based on action type
  switch (actionType) {
    case "SWAP":
      if (params.length < 3) {
        return { isValid: false, errorMessage: "Missing parameters for swap" };
      }
      if (!isValidNumberInput(params[2])) {
        return { isValid: false, errorMessage: "Invalid amount format for swap" };
      }
      break;
    case "DEPOSIT":
      if (params.length < 3) {
        return { isValid: false, errorMessage: "Missing parameters for deposit" };
      }
      if (!isValidNumberInput(params[1]) || !isValidNumberInput(params[2])) {
        return { isValid: false, errorMessage: "Invalid amount format for deposit" };
      }
      break;
    case "WITHDRAW":
      if (params.length < 2) {
        return { isValid: false, errorMessage: "Missing parameters for withdrawal" };
      }
      if (!isValidNumberInput(params[1])) {
        return { isValid: false, errorMessage: "Invalid amount format for withdrawal" };
      }
      break;
    case "TRANSFER":
      if (params.length < 3) {
        return { isValid: false, errorMessage: "Missing parameters for transfer" };
      }
      if (!isValidNumberInput(params[1])) {
        return { isValid: false, errorMessage: "Invalid amount format for transfer" };
      }
      if (!params[2] || !params[2].startsWith("0x") || params[2].length !== 42) {
        return { isValid: false, errorMessage: "Invalid recipient address format" };
      }
      break;
    default:
      return { isValid: false, errorMessage: "Unknown action type" };
  }

  return { isValid: true, errorMessage: "" };
};