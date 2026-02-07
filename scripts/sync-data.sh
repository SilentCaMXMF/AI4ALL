#!/bin/bash

# Script to sync data from GitHub repository
# Downloads the latest aggregated-data.json from the repo

REPO="SilentCaMXMF/ai4ALL"
TOKEN="${GITHUB_TOKEN:-}"
DATA_FILE="/home/pedroocalado/ai4all/AI4ALL/data/aggregated-data.json"
LOG_FILE="/home/pedroocalado/ai4all/AI4ALL/logs/data-sync.log"

mkdir -p /home/pedroocalado/ai4all/AI4ALL/logs

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Syncing data from GitHub repository..."

# Download the data file
if [ -n "$TOKEN" ]; then
    # Use token for authentication
    curl -s -H "Authorization: token $TOKEN" \
        "https://api.github.com/repos/$REPO/contents/data/aggregated-data.json" | \
        jq -r '.content' | base64 -d > "$DATA_FILE.tmp" 2>/dev/null
else
    # Try without token (public repo)
    curl -s "https://raw.githubusercontent.com/$REPO/main/data/aggregated-data.json" \
        > "$DATA_FILE.tmp" 2>/dev/null
fi

# Check if download was successful
if [ -f "$DATA_FILE.tmp" ] && [ -s "$DATA_FILE.tmp" ]; then
    # Check if file is valid JSON
    if jq empty "$DATA_FILE.tmp" 2>/dev/null; then
        mv "$DATA_FILE.tmp" "$DATA_FILE"
        FILE_SIZE=$(du -h "$DATA_FILE" | cut -f1)
        ITEM_COUNT=$(jq '.items | length' "$DATA_FILE")
        log_message "✅ Data synced successfully: $FILE_SIZE, $ITEM_COUNT items"
    else
        log_message "❌ Downloaded file is not valid JSON"
        rm -f "$DATA_FILE.tmp"
        exit 1
    fi
else
    log_message "❌ Failed to download data file"
    rm -f "$DATA_FILE.tmp"
    exit 1
fi
