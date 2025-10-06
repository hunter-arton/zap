# Zap CLI - Installation Guide

Complete step-by-step installation guide for all platforms.

---

## 📋 Before You Start

### Check Python Version

```bash
python3 --version
```

**You need Python 3.8 or higher.**

If you don't have Python, install it first:
- **macOS**: Download from [python.org](https://www.python.org/downloads/) or use `brew install python3`
- **Windows**: Download from [python.org](https://www.python.org/downloads/)
- **Linux**: Usually pre-installed, or use `sudo apt install python3 python3-pip`

---

## 🍎 macOS Installation

### Step 1: Install Zap CLI

```bash
pip3 install zapc
```

You'll see something like:
```
Successfully installed zapc-0.1.0
WARNING: The script zap is installed in '/Users/yourname/Library/Python/3.9/bin' which is not on PATH.
```

**The warning is normal!** Continue to Step 2.

---

### Step 2: Add to PATH

#### Find Your Shell

Check which shell you're using:
```bash
echo $SHELL
```

**If it says `/bin/zsh`** (most common on newer Macs):
```bash
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**If it says `/bin/bash`** (older Macs):
```bash
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

**Note:** Replace `3.9` with your Python version. Check with `python3 --version`

---

### Step 3: Verify

```bash
zap --version
```

**Expected:** `0.1.0`

✅ **Success!** Skip to [First Use](#-first-use)

---

### ⚠️ macOS Troubleshooting

#### Still getting `command not found`?

**Option A - Find exact path:**
```bash
# Find where pip3 installed it
pip3 show zapc | grep Location

# It will show something like:
# Location: /Users/yourname/Library/Python/3.9/site-packages

# The bin is in the same parent folder
# Add this to PATH (adjust version number):
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Option B - Use full path temporarily:**
```bash
# Find the exact location
find ~/Library/Python -name zap 2>/dev/null

# Use it directly (example path):
~/Library/Python/3.9/bin/zap --version
```

**Option C - Reinstall with pipx (easiest):**
```bash
# Install pipx
brew install pipx
pipx ensurepath

# Install zap with pipx
pipx install zapc

# No PATH setup needed!
zap --version
```

---

## 🪟 Windows Installation

### Step 1: Install Zap CLI

Open **PowerShell** or **Command Prompt**:

```bash
pip install zapc
```

Windows usually adds to PATH automatically.

---

### Step 2: Verify

```bash
zap --version
```

**Expected:** `0.1.0`

✅ **Success!** Skip to [First Use](#-first-use)

---

### ⚠️ Windows Troubleshooting

#### `zap` is not recognized

**Solution - Add to PATH manually:**

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click **"Advanced"** tab
3. Click **"Environment Variables"**
4. Under **"User variables"**, find and select **"Path"**
5. Click **"Edit"**
6. Click **"New"**
7. Add: `C:\Users\YourName\AppData\Roaming\Python\Python39\Scripts`
   - Replace `YourName` with your username
   - Replace `Python39` with your Python version
8. Click **"OK"** on all dialogs
9. **Close and reopen** your terminal
10. Try `zap --version` again

**Or find exact path:**
```powershell
# Find where pip installed it
pip show zapc

# Look for "Location" line
# Scripts folder is usually in the same parent directory
```

---

## 🐧 Linux Installation

### Step 1: Install Zap CLI

```bash
pip3 install --user zapc
```

The `--user` flag installs it in your home directory.

---

### Step 2: Add to PATH

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**For zsh users:**
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### Step 3: Verify

```bash
zap --version
```

**Expected:** `0.1.0`

✅ **Success!** Continue to [First Use](#-first-use)

---

### ⚠️ Linux Troubleshooting

#### Permission denied

**Solution:**
```bash
# Don't use sudo! Install with --user flag
pip3 install --user zapc
```

#### Command not found

**Solution:**
```bash
# Find where it's installed
pip3 show zapc | grep Location

# Usually: ~/.local/lib/python3.x/site-packages
# The bin is at: ~/.local/bin

# Make sure it's in PATH
echo $PATH | grep .local/bin

# If not, add it:
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## 🚀 First Use

Once `zap --version` works:

### 1. Check for Sessions

```bash
zap list
```

**If you see "No active sessions found":**
- You need to create sessions in the Zap Desktop App first
- Open Zap Desktop App → Dev Mode → Create Session

### 2. Use a Session

```bash
# Go to your project
cd ~/my-project

# Set session
zap use my-session-name

# Run your app with secrets
zap run -- npm start
```

**That's it!** 🎉

---

## 🎯 Alternative: Install with pipx (Recommended)

**pipx** installs CLI tools in isolated environments and handles PATH automatically.

### Why pipx?

- ✅ **No PATH configuration needed**
- ✅ Isolated environments (no conflicts)
- ✅ Easier to manage and update
- ✅ Recommended by Python Packaging Authority

### Install pipx

**macOS:**
```bash
brew install pipx
pipx ensurepath
```

**Linux:**
```bash
python3 -m pip install --user pipx
python3 -m pipx ensurepath
```

**Windows:**
```bash
python -m pip install --user pipx
python -m pipx ensurepath
```

### Install Zap CLI with pipx

```bash
pipx install zapc
```

**Done!** No PATH setup needed. Try:
```bash
zap --version
```

### Update with pipx

```bash
pipx upgrade zapc
```

---

## 📊 Quick Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| `pip3` | Simple, standard | Needs PATH setup | Most users |
| `pipx` | No PATH setup, isolated | Extra dependency | Power users |
| System pip | Easy | May need sudo (bad!) | Not recommended |

---

## ✅ Installation Checklist

After installation, verify everything works:

- [ ] `python3 --version` shows 3.8+
- [ ] `pip3 --version` works
- [ ] `pip3 install zapc` completed successfully
- [ ] PATH configured (if needed)
- [ ] `zap --version` shows `0.1.0`
- [ ] `zap --help` shows commands
- [ ] Zap Desktop App installed
- [ ] At least one session created in desktop app
- [ ] `zap list` shows your sessions

---

## 🆘 Still Having Issues?

### Check Installation Status

```bash
# Verify zapc is installed
pip3 show zapc

# Check where zap command is
which zap     # macOS/Linux
where zap     # Windows

# Check PATH
echo $PATH    # macOS/Linux
echo %PATH%   # Windows
```

### Common Issues

**"No module named 'click'"**
- Dependencies didn't install correctly
- Try: `pip3 install --upgrade zapc`

**"Permission denied"**
- Don't use `sudo`!
- Use: `pip3 install --user zapc`

**"SSL Certificate error"**
- Try: `pip3 install --trusted-host pypi.org --trusted-host files.pythonhosted.org zapc`

---

## 📞 Get Help

1. **Check the main README**: [README.md](README.md)
2. **Search existing issues**: [GitHub Issues](https://github.com/hunter-arton/zap/issues)
3. **Create new issue**: Include:
   - Your OS (macOS/Windows/Linux)
   - Python version (`python3 --version`)
   - Error message
   - Output of `pip3 show zapc`

---

## 🎓 Next Steps

Once installed:

1. **Read the README**: [README.md](README.md) for usage guide
2. **Create sessions**: Use Zap Desktop App
3. **Try the Quick Start**: [Quick Start Guide](README.md#-quick-start)

---

**Installation should take less than 5 minutes!** 🚀

If it takes longer, something's wrong - check the troubleshooting sections above.