# 🚀 Automation Quick Start Guide

## Get Started in 5 Minutes

This guide will help you implement the first automation (Automated Backups) in just a few minutes.

---

## Step 1: Install Dependencies (1 minute)

```bash
npm install node-cron
```

---

## Step 2: Update Your .env File (1 minute)

Add these lines to your `.env` file:

```env
# Enable automated backups
ENABLE_AUTOMATED_BACKUPS=true

# Backup retention (optional - defaults shown)
BACKUP_RETENTION_DAYS=7
BACKUP_RETENTION_WEEKS=4
BACKUP_RETENTION_MONTHS=12
```

---

## Step 3: Verify Files Are Created (30 seconds)

The following files should already be created:
- ✅ `src/services/automatedBackupService.js` - Backup service
- ✅ `src/server.js` - Updated with integration code

If they're not there, check the `AUTOMATION_SUGGESTIONS.md` file for the code.

---

## Step 4: Test the Implementation (2 minutes)

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Check the logs** - You should see:
   ```
   ✅ Automated backup service started
   ```

3. **Manually trigger a backup** (optional test):
   ```bash
   # If you have an admin token, test the backup endpoint:
   curl -X POST http://localhost:4000/api/database/optimization/backup \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

4. **Verify backup was created:**
   ```bash
   ls -la backups/
   # You should see backup files with timestamps
   ```

---

## Step 5: Verify Scheduled Backups (Wait or Adjust Schedule)

The backups are scheduled to run:
- **Daily:** 2 AM UTC
- **Weekly:** 3 AM UTC (Sundays)
- **Monthly:** 4 AM UTC (1st of each month)
- **Cleanup:** 5 AM UTC (daily)

### To Test Immediately (Optional):

You can temporarily adjust the schedule in `src/services/automatedBackupService.js`:

```javascript
// Change from:
cron.schedule('0 2 * * *', async () => {
// To (runs every minute for testing):
cron.schedule('* * * * *', async () => {
```

**Remember to change it back after testing!**

---

## ✅ Success Checklist

- [ ] `node-cron` installed
- [ ] Environment variables added to `.env`
- [ ] Server starts without errors
- [ ] "Automated backup service started" appears in logs
- [ ] Backup directory exists (`backups/`)
- [ ] Manual backup test works (optional)

---

## 🎉 You're Done!

Your automated backups are now running! The system will:
- ✅ Create daily backups at 2 AM
- ✅ Create weekly backups on Sundays at 3 AM
- ✅ Create monthly backups on the 1st at 4 AM
- ✅ Clean up old backups daily at 5 AM

---

## 📊 Monitor Your Backups

### Check Backup Stats:

You can add this endpoint to monitor backups (add to a monitoring route):

```javascript
router.get('/backups/stats', async (req, res) => {
  const automatedBackupService = require('../services/automatedBackupService');
  const stats = automatedBackupService.getStats();
  res.json({ success: true, data: stats });
});
```

### View Backup Files:

```bash
# List all backups
ls -lh backups/

# Check backup sizes
du -sh backups/*
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'node-cron'"
**Solution:** Run `npm install node-cron`

### Issue: "Automated backup service started" not appearing
**Solution:** 
- Check `ENABLE_AUTOMATED_BACKUPS=true` in `.env`
- Check server logs for errors
- Verify `src/services/automatedBackupService.js` exists

### Issue: Backups not being created
**Solution:**
- Check database connection
- Verify `databaseOptimizationService` is working
- Check file permissions on `backups/` directory
- Review server logs for errors

### Issue: Backups created but not cleaned up
**Solution:**
- Verify cleanup cron job is running
- Check retention period settings
- Review cleanup logs

---

## 📚 Next Steps

Now that backups are automated, you can:

1. **Implement Log Cleanup** - See `AUTOMATION_SUGGESTIONS.md` Step 3
2. **Set Up Index Management** - See `AUTOMATION_SUGGESTIONS.md` Step 4
3. **Configure Cloud Storage** - Add AWS S3 or Google Cloud Storage for backup uploads
4. **Set Up Monitoring** - Add alerts for backup failures

---

## 💡 Pro Tips

1. **Test in Development First:** Always test automations in development before production
2. **Monitor First Few Executions:** Watch the first few scheduled backups closely
3. **Set Up Alerts:** Configure alerts for backup failures
4. **Regular Verification:** Periodically verify backups can be restored
5. **Document Your Setup:** Keep notes on your backup configuration

---

## 🆘 Need Help?

- Check `AUTOMATION_SUGGESTIONS.md` for detailed implementation guides
- Review server logs for error messages
- Verify all environment variables are set correctly
- Test manual backup first before relying on scheduled backups

---

**Ready for the next automation?** Check out `AUTOMATION_SUGGESTIONS.md` for the complete list!

