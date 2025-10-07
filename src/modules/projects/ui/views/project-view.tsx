"use client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React, { Suspense } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import MessagesContainer from "../components/messages-container";

interface Props {
  projectId: string;
}

const ProjectView = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getOne.queryOptions({
      id: projectId,
    })
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={35}
        minSize={20}
        className="flex flex-col min-h-0"
      >
        <Suspense fallback={<div>Loading messages...</div>}>
          <MessagesContainer projectId={projectId} />
        </Suspense>
      </ResizablePanel>
      <ResizableHandle withHandle className="min-h-screen" />
      <ResizablePanel defaultSize={65} minSize={50}>
        <p>TODO LIST</p>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ProjectView;
