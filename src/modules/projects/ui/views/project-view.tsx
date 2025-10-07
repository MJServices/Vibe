"use client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React, { Suspense, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import MessagesContainer from "../components/messages-container";
import { Fragment } from "@/generated/prisma";
import ProjectHeader from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";

interface Props {
  projectId: string;
}

const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={35}
        minSize={20}
        className="flex flex-col min-h-0"
      >
        <Suspense fallback={<p>Loading project...</p>}>
          <ProjectHeader projectId={projectId} />
        </Suspense>
        <Suspense fallback={<div>Loading messages...</div>}>
          <MessagesContainer
            projectId={projectId}
            activeFragment={activeFragment}
            setActiveFragment={setActiveFragment}
          />
        </Suspense>
      </ResizablePanel>
      <ResizableHandle withHandle className="min-h-screen" />
      <ResizablePanel defaultSize={65} minSize={50}>
        {!!activeFragment && <FragmentWeb data={activeFragment}/>}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ProjectView;
