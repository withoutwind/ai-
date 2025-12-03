import { GoogleGenAI, Type } from "@google/genai";
import { ProductAnalysis, GeneratedImageResult, ViralPost, OptimizedContent, VideoRemixResult, ScriptScene } from "../types";

// Initialize the client
// API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an image based on a text prompt.
 * Uses gemini-2.5-flash-image as recommended.
 */
export const generateImageFromText = async (prompt: string): Promise<GeneratedImageResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4", // Standard social media ratio
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return {
                    mimeType: part.inlineData.mimeType || 'image/png',
                    data: part.inlineData.data
                };
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Searches/Simulates 10 viral posts based on a keyword.
 */
export const searchViralPosts = async (keyword: string): Promise<ViralPost[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ 
          text: `你是一个小红书爆款数据分析引擎。请根据关键词"${keyword}"，检索/模拟 10 个近期热门的爆款笔记。
          
          对于每个笔记，请提供：
          1. title: 爆款标题（带Emoji，吸引眼球）。
          2. author: 虚构的博主昵称（听起来像真实的KOL）。
          3. likes: 点赞数（如 "1.2w", "8k"）。
          4. visualDescription: 封面的英文画面描述（用于生成预览图）。
          5. originalContent: 一段简短的原始内容摘要（中文）。

          请返回 JSON 数组。` 
        }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              title: { type: Type.STRING },
              author: { type: Type.STRING },
