"""
UmaKraft Python Automation & Data Worker
Asynchronous background task runner, file integrity monitor, and system telemetry pipeline.
"""

import sys
import os
import time
import argparse
import logging
from worker import TaskWorker, TelemetryLogger

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

def main():
    parser = argparse.ArgumentParser(description="UmaKraft Automation Worker")
    parser.add_argument("--mode", choices=["worker", "telemetry", "hash", "benchmark"], default="telemetry", help="Execution mode")
    parser.add_argument("--target", type=str, default=".", help="Target directory for operations")
    parser.add_argument("--iterations", type=int, default=5, help="Number of telemetry cycles")
    args = parser.parse_args()

    print("\033[36m====================================================\033[0m")
    print("\033[1;32m  🐍 UMAKRAFT PYTHON WORKER & AUTOMATION ENGINE     \033[0m")
    print("\033[36m====================================================\033[0m")
    logging.info(f"Initialized in mode: {args.mode} | Target: {args.target}")

    if args.mode == "telemetry":
        logger = TelemetryLogger()
        logger.run_cycles(args.iterations)
    elif args.mode == "worker":
        worker = TaskWorker()
        worker.process_sample_jobs()
    elif args.mode == "hash":
        worker = TaskWorker()
        worker.hash_directory(args.target)
    elif args.mode == "benchmark":
        worker = TaskWorker()
        worker.run_math_benchmark()

if __name__ == "__main__":
    main()
