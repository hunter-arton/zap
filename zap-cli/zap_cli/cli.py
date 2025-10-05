#!/usr/bin/env python3
"""
Zap CLI - Inject secrets from dev sessions as environment variables
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from typing import Optional, List  # REMOVED Dict - not needed
import click
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from rich.console import Console
from rich.table import Table

console = Console()

# ================================
# PATH RESOLUTION (matches Rust exactly)
# ================================

APP_IDENTIFIER = "com.devtool.zap"
DATA_DIR = "data"
SESSIONS_DIR = "sessions"
BIN_DIR = "bin"


def get_app_base_directory() -> Path:
    """Get the base app directory (same as Rust version)"""
    if sys.platform == "win32":
        base = Path(os.getenv("APPDATA", "C:\\Users\\Default\\AppData\\Roaming"))
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:  # Linux
        base = Path.home() / ".config"

    return base / APP_IDENTIFIER


def get_sessions_directory() -> Path:
    """Get sessions directory"""
    return get_app_base_directory() / SESSIONS_DIR


def get_session_file_path(session_name: str) -> Path:
    """Get path to specific session file"""
    return get_sessions_directory() / f"{session_name}.json"


# ================================
# DATA STRUCTURES
# ================================


class SessionFile:
    """Session file structure (matches Rust CliSessionFile)"""

    def __init__(self, data: dict):
        self.session_name = data["session_name"]
        self.box_name = data["box_name"]
        self.session_key = bytes.fromhex(data["session_key"])
        self.encrypted_secrets = data["encrypted_secrets"]
        self.created_at = data["created_at"]

    @classmethod
    def load(cls, session_name: str) -> Optional["SessionFile"]:
        """Load session from file"""
        session_path = get_session_file_path(session_name)
        if not session_path.exists():
            return None

        try:
            with open(session_path, "r") as f:
                return cls(json.load(f))
        except (json.JSONDecodeError, KeyError, IOError):  # FIXED
            return None

    @classmethod
    def list_all(cls) -> List["SessionFile"]:
        """List all available sessions"""
        sessions_dir = get_sessions_directory()
        if not sessions_dir.exists():
            return []

        sessions = []
        for file in sessions_dir.glob("*.json"):
            try:
                with open(file, "r") as f:
                    sessions.append(cls(json.load(f)))
            except (json.JSONDecodeError, KeyError, IOError):
                continue

        return sorted(sessions, key=lambda s: s.created_at, reverse=True)


class ProjectContext:
    """Project context file (zap.json in current directory)"""

    def __init__(self, data: dict):
        self.app = data.get("app", "zap")
        self.current_session = data["current_session"]
        self.available_secrets = data.get("available_secrets", [])

    @classmethod
    def load(cls) -> Optional["ProjectContext"]:
        """Load from current directory"""
        zap_file = Path.cwd() / "zap.json"
        if not zap_file.exists():
            return None

        try:
            with open(zap_file, "r") as f:
                return cls(json.load(f))
        except (json.JSONDecodeError, KeyError, IOError):
            return None

    def save(self):
        """Save to current directory"""
        zap_file = Path.cwd() / "zap.json"
        with open(zap_file, "w") as f:
            json.dump(
                {
                    "app": self.app,
                    "current_session": self.current_session,
                    "available_secrets": self.available_secrets,
                },
                f,
                indent=2,
            )


# ================================
# CRYPTO FUNCTIONS
# ================================


def secret_name_to_env_var(secret_name: str, prefix: Optional[str] = None) -> str:
    """Convert secret name to environment variable name (matches Rust)"""
    # Convert to uppercase and replace non-alphanumeric with underscore
    clean_name = "".join(c if c.isalnum() else "_" for c in secret_name.upper())
    # Remove consecutive underscores
    clean_name = "_".join(filter(None, clean_name.split("_")))

    if prefix:
        clean_prefix = "".join(c if c.isalnum() else "_" for c in prefix.upper())
        return f"{clean_prefix}_{clean_name}"
    return clean_name


def decrypt_secret(hex_encrypted_data: str, session_key: bytes) -> str:
    """Decrypt secret using AES-GCM (matches Rust implementation)"""
    # Decode hex to get serialized EncryptedData
    serialized_data = bytes.fromhex(hex_encrypted_data)
    encrypted_data = json.loads(serialized_data)

    # Extract components (matches Rust EncryptedData struct)
    cipher = bytes(encrypted_data["cipher"])
    nonce = bytes(encrypted_data["nonce"])
    tag = bytes(encrypted_data["tag"])

    # Decrypt using AES-GCM
    aesgcm = AESGCM(session_key)
    ciphertext = cipher + tag  # Reconstruct as in Rust
    decrypted = aesgcm.decrypt(nonce, ciphertext, None)

    return decrypted.decode("utf-8")


# ================================
# CLI COMMANDS
# ================================


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """Zap CLI - Inject secrets as environment variables"""
    pass


@cli.command()
def start():
    """Open Zap desktop app to create a new session"""
    console.print("[cyan bold]Opening Zap desktop app...[/cyan bold]")

    try:
        if sys.platform == "darwin":
            subprocess.run(["open", "-a", "Zap"], check=True)
        elif sys.platform == "win32":
            # Try common Windows paths
            paths = ["Zap.exe", r"C:\Program Files\Zap\Zap.exe"]
            for path in paths:
                try:
                    subprocess.Popen([path])
                    break
                except (FileNotFoundError, OSError):
                    continue
        else:  # Linux
            subprocess.Popen(["zap"])

        console.print("✅ Zap app launched successfully!")
        console.print("[dim]Create a new session in the app's Dev Mode[/dim]")
    except Exception as e:
        console.print(f"[red]Failed to launch Zap app: {e}[/red]")
        console.print("[yellow]Make sure Zap desktop app is installed[/yellow]")


@cli.command()
@click.argument("session_name", required=False)
def list(session_name: Optional[str]):
    """List all sessions or secrets in a specific session"""
    if session_name:
        # List secrets in specific session
        session = SessionFile.load(session_name)
        if not session:
            console.print(f"[red]Session '{session_name}' not found[/red]")
            console.print("[dim]Use 'zap list' to see available sessions[/dim]")
            return

        console.print(
            f"\n[cyan bold]Secrets in session '{session_name}':[/cyan bold]\n"
        )

        if not session.encrypted_secrets:
            console.print("  [dim]No secrets in this session[/dim]")
            return

        for secret_name in session.encrypted_secrets.keys():
            env_var = secret_name_to_env_var(secret_name)
            console.print(f"  [cyan]{secret_name}[/cyan] -> [green]{env_var}[/green]")

        console.print(f"\n[dim]({len(session.encrypted_secrets)} secrets total)[/dim]")
    else:
        # List all sessions
        sessions = SessionFile.list_all()

        if not sessions:
            console.print("[dim]No active sessions found.[/dim]")
            console.print("Use 'zap start' to create a new session")
            return

        console.print("\n[cyan bold]Active Zap Sessions[/cyan bold]\n")

        # Check current project session
        context = ProjectContext.load()
        current_session = context.current_session if context else None

        table = Table(show_header=True, header_style="bold")
        table.add_column("Session", style="cyan")
        table.add_column("Secrets", justify="right", style="yellow")
        table.add_column("Box", style="dim")

        for session in sessions:
            is_current = session.session_name == current_session
            marker = "* " if is_current else "  "
            style = "green bold" if is_current else ""

            table.add_row(
                f"{marker}{session.session_name}",
                str(len(session.encrypted_secrets)),
                session.box_name,
                style=style,
            )

        console.print(table)

        if current_session:
            console.print(f"\n[dim]Current session: {current_session}[/dim]")


@cli.command()
@click.argument("session_name")
def use(session_name: str):
    """Set current session for this project"""
    session = SessionFile.load(session_name)
    if not session:
        console.print(f"[red]Session '{session_name}' not found[/red]")
        console.print("[dim]Use 'zap list' to see available sessions[/dim]")
        sys.exit(1)

    # Build list of available secrets as env var names
    available_secrets = [
        secret_name_to_env_var(name) for name in session.encrypted_secrets.keys()
    ]
    available_secrets.sort()

    context = ProjectContext(
        {
            "app": "zap",
            "current_session": session_name,
            "available_secrets": available_secrets,
        }
    )
    context.save()

    console.print(
        f"[green]✓[/green] Switched to session '[green bold]{session_name}[/green bold]'"
    )
    console.print("[dim]Now you can run 'zap run -- <command>' in this project[/dim]")


@cli.command(context_settings=dict(ignore_unknown_options=True))
@click.argument("command", nargs=-1, required=True, type=click.UNPROCESSED)
@click.option("--session", "-s", help="Session name override")
@click.option("--verbose", "-v", is_flag=True, help="Show loaded environment variables")
@click.option("--prefix", "-p", help="Prefix for environment variable names")
def run(command, session, verbose, prefix):
    """Run a command with session environment variables

    Usage: zap run -- npm start
    """
    if not command:
        console.print("[red]No command provided[/red]")
        console.print("[dim]Usage: zap run -- npm start[/dim]")
        sys.exit(1)

    # Resolve session
    session_name = session
    if not session_name:
        context = ProjectContext.load()
        if not context:
            console.print("[red]No current session set[/red]")
            console.print(
                "[dim]Use 'zap use <session-name>' to set a session for this project[/dim]"
            )
            sys.exit(1)
        session_name = context.current_session

    # Load session
    session_file = SessionFile.load(session_name)
    if not session_file:
        console.print(f"[red]Session '{session_name}' not found[/red]")
        console.print("[dim]Use 'zap list' to see available sessions[/dim]")
        sys.exit(1)

    # Prepare environment
    env = os.environ.copy()

    if verbose:
        console.print("[cyan bold]Loading secrets into environment...[/cyan bold]\n")
        console.print(f"  Using session: [green bold]{session_name}[/green bold]")
        console.print(
            f"  Loading [yellow]{len(session_file.encrypted_secrets)}[/yellow] secrets\n"
        )

    # Decrypt and inject secrets
    for secret_name, hex_encrypted in session_file.encrypted_secrets.items():
        try:
            decrypted_value = decrypt_secret(hex_encrypted, session_file.session_key)
            env_var_name = secret_name_to_env_var(secret_name, prefix)
            env[env_var_name] = decrypted_value

            if verbose:
                console.print(f"  [green]✓[/green] {env_var_name}")
        except Exception as e:
            console.print(f"  [red]✗[/red] Failed to decrypt {secret_name}: {e}")

    if verbose:
        console.print(f"\n[cyan bold]Executing:[/cyan bold] {' '.join(command)}\n")

    # Execute command
    result = subprocess.run(command, env=env)
    sys.exit(result.returncode)


@cli.command()
@click.argument("session_name")
def stop(session_name: str):
    """Stop specific session"""
    session_path = get_session_file_path(session_name)

    if session_path.exists():
        session_path.unlink()
        console.print(
            f"[green]✓[/green] Session '[green bold]{session_name}[/green bold]' stopped"
        )

        # Clear from project context if current
        context = ProjectContext.load()
        if context and context.current_session == session_name:
            (Path.cwd() / "zap.json").unlink(missing_ok=True)
            console.print("  [dim]Cleared from current project[/dim]")
    else:
        console.print(f"[red]Session '{session_name}' not found[/red]")


@cli.command()
def clear():
    """Clear all active sessions"""
    sessions = SessionFile.list_all()

    if not sessions:
        console.print("[dim]No active sessions to clear[/dim]")
        return

    if not click.confirm(f"Are you sure you want to clear {len(sessions)} session(s)?"):
        console.print("Cancelled")
        return

    sessions_dir = get_sessions_directory()
    cleared = 0

    for file in sessions_dir.glob("*.json"):
        file.unlink()
        cleared += 1

    console.print(f"[green]✓[/green] Cleared {cleared} session(s)")

    # Clear project context
    (Path.cwd() / "zap.json").unlink(missing_ok=True)
    console.print("  [dim]Cleared from current project[/dim]")


@cli.command()
def status():
    """Show current project session status"""
    context = ProjectContext.load()

    if not context:
        console.print("[dim]No current session set for this project[/dim]")
        console.print("Use 'zap use <session-name>' to set a session")
        console.print("Use 'zap list' to see available sessions")
        return

    session = SessionFile.load(context.current_session)
    if not session:
        console.print(
            f"[red]Current session '{context.current_session}' not found[/red]"
        )
        console.print("Use 'zap list' to see available sessions")
        console.print("Use 'zap use <session-name>' to set a different session")
        return

    console.print("\n[cyan bold]Current Session Status[/cyan bold]\n")
    console.print(f"  Session: [green]{session.session_name}[/green]")
    console.print(f"  Box: [cyan]{session.box_name}[/cyan]")
    console.print(f"  Secrets: [yellow]{len(session.encrypted_secrets)}[/yellow]\n")

    console.print("[cyan]Available Environment Variables:[/cyan]")
    for env_var in context.available_secrets:
        console.print(f"  [green]{env_var}[/green]")

    console.print("\n[green]Ready to run commands with 'zap run -- <command>'[/green]")


if __name__ == "__main__":
    cli()
