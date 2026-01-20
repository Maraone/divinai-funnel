/**
 * Vercel Serverless Function: Email Subscription Handler
 * Saves email addresses directly to Google Sheets using Apps Script Web App
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
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get Google Apps Script Web App URL from environment variables
    const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL;

    if (!GOOGLE_SHEETS_URL) {
      console.error('GOOGLE_SHEETS_URL not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Prepare data
    const timestamp = new Date().toISOString();
    
    // Send to Google Sheets via Apps Script Web App
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        timestamp: timestamp
      }),
    });

    if (!response.ok) {
      console.error('Google Sheets submission failed:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }

    // Return success
    return res.status(200).json({ 
      success: true,
      message: 'Email saved successfully'
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ 
      error: 'Failed to save email. Please try again.' 
    });
  }
}
