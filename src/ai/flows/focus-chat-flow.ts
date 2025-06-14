
'use server';
/**
 * @fileOverview A chat AI agent for focus sessions.
 *
 * - generateFocusChatResponse - A function that handles chat interactions.
 * - FocusChatInput - The input type for the generateFocusChatResponse function.
 * - FocusChatOutput - The return type for the generateFocusChatResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({text: z.string()})),
  isUser: z.boolean().optional().describe("True if the message is from the user."),
  isModel: z.boolean().optional().describe("True if the message is from the AI model."),
});

const FocusChatInputSchema = z.object({
  userMessage: z.string().describe('The latest message from the user.'),
  history: z.array(ChatMessageSchema).optional().describe('The conversation history up to this point.'),
});
export type FocusChatInput = z.infer<typeof FocusChatInputSchema>;

const FocusChatOutputSchema = z.object({
  botResponse: z.string().describe('The AI\'s response to the user\'s message.'),
});
export type FocusChatOutput = z.infer<typeof FocusChatOutputSchema>;

export async function generateFocusChatResponse(input: FocusChatInput): Promise<FocusChatOutput> {
  return focusChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'focusChatPrompt',
  input: {schema: FocusChatInputSchema},
  output: {schema: FocusChatOutputSchema},
  prompt: `You are a helpful and concise assistant. The user is currently in a FocusFlow session and might ask you questions or for quick help. Keep your responses brief and to the point.

Conversation History:
{{#if history}}
{{#each history}}
{{#if isUser}}User: {{#each parts}}{{text}}{{/each}}{{/if}}
{{#if isModel}}Assistant: {{#each parts}}{{text}}{{/each}}{{/if}}
{{/each}}
{{else}}
No previous messages.
{{/if}}

User: {{{userMessage}}}
Assistant:`,
});

const focusChatFlow = ai.defineFlow(
  {
    name: 'focusChatFlow',
    inputSchema: FocusChatInputSchema,
    outputSchema: FocusChatOutputSchema,
  },
  async (input: FocusChatInput) => {
    const processedHistory = (input.history || []).map(msg => ({
      ...msg,
      isUser: msg.role === 'user',
      isModel: msg.role === 'model',
    }));

    const {output} = await prompt({
        userMessage: input.userMessage,
        history: processedHistory,
    });
    if (!output) {
        throw new Error("No output from AI model for chat.")
    }
    return { botResponse: output.botResponse };
  }
);

