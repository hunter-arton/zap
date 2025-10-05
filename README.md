# Zap

> A secure, developer-friendly credential manager for managing API keys, tokens, and secrets across your projects.

## 🎯 What is Zap?

Zap is a modern credential management system designed for developers. It consists of two components:

1. **Desktop App** (Tauri) - Secure GUI for managing your credentials
2. **CLI** (Python) - Inject secrets into your development environment

## 📦 Components

### Desktop Application
- 🔐 Secure vault with master password encryption
- 📦 Organize secrets in "boxes" (projects/environments)
- 🎨 Modern, native desktop UI
- 🔄 Import/Export functionality
- 💻 Cross-platform (macOS, Windows, Linux)

**Built with:** Tauri, React, TypeScript, Rust

### Command Line Interface
- 🚀 Inject secrets as environment variables
- 🔄 Session-based workflow
- 🛡️ AES-GCM encryption
- 📝 Simple, intuitive commands

**Built with:** Python, Click, Rich

## 🚀 Quick Start

### 1. Install Desktop App

Download from [Releases](https://github.com/yourusername/zap/releases) or build from source:

```bash
# Clone the repository
git clone https://github.com/yourusername/zap.git
cd zap

# Install frontend dependencies
npm install

# Build and run the desktop app
npm run tauri dev
```

### 2. Install CLI

```bash
pip install zap-cli
```

### 3. Create Your First Session

1. Open Zap desktop app
2. Create a vault with a master password
3. Add a "box" (e.g., "my-project")
4. Add secrets to the box
5. Go to **Dev Mode** and create a session

### 4. Use in Your Project

```bash
# In your project directory
cd my-project/

# Set the session
zap use my-session-name

# Run your app with secrets injected
zap run -- npm start
```

## 📖 Documentation

- [Desktop App Guide](./src-tauri/README.md)
- [CLI Documentation](./zap-cli/README.md)

## 🏗️ Project Structure

```
zap/
├── src-tauri/          # Desktop app (Rust + Tauri)
│   ├── src/
│   └── Cargo.toml
├── zap-cli/            # Python CLI
│   ├── zap_cli/
│   └── setup.py
├── src/                # Frontend (React + TypeScript)
└── package.json
```

## 🛠️ Development

### Prerequisites

- **For Desktop App:**
  - Node.js 18+
  - Rust 1.70+
  - Tauri prerequisites ([see docs](https://tauri.app/v1/guides/getting-started/prerequisites))

- **For CLI:**
  - Python 3.8+
  - pip

### Build Desktop App

```bash
# Development
npm run tauri dev

# Production build
npm run tauri build
```

### Develop CLI Locally

```bash
cd zap-cli

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install in development mode
pip install -e .

# Test
zap --help
```

## 🔒 Security

- ✅ Master password hashed with Argon2
- ✅ Secrets encrypted with AES-GCM (256-bit)
- ✅ Unique session keys per dev session
- ✅ No secrets stored in plaintext
- ✅ Local-only (no cloud, no internet required)

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

- 🐛 [Report Issues](https://github.com/yourusername/zap/issues)
- 💬 [Discussions](https://github.com/yourusername/zap/discussions)

---

**Made with ❤️ for developers who care about security**