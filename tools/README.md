# Tools

Python scripts for deterministic execution. Each script does one thing well.

## Conventions

- Each script is self-contained and runnable from the command line
- Credentials are loaded from `.env` via `python-dotenv`
- Scripts print clear success/error messages to stdout
- Exit code 0 = success, non-zero = failure

## Adding a new tool

1. Create `tools/your_tool_name.py`
2. Load env vars with `load_dotenv()`
3. Accept inputs via CLI args or stdin
4. Write outputs to `.tmp/` or a cloud service
5. Document the tool in the relevant workflow
