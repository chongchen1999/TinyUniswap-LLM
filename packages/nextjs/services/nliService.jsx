// src/services/nliService.js

/**
 * Service module for Natural Language Interface (NLI) functionality
 * Uses DMX API to process natural language requests
 */

// Using environment variables for secure configuration
const DMX_API_KEY = process.env.NEXT_PUBLIC_DMX_API_KEY;
const DMX_BASE_URL = process.env.NEXT_PUBLIC_DMX_BASE_URL || "https://www.dmxapi.com/v1";
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_DMX_DEFAULT_MODEL || "gpt-4o-mini";

/**
 * Process a natural language query using the DMX API
 * @param {string} query - The user's natural language query
 * @param {string} model - The model to use (defaults to configured model)
 * @returns {Promise<Object>} - The response from the LLM
 */
export const processNaturalLanguage = async (query, model = DEFAULT_MODEL) => {
  try {
    const response = await fetch(`${DMX_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DMX_API_KEY}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: query,
          }
        ],
        model: model,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Error processing natural language query");
    }

    return await response.json();
  } catch (error) {
    console.error("NLI Service Error:", error);
    throw error;
  }
};

/**
 * Get available models from DMX API
 * @returns {Promise<Array>} - List of available models
 */
export const getAvailableModels = async () => {
  try {
    const response = await fetch(`${DMX_BASE_URL}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${DMX_API_KEY}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Error fetching available models");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
};