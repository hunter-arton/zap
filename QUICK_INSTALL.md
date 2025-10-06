# Zap - Quick Installation Guide

**For testers: Get started in 5 minutes!**

---

## 📦 What You're Installing

1. **Zap Desktop App** - Manage your secrets securely
2. **Zap CLI** - Use secrets in your projects (optional but recommended)

---

## Part 1: Desktop App

### macOS

1. Download `.dmg` from [Releases](https://github.com/hunter-arton/zap/releases)
2. Open the `.dmg` file
3. Drag **Zap** to **Applications** folder
4. **Important**: Don't double-click! **Right-click** → **Open**
5. Click **"Open"** on the warning (testing build - not code-signed)
6. ✅ Done! App opens

**Why right-click?** The app isn't code-signed yet (requires $99/year Apple account). This is normal for testing.

---

### Windows

1. Download `.msi` from [Releases](https://github.com/hunter-arton/zap/releases)
2. Double-click to run installer
3. Click through "Unknown publisher" warning
4. ✅ Done! App installs

---

## Part 2: CLI (Recommended)

### Prerequisites

Check if you have Python:
```bash
python3 --version
```

Need Python? Download from: https://www.python.org/downloads/

---

### macOS Installation

```bash
# 1. Install
pip3 install zapc

# 2. Add to PATH (copy-paste this entire line)
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# 3. Test
zap --version
```

**Should show:** `0.1.0` ✅

---

### Windows Installation

```bash
# 1. Install
pip install zapc

# 2. Test
zap --version
```

**Should show:** `0.1.0` ✅

---

### Linux Installation

```bash
# 1. Install
pip3 install --user zapc

# 2. Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc

# 3. Test
zap --version
```

**Should show:** `0.1.0` ✅

---

## 🎯 Quick Test

### 1. Open Desktop App

- Create a vault (choose a master password)
- Add a box called "test"
- Add a secret: `MY_SECRET` = `hello-world`
- Go to **Dev Mode** → Create session called `test-session`

### 2. Test CLI

```bash
# List sessions
zap list

# Should show: test-session

# Create test directory
mkdir ~/zap-test
cd ~/zap-test

# Use session
zap use test-session

# Test secret injection
zap run -- env | grep MY_SECRET

# Should show: MY_SECRET=hello-world
```

**If you see your secret - it works!** ✅

---

## ⚠️ Common Issues

### macOS: "zap: command not found"

**Problem:** PATH not configured

**Fix:**
```bash
# Run this again (adjust Python version if needed)
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Or find exact path:
find ~/Library/Python -name zap 2>/dev/null

# Then use full path to test:
~/Library/Python/3.9/bin/zap --version
```

---

### macOS: App won't open

**Problem:** Didn't use right-click

**Fix:**
1. Go to **Applications** folder
2. Find **Zap**
3. **Right-click** → **Open** (don't double-click!)
4. Click **"Open"** on warning

---

### Windows: PATH issues

**Fix:**
1. Search "Environment Variables" in Start
2. Edit "Path" under User variables
3. Add: `C:\Users\YourName\AppData\Roaming\Python\Python3x\Scripts`
4. Restart terminal

---

### Python not found

**macOS:**
```bash
# Install via Homebrew
brew install python3

# Or download from python.org
```

**Windows:**
- Download from: https://www.python.org/downloads/
- Check "Add Python to PATH" during installation

---

## 📝 What to Test

Please try these and report any issues:

### Desktop App
- [ ] App opens successfully
- [ ] Can create a vault
- [ ] Can add boxes
- [ ] Can add secrets
- [ ] Can create dev sessions
- [ ] App doesn't crash

### CLI
- [ ] Installation works
- [ ] `zap --version` shows version
- [ ] `zap list` shows sessions from app
- [ ] `zap use` sets session
- [ ] `zap run` injects secrets correctly
- [ ] Works in different project directories

---

## 💬 Feedback

Found a bug? Have suggestions? Let me know!

**What to include:**
- Your OS (macOS/Windows/Linux version)
- What you were trying to do
- Error message (if any)
- Screenshots help!

---

## 📚 Full Documentation

- **Desktop App**: Use the app itself (has a guide built-in)
- **CLI Commands**: [CLI README](https://github.com/hunter-arton/zap/tree/main/zap-cli)
- **Detailed Install**: [Installation Guide](https://github.com/hunter-arton/zap/tree/main/zap-cli/INSTALLATION.md)

---

## ✨ Next Steps

Once everything works:

1. **Add real secrets** to a box
2. **Create sessions** for different projects
3. **Try it in your actual projects**:
   ```bash
   cd your-real-project/
   zap use your-session
   zap run -- npm start  # or python app.py, etc.
   ```

---

**Thanks for testing!** 🙏

Your feedback will make Zap better for everyone! 🚀