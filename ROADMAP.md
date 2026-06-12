# Roadmap

## Phase 1 — MVP (current)

- [x] `pipewright init` — full project scaffold (NestJS, Vue 3)
- [x] `pipewright add pipeline` — add CI/CD to existing project
- [x] `pipewright add dockerfile` — add optimized multi-stage Dockerfile
- [x] Providers: GitHub Actions, Azure DevOps, GitLab CI
- [x] Global flags: `--yes`, `--dry-run`, `--force`, `--no-spinner`, `--cwd`
- [x] GitHub Actions CI for the project itself (matrix: 3 OSes × 3 Node versions)
- [x] Changesets-based release pipeline

## Phase 2 — Plugin System

- [ ] `definePlugin()` API — allows community to register new providers and generators without forking
- [ ] Auto-discovery of `pipewright-plugin-*` packages in `node_modules`
- [ ] `pipewright.config.ts` — explicit plugin registration
- [ ] `pipewright plugins list` / `add` / `remove` commands
- [ ] Lifecycle hooks: `onResolveContext`, `onBeforeWrite`, `onAfterWrite`
- [ ] Stable public types exported from `pipewright/plugin`

## Phase 3 — Community Growth

- [ ] More providers: CircleCI, Jenkins, Bitbucket Pipelines
- [ ] More generators: Next.js, Fastify, SvelteKit, Express
- [ ] `pipewright doctor` — validate and lint existing CI/CD pipelines
- [ ] `pipewright update` — bump pinned action versions and Docker image tags
- [ ] Preset/recipe sharing: `pipewright init --preset <name|url>`
- [ ] Docs site (VitePress)
- [ ] Template gallery
- [ ] Telemetry opt-in (anonymous usage stats)

---

Have a feature idea? [Open a feature request](https://github.com/BielQuirino/pipewright/issues/new?template=feature_request.yml).
