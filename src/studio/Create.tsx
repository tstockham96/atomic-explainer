import { useEffect, useRef, useState } from "react"
import type { StudioJob } from "./server.ts"
import "./studio.css"

type Config = { token: string; missing: string[]; provider: string }
export function Create() {
  const [config, setConfig] = useState<Config>()
  const [file, setFile] = useState<File>()
  const [preview, setPreview] = useState<string>()
  const [job, setJob] = useState<StudioJob>()
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const projectInput = useRef<HTMLInputElement>(null)
  const jobId = job?.id
  const jobStatus = job?.status
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/config", { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error("Start the local studio with npm run studio, then open localhost:4319/create.")
      return response.json()
    }).then(setConfig).catch(e => { if (!controller.signal.aborted) setError(e instanceof SyntaxError ? "Start the local studio with npm run studio, then open localhost:4319/create." : e.message) })
    const id = localStorage.getItem("explode-job")
    if (id) fetch(`/api/jobs/${id}`, { signal: controller.signal }).then(r => r.ok ? r.json() : undefined).then(value => { if (value) setJob(value) }).catch(() => undefined)
    return () => controller.abort()
  }, [])
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])
  useEffect(() => {
    if (!jobId || jobStatus !== "running") return
    const controller = new AbortController()
    const timer = setInterval(() => {
      fetch(`/api/jobs/${jobId}`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("Unable to check progress. Refresh to reconnect to your saved job."); return r.json() }).then(setJob).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    }, 2000)
    return () => { clearInterval(timer); controller.abort() }
  }, [jobId, jobStatus])
  const choose = (next?: File) => {
    if (!next) return
    if (!["image/png", "image/jpeg"].includes(next.type) || next.size > 20 * 1024 * 1024 || !next.size) { setError("Choose a PNG or JPEG photograph under 20 MB."); return }
    setFile(next); setPreview(URL.createObjectURL(next)); setError("")
  }
  const submit = async (resume = false) => {
    if (!config || (!resume && !file) || sending) return
    setSending(true); setError("")
    try {
      const response = await fetch(resume ? `/api/jobs/${job!.id}/resume` : "/api/jobs", {
        method: "POST", headers: { "X-Explode-Token": config.token, ...(!resume ? { "Content-Type": file!.type } : {}) }, body: resume ? undefined : file,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      localStorage.setItem("explode-job", result.id); setJob(result)
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed.") }
    finally { setSending(false) }
  }
  const importProject = async (project?: File) => {
    if (!project || !config || sending) return
    if (project.size > 4 * 1024 * 1024) { setError('Choose an assembly project under 4 MB.'); return }
    setSending(true); setError('')
    try {
      const response = await fetch('/api/assemblies', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Explode-Token': config.token }, body: await project.text() })
      const result = await response.json()
      if (!response.ok) throw Error(result.error)
      localStorage.setItem('explode-job', result.id); setJob(result)
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not open the project.') }
    finally { setSending(false); if (projectInput.current) projectInput.current.value = '' }
  }
  const busy = sending || job?.status === "running"
  return <main className="create-studio">
    <a className="create-wordmark" href="/">explode<span> / studio</span></a>
    <div className="create-layout">
      <section className="create-intro">
        <p className="create-kicker">EVERY OBJECT HAS A STORY</p>
        <h1>Start with<br />something <em>real.</em></h1>
        <p className="create-deck">Start an investigation into what your object is made of and how it works. Get a component plan for your agent to build into a 3D exploration.</p>
        <ol className="create-steps"><li><span>01</span> Identify the object</li><li><span>02</span> Research its construction</li><li><span>03</span> Get a plan for each component</li><li><span>04</span> Build and review with your agent</li></ol>
        <div className="create-studies" aria-label="Example studies">
          <a className="create-sample" href="/murph-study/index.html"><strong>Hamilton Murph ↗</strong><span>Authored study · fidelity review incomplete</span></a>
          <a className="create-sample" href="/iphone-study/index.html"><strong>iPhone 18 Pro ↗</strong><span>3D assembly prototype · schematic internals</span></a>
        </div>
      </section>
      <section className="create-workbench" aria-label="Create a 3D explainer">
        <button className={`create-drop ${preview ? "has-photo" : ""}`} disabled={busy} onClick={() => input.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) choose(e.dataTransfer.files[0]) }}>
          {preview ? <img src={preview} alt="Your object reference" /> : <><span className="create-cross">＋</span><strong>Drop your object here</strong><span>or choose a photograph</span></>}
          <small>{file ? file.name : "PNG or JPEG · up to 20 MB"}</small>
        </button>
        <input ref={input} type="file" accept="image/png,image/jpeg" aria-label="Object photograph" onChange={e => choose(e.target.files?.[0])} hidden />
        {config?.missing.length ? <div className="create-setup"><strong>Connect research to begin</strong><p>Add {config.missing.join(" and ")} to the local .env file, then restart the studio. Keys stay on your computer.</p></div> : null}
        <button className="create-submit" disabled={!file || !config || Boolean(config.missing.length) || busy} onClick={() => void submit()}>{busy ? "Researching your object…" : "Research this object"}<span>↗</span></button>
        <p className="create-disclosure">This creates a research and construction plan, not a finished 3D model. Research sends your photo to OpenAI and uses API credits. Your agent then builds or sources the components and checks them against the evidence.</p>
        <div className="create-import"><strong>Already working with an agent?</strong><p>Open its assembly project to build the separate 3D parts locally. No API key is needed for this step.</p><button disabled={busy || !config} onClick={() => projectInput.current?.click()}>Open agent-built project</button><input ref={projectInput} type="file" accept=".json,application/json" hidden aria-label="Assembly project" onChange={event => void importProject(event.target.files?.[0])} /></div>
        {error && <p className="create-error" role="alert">{error}</p>}
        {job && <div className="create-job" aria-live="polite"><span className="create-kicker">{job.status === "review" ? "DRAFT READY" : "YOUR EXPLORATION"}</span><h2>{job.stage}</h2>
          {job.error && <p className="create-error">{job.error}</p>}
          {job.status === "running" && <div className="create-pulse" />}
          {job.preview && <><p>Review generated shapes and component assignments before sharing. Missing internal parts are listed in the coverage report.</p><a href={job.preview}>Open the 3D draft ↗</a><a href={job.componentReview ?? `/jobs/${job.id}/coverage.json`} target="_blank" rel="noreferrer">Component review ↗</a></>}
          {job.plan && <><p>Give this plan to your coding agent with the Explode skill. It contains component references, modeling tasks and individual quality reviews. No geometry has been purchased or generated.</p><a href={job.plan} target="_blank" rel="noreferrer">Open construction plan ↗</a><a href={`/jobs/${job.id}/research.json`} target="_blank" rel="noreferrer">Open research ↗</a></>}
          {(job.status === "failed" || job.status === "interrupted") && <button disabled={busy || Boolean(config?.missing.length)} onClick={() => void submit(true)}>Resume saved job</button>}
          {job.log.length > 0 && <details><summary>Research progress</summary><ol>{job.log.map((line, i) => <li key={i}>{line}</li>)}</ol></details>}
        </div>}
      </section>
    </div>
    <footer className="create-footer">Open-source exploration. Generated geometry is a draft, not a verified engineering model.</footer>
  </main>
}
