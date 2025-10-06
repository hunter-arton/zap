# Zap CLI

> CLI companion for Zap credential manager - inject secrets from development sessions as environment variables.

## What is Zap CLI?

Zap CLI works with the [Zap Desktop App](https://github.com/hunter-arton/zap) to inject your API keys, tokens, and secrets directly into your development environment - no more `.env` files cluttering your projects!

---

## 📦 Installation

### Prerequisites

- **Python 3.8 or higher** required
- **Zap Desktop App** (to create sessions)

Check if you have Python:
```bash
python3 --version
```

If not installed, download from: https://www.python.org/downloads/

---

### Step 1: Install Zap CLI

#### **macOS & Linux:**
```bash
pip3 install zapc
```

#### **Windows:**
```bash
pip install zapc
```

---

### Step 2: Set Up PATH (macOS/Linux Only)

After installation, you may see a warning like:
```
WARNING: The script zap is installed in '/Users/yourname/Library/Python/3.x/bin' which is not on PATH.
```

**This is normal!** You need to add Python's bin directory to your PATH.

#### **For macOS (zsh - default on new Macs):**

```bash
# Add to PATH
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc

# Reload your shell
source ~/.zshrc
```

**Note:** Replace `3.9` with your Python version if different. Check with `python3 --version`

#### **For macOS (bash - older Macs):**

```bash
# Add to PATH
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.bash_profile

# Reload your shell
source ~/.bash_profile
```

#### **For Linux:**

```bash
# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# Reload your shell
source ~/.bashrc
```

#### **For Windows:**

Windows usually adds to PATH automatically. If `zap` doesn't work:

1. Search for "Environment Variables" in Start Menu
2. Click "Environment Variables"
3. Under "User variables", find "Path"
4. Click "Edit"
5. Click "New"
6. Add: `C:\Users\YourName\AppData\Roaming\Python\Python3x\Scripts`
7. Click "OK" on all dialogs
8. Restart your terminal

---

### Step 3: Verify Installation

```bash
zap --version
```

**Expected output:** `0.1.0`

If you see the version number, **you're all set!** ✅

If you get `command not found`, see [Troubleshooting](#troubleshooting) below.

---

## 🚀 Quick Start

### 1. Create a Session (Desktop App)

First, open the Zap desktop app and create a development session:

1. Open **Zap Desktop App**
2. Go to **Dev Mode**
3. Select a box with your secrets
4. Click **"Create Session"**
5. Give it a name (e.g., `my-project-dev`)

The desktop app creates a session file that the CLI can read.

### 2. List Available Sessions

```bash
zap list
```

You should see your sessions from the desktop app!

### 3. Set Session for Your Project

Navigate to your project directory:

```bash
cd ~/my-awesome-project
zap use my-project-dev
```

This creates a `zap.json` file in your project.

### 4. Run Commands with Secrets

```bash
# Your secrets are automatically injected as environment variables!
zap run -- npm start
zap run -- python app.py
zap run -- cargo run
zap run -- go run main.go
```

**That's it!** Your secrets are now available as environment variables.

---

## 📖 Commands

### `zap start`
Opens the Zap desktop app.

```bash
zap start
```

### `zap list [SESSION_NAME]`
Lists all available sessions or secrets in a specific session.

```bash
# List all sessions
zap list

# List secrets in a specific session
zap list my-project-dev
```

### `zap use <SESSION_NAME>`
Sets the current session for your project.

```bash
zap use my-project-dev
```

Creates a `zap.json` file in the current directory.

### `zap run -- <COMMAND>`
Runs a command with secrets injected as environment variables.

```bash
# Basic usage
zap run -- npm start

# With specific session (override current)
zap run --session other-session -- python app.py

# Show loaded environment variables (verbose)
zap run -v -- npm test

# Add prefix to environment variable names
zap run --prefix MY_APP -- npm start
```

**Options:**
- `--session, -s`: Override current session
- `--verbose, -v`: Show loaded environment variables
- `--prefix, -p`: Add prefix to env var names

### `zap status`
Shows the current session status for your project.

```bash
zap status
```

### `zap stop <SESSION_NAME>`
Stops a specific session (deletes the session file).

```bash
zap stop my-project-dev
```

### `zap clear`
Clears all active sessions.

```bash
zap clear
```

**Warning:** This deletes all session files!

---

## 🔧 How It Works

### Session Files

When you create a session in the desktop app, it writes an encrypted JSON file to:

- **macOS**: `~/Library/Application Support/com.devtool.zap/sessions/`
- **Windows**: `%APPDATA%/com.devtool.zap/sessions/`
- **Linux**: `~/.config/com.devtool.zap/sessions/`

The CLI reads these files and decrypts your secrets.

### Environment Variable Naming

Secret names are converted to UPPERCASE environment variables:

| Secret Name | Environment Variable |
|-------------|---------------------|
| `Database Password` | `DATABASE_PASSWORD` |
| `api-key` | `API_KEY` |
| `my.secret.value` | `MY_SECRET_VALUE` |
| `AWS_ACCESS_KEY` | `AWS_ACCESS_KEY` |

### Project Context

When you run `zap use <session>`, a `zap.json` file is created:

```json
{
  "app": "zap",
  "current_session": "my-project-dev",
  "available_secrets": [
    "DATABASE_URL",
    "API_KEY",
    "AWS_SECRET"
  ]
}
```

**Add `zap.json` to your `.gitignore`!**

---

## 💡 Example Workflows

### Web Development

```bash
cd my-web-app/
zap use web-dev-session

# Start dev server with secrets
zap run -- npm run dev

# Run tests with secrets
zap run -- npm test

# Build with secrets
zap run -- npm run build
```

### Python Development

```bash
cd my-python-app/
zap use python-dev

# Run app
zap run -- python app.py

# Run with uvicorn
zap run -- uvicorn main:app --reload

# Run Django
zap run -- python manage.py runserver
```

### Multi-Environment

```bash
# Development
zap use dev-session
zap run -- npm start

# Staging
zap use staging-session
zap run -- npm start

# Check current environment
zap status
```

---

## 🔒 Security

- ✅ Secrets are encrypted with AES-GCM (256-bit)
- ✅ Session keys are unique per session
- ✅ No secrets stored in plaintext
- ✅ Environment variables only exist during command execution
- ✅ No network required - everything is local

**Never commit:**
- `zap.json` (project context file)
- Session files (they're in system directories anyway)

---

## 🐛 Troubleshooting

### `zap: command not found`

**Problem:** Python's bin directory is not in your PATH.

**Solution:**

1. Find where `zap` was installed:
   ```bash
   pip3 show zapc
   ```
   Look for the "Location" line.

2. Add the bin directory to PATH (see [Step 2](#step-2-set-up-path-macoslinux-only) above)

3. Or use the full path:
   ```bash
   # Find it
   which python3
   # Usually at: /Users/yourname/Library/Python/3.x/bin/zap
   
   # Use full path
   /Users/yourname/Library/Python/3.x/bin/zap --version
   ```

### `No active sessions found`

**Problem:** No sessions created in desktop app.

**Solution:**
1. Open Zap Desktop App
2. Go to Dev Mode
3. Create a session from a box
4. Try `zap list` again

### `Session 'xxx' not found`

**Problem:** Session was deleted in desktop app or doesn't exist.

**Solution:**
```bash
# List available sessions
zap list

# Use an existing session
zap use <session-from-list>
```

### `No current session set`

**Problem:** No `zap.json` in current directory.

**Solution:**
```bash
# Set a session first
zap use my-session

# Or specify session when running
zap run --session my-session -- npm start
```

### Permission Errors

**Problem:** Can't write `zap.json` file.

**Solution:**
```bash
# Check directory permissions
ls -la

# Make sure you have write permissions in current directory
```

---

## 🆚 Alternative: Using pipx (Recommended for Isolation)

[pipx](https://pypa.github.io/pipx/) installs CLI tools in isolated environments and handles PATH automatically.

### Install pipx:

```bash
# macOS
brew install pipx
pipx ensurepath

# Linux
python3 -m pip install --user pipx
python3 -m pipx ensurepath

# Windows
python -m pip install --user pipx
python -m pipx ensurepath
```

### Install Zap CLI with pipx:

```bash
pipx install zapc
```

**No PATH configuration needed!** ✅

---

## 📚 Additional Resources

- **Desktop App**: [github.com/hunter-arton/zap](https://github.com/hunter-arton/zap)
- **Issues**: [github.com/hunter-arton/zap/issues](https://github.com/hunter-arton/zap/issues)
- **PyPI**: [pypi.org/project/zapc](https://pypi.org/project/zapc)

---

## ⚡ Quick Reference

```bash
# Installation
pip3 install zapc

# Setup (macOS/Linux)
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
zap --version

# Basic usage
zap list                     # List sessions
zap use my-session          # Set session
zap run -- npm start        # Run with secrets
zap status                  # Check current session
```

---

## 🤝 Support

Having issues? Check:
1. Python version: `python3 --version` (need 3.8+)
2. Installation: `pip3 show zapc`
3. PATH setup: `echo $PATH`
4. Desktop app is running and has sessions

Still stuck? [Open an issue](https://github.com/hunter-arton/zap/issues)!

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Made with ❤️ for developers who care about security**