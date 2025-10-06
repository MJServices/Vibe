import { inngest } from "./client";
import {
  gemini,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
} from "@inngest/agent-kit";
import SandBox from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z, { string } from "zod";
import { stderr, stdout } from "process";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

interface AgentState {
  files: { [path: string]: string };
  summary: string;
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await SandBox.create("vibe-nextjs-vibe2");
      return sandbox.sandboxId;
    });

    const code_agent = createAgent<AgentState>({
      name: "code_agent",
      description: "An expert agent that can write and modify code",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  stdin: true,
                  onStdout: (data) => {
                    buffers.stdout += data.toString();
                  },
                  onStderr: (data) => {
                    buffers.stderr += data.toString();
                  },
                });

                return {
                  success: true,
                  exitCode: result.exitCode,
                  stdout: result.stdout,
                  stderr: result.stderr,
                };
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.array(
            z.object({
              path: z.string(),
              content: z.string(),
            })
          ),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (e) {
                  return `Error: ${e}`;
                }
              }
            );
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents: { path: string; content: string }[] = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return `Error: ${error}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssestantMessageText =
            await lastAssistantTextMessageContent(result);

          if (lastAssestantMessageText && network) {
            if (lastAssestantMessageText?.includes("<task_summary>")) {
              network.state.data.summary = lastAssestantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [code_agent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary as string | undefined;
        if (summary) {
          return;
        }
        return code_agent;
      },
    });

    const result = await network.run(event.data.value);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: "I'm sorry, but I was unable to complete your request.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: "Fragment",
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary as string | undefined,
    };
  }
);
