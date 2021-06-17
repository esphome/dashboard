"""ESPHome dashboard."""
from pathlib import Path
import json


def where():
    """Return path to the frontend."""
    return Path(__file__).parent

def entrypoint():
    manifest = json.loads((where() / "static/js/esphome/manifest.json").read_text())
    return manifest['index']
