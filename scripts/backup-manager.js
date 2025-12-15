/**
 * Backup Management Script
 * Manual backup operations and maintenance tasks
 *
 * Usage:
 * node scripts/backup-manager.js [command] [options]
 *
 * Commands:
 * - backup: Create a manual backup
 * - restore <backup-path>: Restore from a specific backup
 * - list: List all available backups
 * - status: Show backup system status
 * - cleanup: Remove old backups according to retention policy
 * - verify <backup-path>: Verify backup integrity
 */

const backupService = require('../src/services/backupService');
const path = require('path');

const command = process.argv[2];
const backupPath = process.argv[3];

async function main() {
  try {
    switch (command) {
      case 'backup':
        console.log('🚀 Starting manual backup...');
        const result = await backupService.triggerManualBackup('manual');
        if (result.success) {
          console.log('✅ Backup completed successfully!');
          console.log(`📁 Backup location: ${result.path}`);
        } else {
          console.error('❌ Backup failed:', result.error);
          process.exit(1);
        }
        break;

      case 'restore':
        if (!backupPath) {
          console.error('❌ Please specify a backup path to restore from');
          console.log('Usage: node scripts/backup-manager.js restore <backup-path>');
          process.exit(1);
        }

        const fullBackupPath = path.isAbsolute(backupPath)
          ? backupPath
          : path.join(process.cwd(), backupPath);

        console.log(`🔄 Starting restore from: ${fullBackupPath}`);
        const restoreResult = await backupService.restoreFromBackup(fullBackupPath);

        if (restoreResult.success) {
          console.log('✅ Restore completed successfully!');
        } else {
          console.error('❌ Restore failed:', restoreResult.error);
          process.exit(1);
        }
        break;

      case 'list':
        console.log('📋 Available backups:');
        const backups = await backupService.listBackups();

        if (backups.length === 0) {
          console.log('No backups found.');
        } else {
          backups.forEach(backup => {
            const age = Math.floor((Date.now() - backup.created) / (1000 * 60 * 60 * 24));
            console.log(`- ${backup.name} (${backup.type}) - ${age} days old`);
          });
        }
        break;

      case 'status':
        console.log('📊 Backup System Status:');
        const status = await backupService.getBackupStatus();

        if (status.error) {
          console.error('❌ Failed to get status:', status.error);
          process.exit(1);
        }

        console.log(`Total backups: ${status.totalBackups}`);
        console.log(`Retention period: ${status.retentionDays} days`);
        console.log(`Scheduled backups: ${status.scheduleEnabled ? 'Enabled' : 'Disabled'}`);
        console.log(`Backup directory: ${status.backupDir}`);

        if (status.lastBackup) {
          const lastBackupAge = Math.floor((Date.now() - status.lastBackup.created) / (1000 * 60 * 60 * 24));
          console.log(`Last backup: ${status.lastBackup.name} (${lastBackupAge} days ago)`);
        }

        if (status.stats) {
          console.log(`\n📈 Statistics:`);
          console.log(`Total size: ${(status.stats.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
          console.log(`Average size: ${(status.stats.averageSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
          console.log(`Daily backups: ${status.stats.dailyCount}`);
          console.log(`Weekly backups: ${status.stats.weeklyCount}`);
        }
        break;

      case 'cleanup':
        console.log('🧹 Cleaning up old backups...');
        await backupService.cleanupOldBackups();
        console.log('✅ Cleanup completed!');
        break;

      case 'verify':
        if (!backupPath) {
          console.error('❌ Please specify a backup path to verify');
          console.log('Usage: node scripts/backup-manager.js verify <backup-path>');
          process.exit(1);
        }

        const verifyPath = path.isAbsolute(backupPath)
          ? backupPath
          : path.join(process.cwd(), backupPath);

        console.log(`🔍 Verifying backup: ${verifyPath}`);
        const isValid = await backupService.verifyBackup(verifyPath);

        if (isValid) {
          console.log('✅ Backup verification passed!');
        } else {
          console.error('❌ Backup verification failed!');
          process.exit(1);
        }
        break;

      default:
        console.log('📖 Backup Manager - Available commands:');
        console.log('  backup                    - Create a manual backup');
        console.log('  restore <backup-path>     - Restore from a specific backup');
        console.log('  list                      - List all available backups');
        console.log('  status                    - Show backup system status');
        console.log('  cleanup                   - Remove old backups');
        console.log('  verify <backup-path>      - Verify backup integrity');
        console.log('\n📝 Examples:');
        console.log('  node scripts/backup-manager.js backup');
        console.log('  node scripts/backup-manager.js restore ./backups/daily_2025-12-15T10-30-00-000Z');
        console.log('  node scripts/backup-manager.js status');
        break;
    }

  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { main };
