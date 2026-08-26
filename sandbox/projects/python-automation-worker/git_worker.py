"""
UmaKraft Python GitHub Automation Worker
Interacts with GitHub REST API for listing repositories, creating releases, and pushing commits.
"""

import os
import json
import urllib.request
import urllib.error
import base64
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class GitHubAutomationWorker:
    def __init__(self, token: str = None):
        self.token = token or os.getenv("GITHUB_TOKEN", "")
        self.logger = logging.getLogger("GitHubWorker")

    def _headers(self):
        headers = {
            "User-Agent": "UmaKraft-Python-Worker",
            "Accept": "application/vnd.github.v3+json"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def test_auth(self):
        if not self.token:
            self.logger.warning("No GitHub token provided. Running in read-only public mode.")
            return False
        url = "https://api.github.com/user"
        req = urllib.request.Request(url, headers=self._headers())
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    self.logger.info(f"Authenticated as GitHub user: @{data.get('login')}")
                    return True
        except urllib.error.HTTPError as e:
            self.logger.error(f"GitHub Auth Error: HTTP {e.code}")
            return False

    def list_repositories(self):
        url = "https://api.github.com/user/repos?per_page=10&sort=updated"
        req = urllib.request.Request(url, headers=self._headers())
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                self.logger.info(f"Retrieved {len(data)} user repositories:")
                for repo in data:
                    self.logger.info(f"  - {repo['full_name']} (Default: {repo['default_branch']})")
                return data
        except Exception as e:
            self.logger.error(f"Failed to fetch repositories: {e}")
            return []

if __name__ == "__main__":
    worker = GitHubAutomationWorker()
    worker.test_auth()
    worker.list_repositories()
