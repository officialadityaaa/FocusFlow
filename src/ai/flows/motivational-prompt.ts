// Implemented motivational prompt flow.
'use server';

/**
 * @fileOverview A motivational prompt AI agent.
 *
 * - generateMotivationalPrompt - A function that generates motivational prompts.
 * - MotivationalPromptInput - The input type for the generateMotivationalPrompt function.
 * - MotivationalPromptOutput - The return type for the generateMotivationalPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MotivationalPromptInputSchema = z.object({
  sessionDuration: z
    .number()
    .describe('The duration of the focus session in minutes.'),
  timeElapsed: z
    .number()
    .describe('The time elapsed in the focus session in minutes.'),
});
export type MotivationalPromptInput = z.infer<typeof MotivationalPromptInputSchema>;

const MotivationalPromptOutputSchema = z.object({
  prompt: z.string().describe('The motivational prompt to display to the user.'),
});
export type MotivationalPromptOutput = z.infer<typeof MotivationalPromptOutputSchema>;

export async function generateMotivationalPrompt(input: MotivationalPromptInput): Promise<MotivationalPromptOutput> {
  return motivationalPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'motivationalPromptPrompt',
  input: {schema: MotivationalPromptInputSchema},
  output: {schema: MotivationalPromptOutputSchema},
  prompt: `You are a motivational coach. Generate a short motivational prompt to encourage the user to stay focused during their focus session.

Session Duration: {{{sessionDuration}}} minutes
Time Elapsed: {{{timeElapsed}}} minutes`,
});

const motivationalPromptFlow = ai.defineFlow(
  {
    name: 'motivationalPromptFlow',
    inputSchema: MotivationalPromptInputSchema,
    outputSchema: MotivationalPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
