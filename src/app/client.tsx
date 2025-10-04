"use client"

import { useTRPC } from "@/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"

export function Client () {
    const trpc = useTRPC()
    const {data} = useSuspenseQuery(trpc.createAI.queryOptions({text: 'MJ!'}))
    return (
        <div>
            {JSON.stringify(data)}
        </div>
    )
}