import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { create_element_prompt } from './prompts.js';
dotenv.config();

const groq = new Groq();

async function create_element(element1, element2) {
  try {
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
      return parsed;
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('Failed to parse JSON response:', response);
      return { element: "Unknown" };
    }
    
  } catch (error) {
    console.error('Error creating element:', error);
    return { element: "Error" };
  }
}

export { create_element };

