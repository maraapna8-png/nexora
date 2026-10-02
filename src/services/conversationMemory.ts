/**
 * Conversation Memory & Context Management Architecture for Nexora AI
 *
 * Implements intelligent multi-tier context retention:
 * 1. Recent Context: High-fidelity recent messages for immediate conversational continuity
 * 2. Important Memory: Key requirements, constraints, discussed code, and previous corrections
 * 3. Follow-up & Coreference Resolution: Explicit context bridging for short follow-ups
 * 4. Token & Attachment Optimization: Compacting older heavy attachments while preserving facts
 */

export interface RawMessage {
  role: string;
  content: string;
  attachments?: Array<{
    type?: string;
    name?: string;
    extractedText?: string;
    dataUrl?: string;
    mimeType?: string;
  }>;
  id?: string;
  createdAt?: number;
}

export interface PreparedContext {
  formattedContents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  }>;
  conversationSummary?: string;
  detectedIntent: {
    isFollowUp: boolean;
    isCorrection: boolean;
    isTransformation: boolean; // e.g. "make it shorter", "make it professional"
    targetLanguage?: string;
    referencesPreviousCode: boolean;
  };
  cleanedHistory: RawMessage[];
}

/**
 * Detects if a user message is a short follow-up referencing previous context
 */
export function analyzeUserIntent(currentText: string, previousMessages: RawMessage[]): {
  isFollowUp: boolean;
  isCorrection: boolean;
  isTransformation: boolean;
  targetLanguage?: string;
  referencesPreviousCode: boolean;
} {
  const text = currentText.trim();
  const lower = text.toLowerCase();

  // Correction markers
  const isCorrection =
    /^(no\b|not that|nahi|na\b|wrong|incorrect|actually|instead|wait no|correction)/i.test(lower) ||
    /^(no,|no\.|nahi,|don't|do not use|stop using)/i.test(lower);

  // Transformation requests (e.g. "make it shorter", "make it formal", "summarize that")
  const isTransformation =
    /\b(make it|turn it into|rewrite it|convert it|change it|translate it|shorten it|expand it)\b/i.test(lower) ||
    /^(shorter|more detailed|longer|concise|simpler|professional|bullet points|in a table|now make it)/i.test(lower);

  // Short follow-ups
  const isFollowUp =
    isTransformation ||
    isCorrection ||
    text.split(/\s+/).length <= 6 ||
    /^(why\??|how\??|what about|continue|explain more|give (me )?(an )?example|show me|next|elaborate|aur batao|aur explain karo)\b/i.test(lower) ||
    /\b(the second one|the first one|the third one|the last one|the function above|the previous|same style|as before)\b/i.test(lower);

  // Code reference check
  const hasCodeKeywords = /\b(function|method|variable|class|bug|error|syntax|compile|test|code|line|return|import|export)\b/i.test(lower);
  const referencesPreviousCode =
    hasCodeKeywords ||
    /\b(second function|first function|fix (the|it)|debug it|refactor it|change the second|add a loop)\b/i.test(lower);

  // Language detection in prompt
  let targetLanguage: string | undefined;
  if (/\b(roman urdu|urdu in english letters|romanized urdu)\b/i.test(lower)) {
    targetLanguage = 'Roman Urdu';
  } else if (/\b(in urdu|urdu mein|urdu zaban)\b/i.test(lower) && !/\broman\b/i.test(lower)) {
    targetLanguage = 'Urdu';
  } else if (/\b(in hindi|hindi mein)\b/i.test(lower)) {
    targetLanguage = 'Hindi';
  } else if (/\b(in english|english mein)\b/i.test(lower)) {
    targetLanguage = 'English';
  } else if (/\b(in arabic|arabic mein)\b/i.test(lower)) {
    targetLanguage = 'Arabic';
  }

  return {
    isFollowUp,
    isCorrection,
    isTransformation,
    targetLanguage,
    referencesPreviousCode
  };
}

/**
 * Extracts enduring constraints, user preferences, and code artifacts from older conversation
 */
export function extractLongTermMemory(messages: RawMessage[]): string {
  if (messages.length <= 6) return '';

  const constraints: string[] = [];
  const discussedCodeSnippets: string[] = [];
  const corrections: string[] = [];

  for (let i = 0; i < messages.length - 4; i++) {
    const msg = messages[i];
    const content = msg.content || '';
    const lower = content.toLowerCase();

    // Catch language constraints
    if (msg.role === 'user') {
      if (/\b(roman urdu)\b/i.test(lower)) {
        constraints.push('User preference: Use Roman Urdu for explanations.');
      } else if (/\b(urdu)\b/i.test(lower) && !/\broman\b/i.test(lower)) {
        constraints.push('User preference: Output in Urdu (اردو).');
      } else if (/\b(python|react|typescript|javascript|golang|rust|c\+\+|sql)\b/i.test(lower)) {
        const match = lower.match(/\b(python|react|typescript|javascript|golang|rust|c\+\+|sql)\b/i);
        if (match) {
          constraints.push(`Project tech stack involves: ${match[1].toUpperCase()}`);
        }
      }

      if (/^(no|not that|actually|instead|correction)/i.test(lower)) {
        corrections.push(`User previously corrected: "${content.slice(0, 100)}..."`);
      }
    }

    // Catch function/class names from code blocks
    const codeBlockMatch = content.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const code = codeBlockMatch[1].trim();
      const fnMatches = code.match(/(?:function|def|class|const|let|var)\s+([a-zA-Z0-9_$]+)/g);
      if (fnMatches && fnMatches.length > 0) {
        discussedCodeSnippets.push(`Identified identifiers in earlier code: ${fnMatches.slice(0, 5).join(', ')}`);
      }
    }
  }

  const memoryParts: string[] = [];
  if (constraints.length > 0) {
    const uniqueConstraints = Array.from(new Set(constraints));
    memoryParts.push(`* Key Requirements & Stack: ${uniqueConstraints.join('; ')}`);
  }
  if (corrections.length > 0) {
    const uniqueCorrections = Array.from(new Set(corrections)).slice(-3);
    memoryParts.push(`* Earlier User Corrections to Respect: ${uniqueCorrections.join('; ')}`);
  }
  if (discussedCodeSnippets.length > 0) {
    const uniqueIdentifiers = Array.from(new Set(discussedCodeSnippets)).slice(-3);
    memoryParts.push(`* Previously Discussed Code Context: ${uniqueIdentifiers.join('; ')}`);
  }

  return memoryParts.join('\n');
}

/**
 * Prepares the conversation history for Gemini:
 * - Prunes bloated historical attachments while keeping summaries
 * - Keeps recent 10-14 messages in full fidelity
 * - Injects a conversation memory bridge when relevant
 * - Ensures valid alternating roles (user/model) without duplicates
 */
export function prepareConversationHistory(
  rawMessages: RawMessage[],
  options?: {
    maxRecentMessages?: number;
    systemContext?: string;
  }
): PreparedContext {
  const maxRecent = options?.maxRecentMessages || 12;

  // 1. Filter out empty, system, or error placeholder messages
  const validMessages = rawMessages.filter(m => {
    if (!m) return false;
    const hasText = Boolean(m.content && m.content.trim().length > 0);
    const hasAttachments = Boolean(m.attachments && m.attachments.length > 0);
    return hasText || hasAttachments;
  });

  if (validMessages.length === 0) {
    return {
      formattedContents: [],
      detectedIntent: {
        isFollowUp: false,
        isCorrection: false,
        isTransformation: false,
        referencesPreviousCode: false
      },
      cleanedHistory: []
    };
  }

  const lastUserMsg = [...validMessages].reverse().find(m => m.role === 'user') || validMessages[validMessages.length - 1];
  const lastUserText = lastUserMsg.content || '';
  const previousMessages = validMessages.slice(0, validMessages.indexOf(lastUserMsg));

  // 2. Analyze user intent
  const detectedIntent = analyzeUserIntent(lastUserText, previousMessages);

  // 3. Extract long-term memory summary for deep conversation threads
  const longTermMemory = extractLongTermMemory(validMessages);

  // 4. Determine recent messages window
  const recentMessages = validMessages.length > maxRecent
    ? validMessages.slice(validMessages.length - maxRecent)
    : validMessages;

  // 5. Build formatted contents for Gemini (@google/genai format: 'user' | 'model')
  const formattedContents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  }> = [];

  // If we have long-term memory that precedes the recent messages window, inject it as context on the first user message
  let memoryInjected = false;

  for (let idx = 0; idx < recentMessages.length; idx++) {
    const m = recentMessages[idx];
    const isCurrentPrompt = idx === recentMessages.length - 1 && m.role === 'user';
    const isOlderMessage = idx < recentMessages.length - 2;
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Process attachments
    if (m.attachments && Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att.type === 'image' && att.dataUrl) {
          // If it's an image attachment
          const matches = att.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            parts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        } else if (att.extractedText) {
          if (isCurrentPrompt || !isOlderMessage) {
            // Keep full document for current or immediate prior turn
            const previewText = att.extractedText.slice(0, 60000);
            parts.push({
              text: `[DOCUMENT ATTACHMENT: "${att.name || 'Uploaded Document'}"]\n--- BEGIN DOCUMENT CONTENT ---\n${previewText}\n--- END DOCUMENT CONTENT ---\n`
            });
          } else {
            // Compact older attachments to save tokens
            const wordCount = att.extractedText.split(/\s+/).length;
            const snippet = att.extractedText.slice(0, 400).replace(/\n+/g, ' ');
            parts.push({
              text: `[PREVIOUSLY REFERENCED ATTACHMENT: "${att.name || 'Document'}" (~${wordCount} words). Sample excerpt: "${snippet}..."]`
            });
          }
        }
      }
    }

    let textContent = m.content || '';

    // Inject long term memory on the earliest user turn in the window
    if (!memoryInjected && m.role === 'user' && longTermMemory && validMessages.length > maxRecent) {
      textContent = `[CONVERSATION CONTINUITY & EARLIER MEMORY]\n${longTermMemory}\n[CONTINUING CONVERSATION]\n${textContent}`;
      memoryInjected = true;
    }

    // Context bridge for short follow-up messages
    if (isCurrentPrompt && (detectedIntent.isFollowUp || detectedIntent.isCorrection || detectedIntent.isTransformation)) {
      const immediatePriorMsg = recentMessages[recentMessages.length - 2];
      if (immediatePriorMsg && immediatePriorMsg.role === 'assistant') {
        const priorSnippet = immediatePriorMsg.content.slice(0, 1200);
        let guidance = '';
        if (detectedIntent.isCorrection) {
          guidance = `[CONTEXT INSTRUCTION: The user is correcting or redirecting the previous response. Re-evaluate their request using their correction as the overriding directive.]`;
        } else if (detectedIntent.isTransformation) {
          guidance = `[CONTEXT INSTRUCTION: The user is asking to transform/modify the immediately preceding answer. Apply this modification directly to that previous content without losing the core subject.]`;
        } else if (detectedIntent.referencesPreviousCode) {
          guidance = `[CONTEXT INSTRUCTION: The user is referring to the code discussed in the previous turn. Modify or reference that specific code accurately.]`;
        } else {
          guidance = `[CONTEXT INSTRUCTION: This is a direct follow-up to your previous answer. Maintain conversational continuity and context.]`;
        }

        textContent = `${guidance}\n[PREVIOUS RESPONSE SUMMARY EXCERPT: "${priorSnippet.replace(/\n+/g, ' ').slice(0, 300)}..."]\n\n${textContent}`;
      }
    }

    if (textContent.trim()) {
      parts.push({ text: textContent });
    }

    if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';

    // Gemini API requires alternating roles. If two consecutive messages have the same role, combine them.
    if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
      formattedContents[formattedContents.length - 1].parts.push(...parts);
    } else {
      formattedContents.push({ role, parts });
    }
  }

  // Ensure first message is from 'user'
  if (formattedContents.length > 0 && formattedContents[0].role === 'model') {
    formattedContents.shift();
  }

  return {
    formattedContents,
    conversationSummary: longTermMemory || undefined,
    detectedIntent,
    cleanedHistory: validMessages
  };
}
