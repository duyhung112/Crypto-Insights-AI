'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const sendDiscordNotificationTool = ai.defineTool(
  {
    name: 'sendDiscordNotification',
    description: 'Sends a notification message to a configured Discord webhook.',
    inputSchema: z.object({
      message: z.string().describe('The content of the message to send.'),
      webhookUrl: z.string().url().describe('The Discord webhook URL to send the message to.'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
    }),
  },
  async (input) => {
    if (!input.webhookUrl) {
        console.log('[Tool] No Discord webhook URL provided, skipping notification.');
        return { success: false };
    }

    console.log(`[Tool] Sending notification to Discord: "${input.message}"`);
    
    try {
        const response = await fetch(input.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: input.message,
                username: "Trading Expert AI",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Tool] Error sending Discord notification: ${response.status} ${errorText}`);
            return { success: false };
        }
        
        console.log('[Tool] Discord notification sent successfully.');
        return { success: true };

    } catch (error) {
        console.error('[Tool] Failed to send Discord notification:', error);
        return { success: false };
    }
  }
);
