/**
 * Vercel Serverless Function: AI Prompt Generator
 * Uses Google Gemini API to generate custom prompts
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { systemPrompt, userQuery } = req.body;

    // Validate input
    if (!userQuery || typeof userQuery !== 'string') {
      return res.status(400).json({ error: 'User query is required' });
    }

    if (userQuery.trim().length === 0) {
      return res.status(400).json({ error: 'User query cannot be empty' });
    }

    // Get Gemini API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Prepare the prompt
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser request: ${userQuery}`
      : userQuery;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorData);
      return res.status(500).json({ 
        error: 'AI generation failed. Please try again.' 
      });
    }

    const data = await geminiResponse.json();
    
    // Extract the generated text
    let generatedText = '';
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        generatedText = candidate.content.parts[0].text;
      }
    }

    if (!generatedText) {
      console.error('No text generated from Gemini');
      return res.status(500).json({ 
        error: 'Failed to generate prompt. Please try again.' 
      });
    }

    // Return the generated prompt
    return res.status(200).json({ 
      text: generatedText.trim()
    });

  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate prompt. Please try again.' 
    });
  }
}
