# Backup Strategy

## Overview

This guide covers backup strategies for the LocalPro Super App.

## Backup Components

### Database Backups

- **MongoDB** - Primary database
- **Frequency** - Daily
- **Retention** - 30 days

### Application Backups

- **Code** - Git repository
- **Configuration** - Environment variables
- **Files** - Cloudinary (automatic)

## MongoDB Backups

### Manual Backup

```bash
# Backup database
mongodump --uri="$MONGODB_URI" --out=./backups/$(date +%Y%m%d)

# Backup specific collection
mongodump --uri="$MONGODB_URI" --collection=users --out=./backups
```

### Automated Backup Script

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="./backups/$DATE"
MONGODB_URI="${MONGODB_URI}"

mkdir -p "$BACKUP_DIR"

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR"

# Compress backup
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Upload to cloud storage (optional)
# aws s3 cp "$BACKUP_DIR.tar.gz" s3://backups/
```

### Cron Job

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-database.sh
```

## MongoDB Atlas Backups

MongoDB Atlas provides automatic backups:
- Continuous backups
- Point-in-time recovery
- Snapshot backups

## File Backups

### Cloudinary

Cloudinary provides automatic backups:
- Image backups
- Version history
- CDN distribution

### Manual File Backup

```bash
# Backup uploaded files (if stored locally)
tar -czf files-backup.tar.gz ./uploads/
```

## Configuration Backups

### Environment Variables

```bash
# Backup .env file
cp .env .env.backup.$(date +%Y%m%d)
```

### Application Settings

Application settings stored in database are included in MongoDB backups.

## Backup Verification

### Test Restores

Regularly test backup restoration:

```bash
# Restore backup
mongorestore --uri="$MONGODB_URI" ./backups/20251216/
```

### Backup Integrity

```bash
# Verify backup
mongodump --uri="$MONGODB_URI" --out=./test-backup
# Compare with original
```

## Backup Storage

### Local Storage

- Fast access
- Limited space
- Risk of loss

### Cloud Storage

- Scalable
- Redundant
- Off-site

### Recommended

- **Primary**: Local storage (fast restore)
- **Secondary**: Cloud storage (disaster recovery)

## Backup Schedule

### Daily Backups

- Full database backup
- Configuration backup

### Weekly Backups

- Full system backup
- Archive old backups

### Monthly Backups

- Long-term archive
- Compliance backups

## Disaster Recovery

### Recovery Plan

1. **Identify failure** - What failed?
2. **Assess impact** - How critical?
3. **Restore backup** - Latest backup
4. **Verify restoration** - Test functionality
5. **Document incident** - Learn from it

### Recovery Time Objective (RTO)

- **Target**: < 1 hour
- **Maximum**: < 4 hours

### Recovery Point Objective (RPO)

- **Target**: < 1 hour data loss
- **Maximum**: < 24 hours data loss

## Best Practices

1. **Automate backups** - Don't rely on manual
2. **Test restores** - Regularly verify backups
3. **Multiple locations** - Don't keep all backups in one place
4. **Encrypt backups** - Protect sensitive data
5. **Document process** - Clear recovery procedures

## Backup Tools

- **mongodump** - MongoDB backup
- **mongorestore** - MongoDB restore
- **AWS S3** - Cloud storage
- **Google Cloud Storage** - Cloud storage
- **Azure Blob** - Cloud storage

## Next Steps

- Review [Production Deployment](./production.md)
- Check [Monitoring Guide](./monitoring.md)
- Read [Troubleshooting Guide](../troubleshooting/common-issues.md)

