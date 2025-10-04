import { inngest } from "./client";
import { Agent, gemini, createAgent } from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const code_agent = createAgent({
      name: "code_agent",
      system: "you are an expert next js developer, you write readable and maintainable write simple Nextjs, and React snippets",
      model: gemini({ model: "gemini-2.5-pro" }),
    });
    const {output} = await code_agent.run(
      `Write the following snippets: ${event.data.value}`
    );
    console.log("output", output[0]);

    return { output };
  }
);
