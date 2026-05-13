"""Shared utilities for all tools."""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
TMP = ROOT / ".tmp"
TMP.mkdir(exist_ok=True)


def get_env(key: str) -> str:
    """Return an env var or raise a clear error if missing."""
    value = os.getenv(key)
    if not value:
        raise EnvironmentError(f"Missing required env variable: {key}")
    return value


def save_json(filename: str, data) -> Path:
    """Save data as JSON to .tmp/ and return the path."""
    path = TMP / filename
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved: {path}")
    return path


def load_json(filename: str):
    """Load JSON from .tmp/."""
    path = TMP / filename
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))
