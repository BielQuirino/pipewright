# Pipewright

## 0.1.3

### Patch Changes

- Fix --no-pipeline flag being silently ignored: Commander registers it as `pipeline: false` but the code was checking `noPipeline` (always undefined).

## 0.1.2

### Patch Changes

- Upgrade @inquirer/prompts from 5.5.0 to 8.5.2 to fix crash on Node.js 24 (external-editor CJS/ESM incompatibility).

## 0.1.1

### Patch Changes

- Fix CLI not executing on Windows (missing shebang), runtime crash on any prompt (`@inquirer/prompts` missing from dependencies), broken CJS export for library consumers (`import.meta` shim + dual-format build), and cosmetic overwrite label mismatch.
