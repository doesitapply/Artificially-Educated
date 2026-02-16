import { GoogleGenAI } from "@google/genai";
import { safeParseJSON } from './utils';

// Configuration
export interface AIRequest {
    systemPrompt: string;
    userPrompt: string;
    schema?: any;
    model?: string; // Optional override
    temperature?: number;
    jsonMode?: boolean;
}

class UnifiedAIClient {
    private static instance: UnifiedAIClient;
    private geminiKey: string = process.env.API_KEY || '';
    private openaiKey: string = '';
    private provider: 'gemini' | 'openai' = 'gemini';

    private constructor() {}

    public static getInstance(): UnifiedAIClient {
        if (!UnifiedAIClient.instance) {
            UnifiedAIClient.instance = new UnifiedAIClient();
        }
        return UnifiedAIClient.instance;
    }

    public setCredentials(openaiKey?: string, provider?: 'gemini' | 'openai') {
        if (openaiKey) this.openaiKey = openaiKey;
        if (provider) this.provider = provider;
    }

    public getProvider() {
        return this.provider;
    }

    public async generate(request: AIRequest): Promise<any> {
        try {
            if (this.provider === 'openai' && this.openaiKey) {
                return await this.generateOpenAI(request);
            } else {
                return await this.generateGemini(request);
            }
        } catch (error) {
            console.error(`${this.provider.toUpperCase()} Generation Failed. Attempting Fallback...`, error);
            
            // Auto-Fallback Logic
            if (this.provider === 'gemini' && this.openaiKey) {
                console.log("Switching to OpenAI for fallback...");
                return await this.generateOpenAI(request);
            } else if (this.provider === 'openai') {
                console.log("Switching to Gemini for fallback...");
                return await this.generateGemini(request);
            }
            throw error;
        }
    }

    /**
     * The "Self-Healing" JSON Wrapper.
     * If parsing fails, it asks a cheap model to fix the syntax.
     */
    public async generateJSON(request: AIRequest): Promise<any> {
        const rawText = await this.generate({ ...request, jsonMode: true });
        
        try {
            return safeParseJSON(rawText);
        } catch (e: any) {
            console.warn("JSON Parse Failed. Initiating Self-Healing Repair Sequence...", e);
            
            // REPAIR LOOP
            const repairPrompt = `
                You are a JSON Syntax Repair Bot.
                The following JSON is malformed or truncated.
                ERROR: ${e.message}
                
                RAW BROKEN JSON:
                ${rawText}
                
                TASK: Return ONLY valid, corrected JSON. Do not explain. Close any open arrays/objects.
            `;
            
            // Use a fast model for repair
            try {
                const repairedText = await this.generate({
                    systemPrompt: "You are a rigid JSON fixer. Output only JSON.",
                    userPrompt: repairPrompt,
                    model: this.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3-flash-preview',
                    jsonMode: true
                });
                return safeParseJSON(repairedText);
            } catch (repairError) {
                console.error("Self-Healing Failed.", repairError);
                throw new Error("Critical Forensic Analysis Failure: Data structure could not be recovered.");
            }
        }
    }

    private async generateGemini(request: AIRequest): Promise<string> {
        const ai = new GoogleGenAI({ apiKey: this.geminiKey });
        
        // Map abstract models to Gemini specific
        const modelName = request.model?.includes('flash') ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';

        const config: any = {
            systemInstruction: request.systemPrompt,
            maxOutputTokens: 65536, // Maximize window
        };

        // If JSON schema is provided, use it for structured output enforcement
        if (request.jsonMode) {
             config.responseMimeType = "application/json";
             if (request.schema) {
                 config.responseSchema = request.schema;
             }
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
            config
        });

        return response.text || '';
    }

    private async generateOpenAI(request: AIRequest): Promise<string> {
        if (!this.openaiKey) throw new Error("OpenAI Key not configured");

        const modelName = request.model === 'gemini-3-flash-preview' ? 'gpt-4o-mini' : 'gpt-4o';

        const messages = [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt }
        ];

        const payload: any = {
            model: modelName,
            messages: messages,
            temperature: request.temperature || 0.7,
        };

        if (request.jsonMode) {
            payload.response_format = { type: "json_object" };
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.openaiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`OpenAI API Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

export const aiClient = UnifiedAIClient.getInstance();