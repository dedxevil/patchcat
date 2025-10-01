import { GoogleGenAI, Type } from "@google/genai";
import { ApiRequest, ApiResponse, AiSuggestion, Protocol } from '../types';

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        suggestionText: {
          type: Type.STRING,
          description: 'A short, button-friendly text for the suggestion, e.g., "Test with an invalid ID".',
        },
        apiRequest: {
          type: Type.OBJECT,
          description: 'A fully configured API request object for the new test.',
          properties: {
            name: { type: Type.STRING, description: 'A descriptive name for the new test request.' },
            protocol: { type: Type.STRING },
            url: { type: Type.STRING },
            method: { type: Type.STRING },
            headers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT, properties: { id: { type: Type.STRING }, key: { type: Type.STRING }, value: { type: Type.STRING }, enabled: { type: Type.BOOLEAN } }
              }
            },
            queryParams: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT, properties: { id: { type: Type.STRING }, key: { type: Type.STRING }, value: { type: Type.STRING }, enabled: { type: Type.BOOLEAN } }
              }
            },
            body: { type: Type.STRING, description: 'The request body, as a string (e.g., JSON stringified).' },
          }
        }
      }
    }
};

const serializeRequestBody = (body: ApiRequest['body']): string => {
    switch (body.type) {
        case 'raw':
            return body.content || 'None';
        case 'form-data':
            if (!body.fields || body.fields.length === 0) return 'Empty Form Data';
            const fields = body.fields.map(f => `${f.key}: ${f.type === 'text' ? f.value : '[file]'}`).join(', ');
            return `Form Data: { ${fields} }`;
        case 'binary':
            return 'Binary file data';
        default:
            return 'None';
    }
}

const LARGE_RESPONSE_THRESHOLD_BYTES = 100 * 1024; // 100KB

export const analyzeApiCall = async (
    request: ApiRequest,
    response: ApiResponse,
    history: ApiRequest[],
    apiKey: string,
    gqlVariables?: string,
    usedVariables?: Record<string, string>
): Promise<AiSuggestion[] | null | 'SKIPPED_LARGE'> => {
    if (!apiKey || apiKey.trim() === '') {
        console.error("Gemini API key is missing. Cannot perform analysis.");
        return null;
    }

    if (response.size > LARGE_RESPONSE_THRESHOLD_BYTES) {
        console.log(`Skipping Gemini analysis for large response of size ${response.size} bytes.`);
        return 'SKIPPED_LARGE';
    }

    const ai = new GoogleGenAI({ apiKey });

    const originalRequest = history.find(h => h.id === request.id) || request;
    const urlWithPlaceholders = originalRequest.url;

    try {
        const historySummary = history.slice(0, 5).map(h => `- ${h.method} ${h.name}`).join('\n');

        let requestDetails = `
            - Protocol: ${request.protocol}
            - Method: ${request.method}
            - URL (Resolved): ${request.url} 
            - Body: ${serializeRequestBody(request.body)}
        `;
        
        if (request.protocol === Protocol.GraphQL && gqlVariables) {
            requestDetails += `\n            - Variables: ${gqlVariables}`;
        }

        const prompt = `
            Analyze the following API interaction.
            Request:
            ${requestDetails}

            Response:
            - Status: ${response.status}
            - Body: ${JSON.stringify(response.data, null, 2)}

            Based on this, provide up to 3 distinct and actionable suggestions for the next test cases.
            Each suggestion's apiRequest object MUST use the same protocol as the original request (${request.protocol}).
            
            IMPORTANT: When generating the 'url' for a new 'apiRequest', you MUST use the original variable placeholders, NOT the resolved values. The original URL with placeholders was: "${urlWithPlaceholders}". For example, if the resolved URL was "https://api.example.com/users/123" and the original was "[host]/users/123", a new suggestion for an invalid user should use the URL "[host]/users/invalid-id".
            
            For GraphQL suggestions, the 'body' field in the apiRequest should be the GraphQL query/mutation string. For REST, it should be a JSON string if applicable.
            Consider edge cases, error handling, different data inputs, or security checks.
            Avoid suggesting tests that are too similar to these recent ones:
            ${historySummary}
            
            Return a JSON array of suggestions. Each header and query param object must have an 'id' property. The 'apiRequest' object MUST include the 'protocol' property.
        `;
        
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
        });
        
        const jsonText = result.text.trim();
        const suggestions: AiSuggestion[] = JSON.parse(jsonText);
        return suggestions;

    } catch (error) {
        console.error("Error analyzing API call with Gemini:", error);
        return null;
    }
};

export const getAiChatResponse = async (
    prompt: string,
    apiKey: string
): Promise<string | null> => {
     if (!apiKey || apiKey.trim() === '') {
        throw new Error("Gemini API key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = "You are Patchcat AI, a clever cat who is an expert assistant for API testing. Your personality is playful and helpful. You help users debug APIs, write tests, and explain concepts related to REST, GraphQL, and WebSockets. Your responses must be concise and to the point. Use cat-puns sparingly. Use markdown for formatting.";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error getting chat response from Gemini:", error);
        throw error;
    }
}