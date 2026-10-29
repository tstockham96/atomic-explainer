import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource/fraunces/latin-400.css"
import "@fontsource/fraunces/latin-500.css"
import "@fontsource/fraunces/latin-500-italic.css"
import "@fontsource/fraunces/latin-600.css"
import "@fontsource/outfit/latin-300.css"
import "@fontsource/outfit/latin-400.css"
import "@fontsource/outfit/latin-500.css"
import "@fontsource/ibm-plex-mono/latin-400.css"
import "@fontsource/ibm-plex-mono/latin-500.css"
import App from "./App.tsx"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
