"use client"

import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

const page = () => {
  const trpc = useTRPC()
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: (data) => {
      toast.success("Background job Started")
    }
  }))
 
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Button disabled={invoke.isPending} onClick={()=>invoke.mutate({text: "MJ"})}>
        Invoke Background job
      </Button>
    </div>
  )
}

export default page