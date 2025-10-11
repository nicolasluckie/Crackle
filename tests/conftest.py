import os
import sys

# Ensure the repository root (where crackle.py lives) is on sys.path when running pytest
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
