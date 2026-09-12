export const config = {
  path: "/api/models"
};

export default async () => {
  return new Response(
    JSON.stringify({
      models: [
        {
          id: 'gemini-2.5-flash',
          name: 'Nexora 2.5 Flash',
          badge: 'Fast & Smart',
          description: 'High-speed multimodal reasoning for writing, chat & rapid document parsing.',
          recommendedFor: 'Everyday writing, PDF queries & instant analysis'
        },
        {
          id: 'gemini-2.5-pro',
          name: 'Nexora 2.5 Pro',
          badge: 'Deep Reasoning',
          description: 'State-of-the-art capability for complex synthesis, research & intricate documents.',
          recommendedFor: 'Complex legal/technical PDFs, advanced code & essays'
        },
        {
          id: 'gemini-2.0-flash-lite',
          name: 'Nexora 2.0 Flash Lite',
          badge: 'Ultra Fast',
          description: 'Optimized for high-speed micro-edits, quick rewrites & instant summaries.',
          recommendedFor: 'Grammar polish, quick translations & brief queries'
        }
      ]
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    }
  );
};
