// pages/api/cron/auto-release.js
// Vercel cron endpoint - runs your working script automatically

import { autoReleaseLessons } from '../../../lib/auto-release.js';

export default async function handler(req, res) {
  // Security check - only allow Vercel cron
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (authHeader !== expectedAuth) {
    console.log('❌ Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🕐 Cron job triggered at:', new Date().toISOString());
    
    // Run your exact same auto-release logic
    const result = await autoReleaseLessons();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        count: result.count,
        timestamp: new Date().toISOString(),
        stats: result.stats
      });
    } else {
      console.error('Auto-release failed:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Cron handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}