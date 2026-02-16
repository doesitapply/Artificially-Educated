export const safeParseJSON = (text: string) => {
  if (!text) return null;
  // Strip markdown blocks if present
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  try {
      return JSON.parse(cleaned);
  } catch (e) {
      console.warn("JSON Parse Warning: Attempting recovery on truncated response...");
      const lastChar = cleaned.slice(-1);
      
      // Attempt 1: Simple closing of brackets
      const closers = ['"', '}', ']', '"}', '"]', ']}', '"}}', '"}]'];
      for (const closer of closers) {
          try { return JSON.parse(cleaned + closer); } catch (err) { continue; }
      }
      
      // Attempt 2: Finding the last valid object/array break
      const lastComma = cleaned.lastIndexOf(',');
      const lastCloseBrace = cleaned.lastIndexOf('}');
      const lastCloseBracket = cleaned.lastIndexOf(']');
      const cutPoint = Math.max(lastComma, lastCloseBrace, lastCloseBracket);
      
      if (cutPoint > 0) {
          const salvage = cleaned.substring(0, cutPoint + 1);
          for (const closer of closers) {
              try {
                  const cleanSalvage = salvage.trim().endsWith(',') ? salvage.trim().slice(0, -1) : salvage;
                  return JSON.parse(cleanSalvage + closer);
              } catch (err) { continue; }
          }
      }
      
      console.error("JSON Recovery Failed completely.", e);
      // Return partial object if possible or just re-throw
      throw e;
  }
};

export const generateWithRetry = async (model: any, params: any, retries = 3): Promise<any> => {
  try {
      return await model.generateContent(params);
  } catch (error: any) {
      const isRetryable = error?.status === 503 || error?.status === 500 || 
                          (error?.message && (error.message.includes('503') || error.message.includes('500') || error.message.includes('CANCELLED')));
      if (retries > 0 && isRetryable) {
          await new Promise(r => setTimeout(r, 2000 * (4 - retries))); 
          return generateWithRetry(model, params, retries - 1);
      }
      throw error;
  }
};