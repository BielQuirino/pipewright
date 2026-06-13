# pipewright

## 0.1.1

### Patch Changes

- Fix CLI not executing on Windows (missing shebang), runtime crash on any prompt (`@inquirer/prompts` missing from dependencies), broken CJS export for library consumers (`import.meta` shim + dual-format build), and cosmetic overwrite label mismatch.
