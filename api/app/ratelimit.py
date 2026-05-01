"""In-memory IP rate limiter for unauthenticated endpoints.

Single-process only — fine for our 1-instance uvicorn setup. If we ever
go multi-worker we move this to Redis."""
import time
from collections import defaultdict, deque
from threading import Lock
from fastapi import HTTPException, Request, status


class SlidingWindow:
    def __init__(self, max_attempts: int, window_seconds: int):
        self.max = max_attempts
        self.window = window_seconds
        self.hits: dict[str, deque[float]] = defaultdict(deque)
        self.lock = Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self.lock:
            q = self.hits[key]
            # Drop hits outside the window
            while q and now - q[0] > self.window:
                q.popleft()
            if len(q) >= self.max:
                retry_after = int(self.window - (now - q[0])) + 1
                raise HTTPException(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Too many attempts. Try again later.",
                    headers={"Retry-After": str(retry_after)},
                )
            q.append(now)


# 5 attempts / 15 min for signup; 10 / 15 min for login
signup_limiter = SlidingWindow(max_attempts=5, window_seconds=15 * 60)
login_limiter = SlidingWindow(max_attempts=10, window_seconds=15 * 60)


def client_ip(request: Request) -> str:
    # Cloudflare puts the real IP in CF-Connecting-IP. Fall back to X-Forwarded-For
    # (set by nginx) and finally the socket peer.
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return cf.strip()
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
