/**
 * File-based logging module
 * Writes logs to both stderr (for console output) and to a file
 */

const fs = require('fs');
const path = require('path');

// Log file path - will be created in /tmp directory inside Docker container
// You can mount a volume to persist these logs outside the container
const LOG_DIR = process.env.LOG_DIR || '/tmp/ethan-xai-logs';
const GAME_ID = process.env.GAME_ID || Date.now();
const LOG_FILE = path.join(LOG_DIR, `game-${GAME_ID}.jsonl`);

let logStream = null;
let logsBuffer = [];

/**
 * Initialize the log file
 */
function initLogFile() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    
    // Open write stream
    logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    
    // Write any buffered logs
    for (const log of logsBuffer) {
      logStream.write(log + '\n');
    }
    logsBuffer = [];
    
    console.error(`[LOG] Logging to: ${LOG_FILE}`);
  } catch (error) {
    console.error('[LOG] Failed to initialize log file:', error.message);
  }
}

/**
 * Write a log entry to both stderr and file
 */
function writeLog(logObject) {
  const logString = JSON.stringify(logObject);
  
  // Always write to stderr for console visibility
  console.error(logString);
  
  // Write to file if available, otherwise buffer
  if (logStream) {
    logStream.write(logString + '\n');
  } else {
    logsBuffer.push(logString);
  }
}

/**
 * Close the log file
 */
function closeLogFile() {
  if (logStream) {
    // Write a final summary log
    writeLog({
      type: 'LOG_FILE_CLOSED',
      timestamp: Date.now(),
      logFile: LOG_FILE
    });
    
    logStream.end();
    logStream = null;
  }
}

// Initialize on module load
initLogFile();

// Ensure we close the log file on exit
process.on('exit', closeLogFile);
process.on('SIGINT', () => {
  closeLogFile();
  process.exit();
});
process.on('SIGTERM', () => {
  closeLogFile();
  process.exit();
});

module.exports = {
  writeLog,
  closeLogFile,
  LOG_FILE
};
