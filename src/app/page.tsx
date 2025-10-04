import { getQueryClient, trpc } from "@/trpc/server"
import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { Suspense } from "react"
import { Client } from "./client"

const page = () => {
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(trpc.createAI.queryOptions({text: 'MJ!'}))
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <Client />
      </Suspense>
    </HydrationBoundary>
  )
}

export default page