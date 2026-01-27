#!/usr/bin/env python3
"""
Start the Trapped in the Phone! development server and open in browser.
Run this script to quickly launch the game for testing.
"""

import subprocess
import webbrowser
import time
import sys
import os

# Change to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def main():
    print("Starting Trapped in the Phone! development server...")
    print("=" * 50)

    # Start the dev server
    try:
        # Use npm run dev
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        # Wait for server to start and capture the URL
        url = "http://localhost:5173"  # Default Vite URL

        for line in process.stdout:
            print(line, end='')

            # Look for the local URL in Vite output
            if "Local:" in line and "http" in line:
                # Extract URL from line like "  ➜  Local:   http://localhost:5173/"
                parts = line.split("http")
                if len(parts) > 1:
                    url = "http" + parts[1].strip()
                    break
            elif "localhost" in line.lower() and "http" in line:
                break

        # Give server a moment to fully start
        time.sleep(1)

        # Open in default browser
        print(f"\nOpening {url} in your browser...")
        webbrowser.open(url)

        # Keep running and showing output
        print("\nServer is running. Press Ctrl+C to stop.\n")
        print("=" * 50)

        for line in process.stdout:
            print(line, end='')

    except FileNotFoundError:
        print("Error: npm not found. Make sure Node.js is installed.")
        print("Download from: https://nodejs.org/")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        process.terminate()
        print("Done!")

if __name__ == "__main__":
    main()
