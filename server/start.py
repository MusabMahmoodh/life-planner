#!/usr/bin/env python3
"""
Startup script for Railway deployment.
Reads PORT from environment variable and starts uvicorn server.
"""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )





