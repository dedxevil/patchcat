import { GoogleGenAI, Type } from "@google/genai";
import { ApiRequest, ApiResponse, AiSuggestion } from '../types';

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

export const analyzeApiCall = async (
    request: ApiRequest, 
    response: ApiResponse, 
    history: ApiRequest[],
    apiKey: string
): Promise<AiSuggestion[] | null> => {
    if (!apiKey || apiKey.trim() === '') {
        console.error("Gemini API key is missing. Cannot perform analysis.");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const historySummary = history.slice(0, 5).map(h => `- ${h.method} ${h.name}`).join('\n');

        const prompt = `

          🐱 Meow! Please answer like a quirky cat (add "meow", "purr", or "wuss" where appropriate).

            Analyze the following API interaction.
            Request:
            - Method: ${request.method}
            - URL: ${request.url}
            - Body: ${serializeRequestBody(request.body)}

            Response:
            - Status: ${response.status}
            - Body: ${JSON.stringify(response.data, null, 2)}

            Based on this, provide up to 3 distinct and actionable suggestions for the next test cases.
            Consider edge cases, error handling, different data inputs, or security checks.
            Avoid suggesting tests that are too similar to these recent ones:
            ${historySummary}
            
            Return a JSON array of suggestions. Each header and query param object must have an 'id' property.
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