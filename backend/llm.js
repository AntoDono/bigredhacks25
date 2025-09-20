import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { create_element_prompt } from './prompts.js';
import { ElementCache } from './schema.js';
dotenv.config();

const groq = new Groq();

// Helper function to get cached element combination
async function getCachedElement(element1, element2) {
  try {
    // Normalize case and order to ensure consistent caching
    const [first, second] = [element1.toLowerCase(), element2.toLowerCase()].sort();
    
    const cached = await ElementCache.findOne({
      element1: first,
      element2: second
    });
    
    return cached ? cached.result : null;
  } catch (error) {
    console.error('Error retrieving cached element:', error);
    return null;
  }
}

// Helper function to cache element combination
async function cacheElement(element1, element2, result) {
  try {
    // Normalize case and order to ensure consistent caching
    const [first, second] = [element1.toLowerCase(), element2.toLowerCase()].sort();
    
    const cacheEntry = new ElementCache({
      element1: first,
      element2: second,
      result: result
    });
    
    await cacheEntry.save();
    console.log(`Cached combination: ${first} + ${second} = ${result.element}`);
  } catch (error) {
    console.error('Error caching element:', error);
  }
}

async function create_element(element1, element2) {
  try {
    // First, check if we have this combination cached
    const cachedResult = await getCachedElement(element1, element2);
    if (cachedResult) {
      console.log(`Cache hit: ${element1} + ${element2} = ${cachedResult.element}`);
      return cachedResult;
    }

    console.log(`Cache miss: ${element1} + ${element2}, calling LLM...`);
    
    // If not cached, make the LLM call
    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "system",
          "content": `${create_element_prompt}\n\nCombine these two elements: ${element1} + ${element2}`
        },
        {
          "role": "user",
          "content": `${element1} + ${element2}`
        }
      ],
      "model": "openai/gpt-oss-20b",
      "temperature": 0,
      "max_completion_tokens": 1024,
      "top_p": 1,
      "stream": false,
      "reasoning_effort": "low",
      "stop": null
    });

    const response = chatCompletion.choices[0]?.message?.content;
    
    // Parse the JSON response
    try {
      const parsed = JSON.parse(response);
      
      // Cache the successful result
      await cacheElement(element1, element2, parsed);
      
      return parsed;
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('Failed to parse JSON response:', response);
      const fallback = { element: "trash", emoji: "❓" };
      
      // Cache the fallback result to avoid repeated failures
      await cacheElement(element1, element2, fallback);
      
      return fallback;
    }
    
  } catch (error) {
    console.error('Error creating element:', error);
    const errorResult = { element: "Error", emoji: "⚠️" };
    
    // Don't cache error results as they might be temporary issues
    return errorResult;
  }
}

export { create_element };

