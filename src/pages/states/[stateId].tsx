import { useRouter } from "next/router"
import StateMap from "@/components/StateMap"
import { stateIdMapping } from "@/data/statesMap"

export default function StateDetailPage() {
  const router = useRouter()
  const { stateId } = router.query

  // If the route is not ready or invalid
  if (!stateId || typeof stateId !== "string") {
    return <p>404: State not found</p>
  }

  // Map the simplified ID to the full ID
  const fullStateId = stateIdMapping[stateId]
  if (!fullStateId) {
    return <p>404: State not found</p>
  }

  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold mb-4">State: {stateId.toUpperCase()}</h1>
      <StateMap stateId={stateId} topoUrl="/india-states-topo.json" />
    </section>
  )
}
