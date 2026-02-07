#!/bin/bash

# File watcher script for AI4ALL dashboard
# Monitors data/aggregated-data.json and refreshes browser when data updates
# Also rebuilds if using a build process

WATCH_FILE="/home/pedroocalado/ai4all/AI4ALL/data/aggregated-data.json"
LOG_FILE="/home/pedroocalado/ai4all/AI4ALL/logs/file-watcher.log"
PID_FILE="/tmp/ai4all-watcher.pid"

# Create logs directory
mkdir -p /home/pedroocalado/ai4all/AI4ALL/logs

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        log_message "Watcher already running (PID: $OLD_PID)"
        exit 1
    else
        rm -f "$PID_FILE"
    fi
fi

# Save current PID
echo $$ > "$PID_FILE"

log_message "Starting file watcher for $WATCH_FILE"
log_message "Monitoring for changes every 5 seconds..."

# Get initial checksum
LAST_CHECKSUM=$(md5sum "$WATCH_FILE" 2>/dev/null | awk '{print $1}')

# Trap to clean up on exit
trap 'rm -f "$PID_FILE"; log_message "Watcher stopped"; exit 0' EXIT INT TERM

# Watch loop
while true; do
    sleep 5
    
    # Check if file exists
    if [ ! -f "$WATCH_FILE" ]; then
        continue
    fi
    
    # Get current checksum
    CURRENT_CHECKSUM=$(md5sum "$WATCH_FILE" 2>/dev/null | awk '{print $1}')
    
    # Check if file changed
    if [ "$CURRENT_CHECKSUM" != "$LAST_CHECKSUM" ]; then
        log_message "Data file changed! New checksum: $CURRENT_CHECKSUM"
        
        # Update last checksum
        LAST_CHECKSUM="$CURRENT_CHECKSUM"
        
        # Get file size and item count
        FILE_SIZE=$(du -h "$WATCH_FILE" | cut -f1)
        ITEM_COUNT=$(grep -o '"id"' "$WATCH_FILE" | wc -l)
        
        log_message "Updated data: $FILE_SIZE, ~$ITEM_COUNT items"
        
        # Optional: Send signal to browsers (using WebSocket or SSE would be better)
        # For now, the dashboard auto-refreshes every 30 seconds via JavaScript
        
        # Could trigger a rebuild here if needed:
        # cd /home/pedroocalado/ai4all/AI4ALL && npm run build 2>&1 | tee -a "$LOG_FILE"
    fi
done
