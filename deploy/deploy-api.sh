#!/usr/bin/env bash
# Deploy api/ from this repo to /srv/sujitverse/api/, restart the service.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_DIR/api"
DEST="/srv/sujitverse/api"

if [ ! -d "$SRC/app" ]; then
    echo "ERROR: $SRC/app not found"
    exit 1
fi

echo "→ Syncing $SRC/app/ to $DEST/app/"
sudo rsync -a --delete \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    "$SRC/app/" "$DEST/app/"
sudo chown -R sujitverse:sujitverse "$DEST/app"

echo "→ Installing requirements"
TMP_REQ="$(mktemp /tmp/sv-req-XXXXXX.txt)"
trap 'rm -f "$TMP_REQ"' EXIT
cp "$SRC/requirements.txt" "$TMP_REQ"
chmod 644 "$TMP_REQ"
if ! sudo -u sujitverse \
       PIP_DISABLE_PIP_VERSION_CHECK=1 \
       PIP_NO_CACHE_DIR=1 \
       "$DEST/venv/bin/pip" install -q -r "$TMP_REQ"; then
    echo "ERROR: pip install failed"
    exit 1
fi

echo "→ Restarting service"
sudo systemctl restart sujitverse-api
sleep 2
if systemctl is-active --quiet sujitverse-api; then
    echo "✓ Service is active"
else
    echo "✗ Service failed to start. Last log lines:"
    sudo journalctl -u sujitverse-api -n 30 --no-pager
    exit 1
fi

echo "→ Health check"
curl -sf http://127.0.0.1:8081/health && echo
