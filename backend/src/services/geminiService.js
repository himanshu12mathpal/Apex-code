import { GoogleGenAI } from '@google/genai';

const getApiKeys = () => {
  if (!process.env.GEMINI_API_KEY) return [];
  return process.env.GEMINI_API_KEY.split(',').map(k => k.trim()).filter(Boolean);
};

let currentKeyIndex = 0;

/**
 * Analyze a user's submitted code using Gemini AI
 */
export async function analyzeCode({ title, platform, code, language, userNotes }) {
  const systemPrompt = `You are an expert competitive programming coach. Analyze the user's solution and provide deep, actionable feedback focused on contest performance. Be specific and practical.

CRITICAL STYLE REQUIREMENT: Explain everything (explanations, feedback, alternative approaches, and weakness descriptions) in "Hinglish" (a friendly, casual mix of simple English and WhatsApp Hindi). Use standard Latin characters (e.g., "Bhai, tumne yahan O(N^2) lagaya hai, par isko O(N) me loop lagakar optimize kar sakte the. Tumhe map use karna chahiye tha."). DO NOT use Devnagri script (like हिंदी script). Make it sound like an encouraging, highly knowledgeable Indian coding mentor explaining to a student in a casual WhatsApp chat style.

CRITICAL FORMATTING REQUIREMENT: Format ALL your textual feedback (like thinkingFeedback, optimizations, weaknessDetected) EXCLUSIVELY as clear, concise bullet points. Use standard hyphens (-) or asterisks (*) for bullets. Do NOT write long paragraphs.

Return your analysis as a valid JSON object (no markdown, no code fences) with exactly these fields:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "isOptimal": true/false,
  "optimizations": "text explaining possible optimizations",
  "patternDetected": "name of the algorithmic pattern used",
  "missedObservations": ["observation 1", "observation 2"],
  "thinkingFeedback": "detailed feedback on how the user should think during contests — what to notice, what questions to ask, what patterns to look for",
  "alternativeApproaches": [{"name": "...", "complexity": "O(...)", "note": "..."}],
  "similarProblems": [{"title": "...", "url": "https://...", "difficulty": "Easy/Medium/Hard"}],
  "weaknessDetected": "description of any weakness or none"
}`;

  const userPrompt = `Problem: "${title}" on ${platform}
Language: ${language}

User's Code:
\`\`\`${language}
${code}
\`\`\`

${userNotes?.intuition ? `User's Intuition: ${userNotes.intuition}` : ''}
${userNotes?.approach ? `User's Approach: ${userNotes.approach}` : ''}
${userNotes?.mistakes ? `User's Mistakes: ${userNotes.mistakes}` : ''}
${userNotes?.edgeCases ? `User's Edge Cases: ${userNotes.edgeCases}` : ''}

Analyze this solution deeply. Focus on:
1. Is this the optimal approach?
2. What pattern does this problem belong to?
3. What observations should the user have made during the contest?
4. How should they think about similar problems in the future?
5. What weaknesses does this reveal about the user's problem-solving?`;

  const keys = getApiKeys();
  if (keys.length === 0) throw new Error('No API key configured');

  let lastError = null;

  // Try up to the number of keys available + 1 retry
  for (let attempt = 0; attempt <= keys.length; attempt++) {
    try {
      const apiKey = keys[currentKeyIndex];
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
        ],
      });

      const text = response.text.trim();
      // Strip any markdown code fences if present
      const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      const analysis = JSON.parse(jsonStr);
      return analysis;
      
    } catch (error) {
      console.error(`Gemini AI Error (Key ${currentKeyIndex + 1}/${keys.length}):`, error.message);
      lastError = error;
      
      // If it's a rate limit error (429), switch to the next key
      if (error.status === 429 || error.message.includes('429') || error.message.includes('Quota') || error.message.includes('exhausted')) {
        console.log('Rate limit hit. Rotating API key...');
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      } else {
        // If it's a JSON parse error or something else, break and fail
        break;
      }
    }
  }

  console.error('All Gemini API keys exhausted or failed:', lastError?.message);
  return {
    timeComplexity: 'Analysis failed',
    spaceComplexity: 'Analysis failed',
    isOptimal: false,
    optimizations: 'Could not analyze. Please try again.',
    patternDetected: 'Unknown',
    missedObservations: [],
    thinkingFeedback: 'AI analysis failed. Please check your API key and try again.',
    alternativeApproaches: [],
    similarProblems: [],
    weaknessDetected: 'Could not detect',
  };
}

/**
 * Generate a topic roadmap using Gemini AI
 */
export async function generateRoadmap(topicName) {
  const prompt = `You are a competitive programming expert. Generate a structured learning roadmap for the topic: "${topicName}".

Return a valid JSON object (no markdown, no code fences) with:
{
  "easy": [{"title": "Problem Name", "problemId": "leetcode_id", "hint": "One-line hint for the problem"}],
  "medium": [same format],
  "hard": [same format]
}

Include exactly 4 easy, 7 medium, and 4 hard problems. Use real LeetCode problems that exist. Hints should guide thinking direction without giving away the solution.`;

  const keys = getApiKeys();
  if (keys.length === 0) return null;

  for (let attempt = 0; attempt <= keys.length; attempt++) {
    try {
      const apiKey = keys[currentKeyIndex];
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text.trim();
      const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error(`Gemini Roadmap Error (Key ${currentKeyIndex + 1}/${keys.length}):`, error.message);
      
      if (error.status === 429 || error.message.includes('429') || error.message.includes('Quota') || error.message.includes('exhausted')) {
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      } else {
        break;
      }
    }
  }
  
  return null;
}
