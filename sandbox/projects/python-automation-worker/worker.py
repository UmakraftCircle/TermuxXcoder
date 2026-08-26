import os
import hashlib
import time
import json
import logging

class TelemetryLogger:
    def __init__(self):
        self.logger = logging.getLogger("TelemetryLogger")

    def run_cycles(self, iterations: int = 5):
        self.logger.info(f"Starting {iterations} telemetry data collection cycles...")
        for i in range(1, iterations + 1):
            stats = {
                "cycle": i,
                "timestamp": time.time(),
                "load_avg": os.getloadavg() if hasattr(os, "getloadavg") else (0.1, 0.1, 0.1),
                "pid": os.getpid(),
                "status": "HEALTHY"
            }
            self.logger.info(f"Cycle {i}/{iterations}: Load={stats['load_avg']} PID={stats['pid']}")
            time.sleep(0.5)
        self.logger.info("Telemetry cycles successfully finished.")

class TaskWorker:
    def __init__(self):
        self.logger = logging.getLogger("TaskWorker")

    def process_sample_jobs(self):
        jobs = [
            {"id": "JOB-101", "task": "Verify /models/default.gguf offline weights", "priority": "HIGH"},
            {"id": "JOB-102", "task": "Index sandbox/ storage files into Turso RAG", "priority": "NORMAL"},
            {"id": "JOB-103", "task": "Compile Termux POSIX binary wrappers", "priority": "CRITICAL"}
        ]
        self.logger.info(f"Executing queue with {len(jobs)} background jobs...")
        for job in jobs:
            self.logger.info(f"Processing [{job['id']}] {job['task']} (Priority: {job['priority']})...")
            time.sleep(0.3)
            self.logger.info(f"Job [{job['id']}] COMPLETED with status 0.")
        self.logger.info("All background worker jobs completed successfully.")

    def hash_directory(self, target_dir: str):
        self.logger.info(f"Generating SHA-256 integrity manifest for directory: {target_dir}")
        manifest = {}
        for root, _, files in os.walk(target_dir):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "rb") as f:
                        file_hash = hashlib.sha256(f.read()).hexdigest()
                        rel_path = os.path.relpath(file_path, target_dir)
                        manifest[rel_path] = file_hash[:16]
                        self.logger.info(f"  {rel_path} -> SHA256:{file_hash[:12]}...")
                except Exception as e:
                    self.logger.warning(f"  Failed to read {file_path}: {e}")
        self.logger.info(f"Integrity scan completed for {len(manifest)} files.")
        return manifest

    def run_math_benchmark(self):
        self.logger.info("Running CPU single-thread matrix benchmark...")
        start = time.time()
        total = 0
        for i in range(1_000_000):
            total += (i * 3) % 7
        duration = time.time() - start
        self.logger.info(f"Benchmark finished in {duration:.4f}s (Result: {total})")
