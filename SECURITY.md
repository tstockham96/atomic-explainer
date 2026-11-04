# Security

Report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/tstockham96/atomic-explainer/security/advisories/new). Do not put API keys, private photos, provider responses containing credentials, or sensitive models in public issues.

This is an experimental local authoring tool. The studio and development previews bind to localhost. The studio checks request origin/host and uses a per-process submission token; it is not an authenticated multi-user hosting service. Do not expose it directly to the internet. Static exported explainers can be hosted separately after checking their assets and provenance.

Keep provider keys in an ignored local `.env` file or environment variables. Never give a secret a `VITE_` prefix: those variables can be bundled into browser code. `.env.example` contains names and blank values only. Credentials are not required to build or view the bundled examples. Generating new content may call paid providers using the operator's account.

The repository scans Git history for secrets on pushes and pull requests. GitHub secret scanning and push protection add a separate safeguard. If a credential is exposed, revoke or rotate it at the provider first; deleting the latest file does not remove it from Git history or other copies.

Manufacturer/reference assets under `assets.local/`, local jobs, original inputs, build outputs and credentials are excluded from Git. Review exports before sharing: an export intentionally contains its model, textures and explanatory research, even when those assets were private inputs. The sourced iPhone model and combined derivative have no established redistribution permission and are not part of the public repository.
