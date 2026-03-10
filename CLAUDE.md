# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OpenClaw Uninstaller** (`@steven-y/openclaw-uninstaller`) is a cross-platform tool to completely uninstall OpenClaw from macOS, Windows, and Linux systems. It supports two execution methods: NPX and Bash one-liner.

## Project Structure

```
/
├── package.json           # NPM package configuration
├── src/
│   ├── index.js           # Main entry point (npx execution)
│   ├── uninstaller.js     # Core uninstaller logic
│   └── config.json        # Uninstallation paths configuration
├── scripts/
│   └── uninstall.sh       # Bash script (curl | sh execution)
├── .github/workflows/
│   └── publish.yml        # NPM publish & GitHub release workflow
├── README.md
├── CLAUDE.md
└── LICENSE
```

## Commands

```bash
# Run locally
node src/index.js

# Make shell script executable
chmod +x scripts/uninstall.sh

# Run shell script
./scripts/uninstall.sh
```

## Architecture

### Two Execution Paths

1. **NPM/NPX Path**: `src/index.js` → `src/uninstaller.js` (Node.js)
2. **Bash Path**: `scripts/uninstall.sh` (Portable shell script)

Both paths read the same configuration in `src/config.json` (NPM) or embed the same paths (Bash).

### Configuration

All uninstallation paths are defined in `src/config.json`. The configuration is organized by platform:

```json
{
    "macos": [...],
    "windows": [...],
    "linux": [...]
}
```

Each entry supports:
- `path`: Path with environment variable expansion (`$HOME`, `$env:APPDATA`, etc.)
- `operation`: Currently only "delete"
- `description`: Human-readable description
- `requireSudo` / `requireAdmin`: Flag for privileged operations

### Adding New Paths

1. Edit `src/config.json`
2. Update the corresponding section in `scripts/uninstall.sh` (UNINSTALL_MACOS, UNINSTALL_LINUX variables)
3. Test on the target platform

## Code Style

- **JavaScript**: 4-space indent, semicolons, ES6+ syntax, Node.js 20+
- **Shell**: POSIX-compliant sh, compatible with bash/zsh/fish

## Publishing

The project uses GitHub Actions for CI/CD:

1. Create a new tag: `git tag v1.0.0 && git push --tags`
2. The workflow will:
   - Publish to NPM registry as `@steven-y/openclaw-uninstaller`
   - Create a GitHub Release
   - Update README with version info

Required secrets: `NPM_TOKEN`
