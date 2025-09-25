
import { GoogleGenAI, Type } from "@google/genai";
import { Annotation } from '../types';
import { imageToBase64 } from "../utils/imageUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const pointSchema = {
  type: Type.OBJECT,
  properties: {
    x: { type: Type.NUMBER, description: "Normalized X coordinate (0.0 to 1.0)" },
    y: { type: Type.NUMBER, description: "Normalized Y coordinate (0.0 to 1.0)" },
  },
  required: ['x', 'y'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    annotations: {
      type: Type.ARRAY,
      description: "An array of annotation objects.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: 'The original full label string from the user input, e.g., "Overall Height: 34.5"' },
          p1: { ...pointSchema, description: "The start point of the main dimension line." },
          p2: { ...pointSchema, description: "The end point of the main dimension line." },
          labelPos: { ...pointSchema, description: "The center position for the dimension text label." },
          ext1: { ...pointSchema, description: "The start point of the first extension line (on the product)." },
          ext2: { ...pointSchema, description: "The start point of the second extension line (on the product)." },
        },
        required: ['label', 'p1', 'p2', 'labelPos', 'ext1', 'ext2'],
      },
    },
  },
  required: ['annotations'],
};

export const generateAnnotationsWithAI = async (
    image: HTMLImageElement, 
    dimensionsText: string, 
    canvasWidth: number, 
    canvasHeight: number
): Promise<Annotation[]> => {
  const { data: base64ImageData, mimeType } = imageToBase64(image);

  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType,
    },
  };

  const textPrompt = `You are an expert technical illustrator for e-commerce furniture. Your task is to analyze the provided product image and a list of dimensions to create a clean, professional dimension drawing.

For each dimension in the list, you must provide coordinates for a dimension line and its two corresponding extension lines.
- **Extension Lines:** These start on the product itself (at the feature being measured) and extend outwards, perpendicular to the dimension line.
- **Dimension Line:** This line connects the ends of the two extension lines. It runs parallel to the edge being measured and has the text label.

**RULES:**
1.  All coordinates must be normalized from 0.0 to 1.0 (top-left is 0,0, bottom-right is 1,1).
2.  Place annotations *around* the object, not on top of it.
3.  Arrange lines neatly to avoid clutter and crossing. Place larger, overall dimensions on the outside.
4.  For 3/4 views, depth and width lines should be drawn at a slight angle to match the product's perspective.
5.  The 'label' in your JSON output MUST EXACTLY MATCH the original line of text from the user's input.

**User's Dimension List:**
---
${dimensionsText}
---

Generate a JSON object containing an 'annotations' array based on the image and the list provided.
`;

  const textPart = { text: textPrompt };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });
  
  const jsonText = response.text.trim();
  const result = JSON.parse(jsonText);

  if (!result.annotations || !Array.isArray(result.annotations)) {
      throw new Error("AI response did not contain a valid 'annotations' array.");
  }
  
  return result.annotations.map((ann: any, index: number) => {
    const [label, value] = ann.label.split(/:(.*)/s).map((s: string) => s.trim());

    if (!value) {
        console.warn(`Could not parse value from label: "${ann.label}"`);
    }

    return {
      id: `ann-${Date.now()}-${index}`,
      label: ann.label,
      valueText: value || '',
      p1: { x: ann.p1.x * canvasWidth, y: ann.p1.y * canvasHeight },
      p2: { x: ann.p2.x * canvasWidth, y: ann.p2.y * canvasHeight },
      labelPos: { x: ann.labelPos.x * canvasWidth, y: ann.labelPos.y * canvasHeight },
      ext1: { x: ann.ext1.x * canvasWidth, y: ann.ext1.y * canvasHeight },
      ext2: { x: ann.ext2.x * canvasWidth, y: ann.ext2.y * canvasHeight },
    };
  });
};
