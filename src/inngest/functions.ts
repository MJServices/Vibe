import { inngest } from "./client";
import { Agent, gemini, createAgent } from "@inngest/agent-kit";
import SandBox from "@e2b/code-interpreter";
import { getSandboxUrl } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await SandBox.create("vibe-nextjs-vibe2");
      return sandbox.sandboxId;
    });

    const code_agent = createAgent({
      name: "code_agent",
      system:
        "you are an expert next js developer, you write readable and maintainable write simple Nextjs, and React snippets",
      model: gemini({ model: "gemini-2.5-pro" }),
    });
    const { output } = await code_agent.run(
      `Write the following snippets: ${event.data.value}`
    );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandboxUrl(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { output, sandboxUrl };
  }
);
