# Zap CLI

CLI companion for [Zap](https://github.com/hunter-arton/zap) credential manager - inject secrets from development sessions as environment variables.

## What is Zap?

Zap is a secure credential manager with a desktop app that helps you manage API keys, tokens, and other secrets. The CLI allows you to inject these secrets directly into your development environment without exposing them in your codebase.

## Installation

```bash
pip install zapc
```

## Quick Start

### 1. Create a Session (Desktop App Required)

```bash
# Open Zap desktop app to create a new session
zap start
```

In the Zap desktop app:
- Go to **Dev Mode**
- Create a new session with your secrets
- The session file is automatically created

### 2. List Available Sessions

```bash
zap list
```

### 3. Set Session for Your Project

```bash
cd your-project/
zap use my-dev-session
```

This creates a `zap.json` file in your project directory.

### 4. Run Commands with Injected Secrets

```bash
# All secrets are injected as environment variables
zap run -- npm start
zap run -- python app.py
zap run -- cargo run
```

## Commands

### `zap start`
Opens the Zap desktop app to create a new session.

### `zap list [SESSION_NAME]`
Lists all available sessions or secrets in a specific session.

```bash
# List all sessions
zap list

# List secrets in a specific session
zap list my-dev-session
```

### `zap use <SESSION_NAME>`
Sets the current session for your project.

```bash
zap use my-dev-session
```

### `zap run -- <COMMAND>`
Runs a command with secrets injected as environment variables.

```bash
# Run with current session (from zap.json)
zap run -- npm start

# Run with specific session (override)
zap run --session other-session -- python app.py

# Show loaded environment variables (verbose)
zap run -v -- npm test

# Add prefix to environment variable names
zap run --prefix MY_APP -- npm start
```

### `zap status`
Shows the current session status for your project.

```bash
zap status
```

### `zap stop <SESSION_NAME>`
Stops a specific session (deletes the session file).

```bash
zap stop my-dev-session
```

### `zap clear`
Clears all active sessions.

```bash
zap clear
```

## How It Works

1. **Desktop App** creates encrypted session files in:
   - macOS: `~/Library/Application Support/com.devtool.zap/sessions/`
   - Windows: `%APPDATA%/com.devtool.zap/sessions/`
   - Linux: `~/.config/com.devtool.zap/sessions/`

2. **CLI** reads these session files and decrypts secrets using AES-GCM encryption

3. **Secrets are converted to environment variables**:
   - `Database Password` → `DATABASE_PASSWORD`
   - `api-key` → `API_KEY`
   - `my.secret.value` → `MY_SECRET_VALUE`

4. **Your commands run** with these environment variables automatically available

## Security

- ✅ Secrets are encrypted using AES-GCM with 256-bit keys
- ✅ Session keys are unique per session
- ✅ No secrets are stored in plaintext
- ✅ Environment variables only exist during command execution
- ✅ No internet connection required

## Requirements

- Python 3.8 or higher
- Zap desktop app (for creating sessions)

## Example Workflow

```bash
# 1. Create session with your API keys in Zap desktop app
zap start

# 2. In your project directory, set the session
cd my-web-app/
zap use production-keys

# 3. Run your development server with secrets loaded
zap run -- npm run dev

# 4. Check what's loaded
zap status

# 5. When done, stop the session
zap stop production-keys
```

## License

MIT

## Links

- [Zap Desktop App](https://github.com/hunter-arton/zap)
- [Report Issues](https://github.com/hunter-arton/zap/issues)
- [Documentation](https://github.com/hunter-arton/zap#readme)
