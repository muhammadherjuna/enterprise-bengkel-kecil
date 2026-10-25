/**
 * BengkelOS Database Backup & Restore Utility
 * Implements and verifies PRD AC-16
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bengkelos-backup-${timestamp}.sql`;
  const targetPath = path.join(BACKUP_DIR, filename);

  console.log(`[BACKUP] Creating PostgreSQL backup to: ${targetPath}`);
  
  // Use docker exec to run pg_dump directly inside the postgres container
  const cmd = `docker exec bengkelos-postgres pg_dump -U bengkel -d bengkelos -F p --clean --if-exists`;
  const dumpOutput = execSync(cmd, { maxBuffer: 50 * 1024 * 1024 });

  fs.writeFileSync(targetPath, dumpOutput);
  const stats = fs.statSync(targetPath);
  console.log(`[BACKUP] Backup completed successfully. Size: ${stats.size} bytes.`);
  return targetPath;
}

function restoreDatabase(backupFilePath) {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  console.log(`[RESTORE] Restoring PostgreSQL database from: ${backupFilePath}`);
  // Feed file into psql via stdin
  const sql = fs.readFileSync(backupFilePath, 'utf-8');
  execSync(`docker exec -i bengkelos-postgres psql -U bengkel -d bengkelos`, {
    input: sql,
    maxBuffer: 50 * 1024 * 1024,
  });
  console.log(`[RESTORE] Database restored successfully!`);
}

// CLI handler
const args = process.argv.slice(2);
const command = args[0] || 'backup';

if (command === 'backup') {
  backupDatabase();
} else if (command === 'restore') {
  const file = args[1];
  if (!file) {
    // Pick the most recent backup
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql')).sort().reverse();
    if (files.length === 0) {
      console.error('No backup files found in backups directory.');
      process.exit(1);
    }
    restoreDatabase(path.join(BACKUP_DIR, files[0]));
  } else {
    restoreDatabase(file);
  }
} else {
  console.log('Usage: node scripts/db-backup-restore.js [backup|restore [filepath]]');
}

module.exports = { backupDatabase, restoreDatabase };
