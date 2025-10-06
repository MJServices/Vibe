import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";

export const messagesRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const messages = await prisma.message.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      // include: {
      //     fragment: true
      // }
    });

    return messages;
  }),
  create: baseProcedure 
    .input(
      z.object({
        value: z.string().min(1, { message: "Value cannot be empty" }).max(10000, "Value is too long"),
        projectId: z.string().min(1, { message: "Project ID is required" }),
      })
    )
    .mutation(async ({ input }) => {
      const createdProject = await prisma.project.create({
        data: {
          name: input.value,
        },
      });
      const createdMessage = await prisma.message.create({
        data: {
          projectId: createdProject.id,
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });
      inngest.send({
        name: "code-agent/run",
        data: { 
            value: input.value,
            projectId: input.projectId
        },
      });
      return createdMessage;
    }),
});
