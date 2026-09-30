export const config = {
  path: "/api/models"
};

export default async () => {
  return new Response(
    JSON.stringify({
      models: [
        {
          id: 'gemini-3.1-flash-lite',
          name: 'Nexora 3.1 Flash Lite',
          badge: 'Ultra Fast',
          description: 'Ultra-low latency responses, instant streaming & quick document parsing.',
          recommendedFor: 'Fastest responses, everyday writing & live voice dictation'
        },
        {
          id: 'gemini-3.8-flash',
          name: 'Nexora 3.8 Flash',
          badge: 'Fast & Smart',
          description: 'High-speed multimodal reasoning for complex writing & rich analysis.',
          recommendedFor: 'Everyday writing, PDF queries & instant analysis'
        },
        {
          id: 'gemini-flash-latest',
          name: 'Nexora Flash Latest',
          badge: 'High Availability',
          description: 'General-purpose high speed generation model with strong multimodal support.',
          recommendedFor: 'Reliable responses, summaries & text processing'
        },
        {
          id: 'gemini-3.1-pro-preview',
          name: 'Nexora 3.1 Pro',
          badge: 'Deep Reasoning',
          description: 'State-of-the-art capability for complex multi-page synthesis, research & intricate reasoning.',
          recommendedFor: 'Complex legal/technical PDFs, advanced code & comprehensive essays'
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
