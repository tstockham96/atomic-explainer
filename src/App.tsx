import { useEffect, useState } from "react"
import type { ExplodeSpec } from "./spec/schema.ts"
import { Teardown } from "./viewer/Teardown.tsx"
import { loadSpec } from "./viewer/loadSpec.ts"
import { Create } from "./studio/Create.tsx"

type State =
  | { status: "loading" }
  | { status: "ready"; spec: ExplodeSpec }
  | { status: "error"; message: string }

export default function App() {
  if (window.location.pathname === "/create") return <Create />
  return <ViewerApp />
}

function ViewerApp() {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    loadSpec()
      .then((spec) => {
        if (!cancelled) setState({ status: "ready", spec })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "The teardown spec could not be read.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <p className="font-mono text-xs tracking-[0.22em] text-brass uppercase">Opening the case</p>
      </main>
    )
  }

  if (state.status === "error") {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md">
          <p className="font-mono text-xs tracking-[0.22em] text-brass uppercase">Spec failed</p>
          <h1 className="mt-3 font-serif text-4xl text-paper">The teardown could not open.</h1>
          <p className="mt-4 text-muted">{state.message}</p>
        </div>
      </main>
    )
  }

  return <Teardown spec={state.spec} />
}
