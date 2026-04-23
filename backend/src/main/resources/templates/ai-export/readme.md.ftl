# How to use this export with an AI Model

To generate the audio synthesis code from this project, follow these steps:

## 1. Upload the ZIP
Upload this entire ZIP file to your preferred AI model (Claude 3.5 Sonnet, GPT-4, Gemini 1.5 Pro, etc.).

## 2. Copy and Paste the Prompt
Use the following prompt to get the best results. Make sure to **choose your target language** before sending:

---

### Suggested Prompt

> I am attaching a ZIP file exported from an MDA-Audio design tool. 
> 
> **Instructions:**
> 1. Read `INSTRUCTIONS.md` to understand the architecture and your specific task.
> 2. Use `resolved/RESOLVED_GRAPH.json` as your primary source for the synthesis graph (it has all names already resolved).
> 3. Refer to `resolved/MAPPING_EXAMPLES.md` for target-specific code snippets.
> 
> **Task:**
> Generate a complete, runnable **[CHOOSE: Web Audio API / SuperCollider / Pure Data / Max/MSP]** program that implements the synthesizer described in the model. 
> 
> **Requirements:**
> - Strictly respect the stereo/mono flags.
> - Implement all modulation edges ("modification" type) connecting LFOs/Envelopes to parameters.
> - Use the `initialValue` from the model for all parameters.
> - Comment the code using the node names from the model.

---

## 3. What's inside this ZIP?
- `INSTRUCTIONS.md`: Technical orientation for the AI.
- `rules/`: Original DSL manuals for language context.
- `project/`: Raw JSON files of your CIM/PIM models.
- `resolved/`: 
    - `RESOLVED_GRAPH.json`: A simplified, human-readable version of your project.
    - `MAPPING_EXAMPLES.md`: Code templates for the AI.

*Project: ${projectName}*
*Generated: ${generatedAt}*
