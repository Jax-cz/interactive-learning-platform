// pages/api/cron/auto-release.js
// Vercel cron endpoint - runs your working script automatically

import { autoReleaseLessons } from '../../../lib/auto-release.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security check - allow Vercel cron OR manual with secret
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const isVercelCron = req.headers['user-agent']?.includes('vercel') || 
                       req.headers['x-vercel-id'] || 
                       !authHeader; // Vercel cron doesn't send auth header
  
  // Reject if neither Vercel cron nor valid manual auth
  if (!isVercelCron && authHeader !== expectedAuth) {
    console.log('❌ Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕐 Cron job triggered at:', new Date().toISOString());
    console.log('🔍 Request source:', isVercelCron ? 'Vercel Cron' : 'Manual with Auth');
    
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