const cron = require('node-cron');
const logger = require('../config/logger');
const NotificationService = require('./notificationService');
const UserSettings = require('../models/UserSettings');
const User = require('../models/User');
const Job = require('../models/Job');
const { Notification } = require('../models/Communication');
const Provider = require('../models/Provider');
const ProviderProfessionalInfo = require('../models/ProviderProfessionalInfo');
const ProviderSkill = require('../models/ProviderSkill');

/**
 * Automated Job Board Digest Service
 *
 * Sends a periodic "new jobs" digest to users who opted in to job matches.
 * Keeps it simple: counts jobs in the last N days and links users to the job board.
 */
class AutomatedJobBoardDigestService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) return;

    const timezone = process.env.TZ || 'UTC';
    const schedule = process.env.JOB_DIGEST_SCHEDULE || '0 9 * * 1'; // Monday 9am

    this.job = cron.schedule(
      schedule,
      async () => {
        await this.runOnce();
      },
      { timezone }
    );

    this.isRunning = true;
    logger.info('Automated job digest service started', { schedule, timezone });
  }

  stop() {
    if (this.job) this.job.stop();
    this.job = null;
    this.isRunning = false;
  }

  async runOnce() {
    if (process.env.ENABLE_AUTOMATED_JOB_DIGEST !== 'true') return;

    const lookbackDays = parseInt(process.env.JOB_DIGEST_LOOKBACK_DAYS || '7');
    const dedupDays = parseInt(process.env.JOB_DIGEST_DEDUP_DAYS || '6');
    const maxUsers = parseInt(process.env.JOB_DIGEST_MAX_USERS || '1000');

    const now = new Date();
    const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const dedupCutoff = new Date(now.getTime() - dedupDays * 24 * 60 * 60 * 1000);

    const matchingEnabled = process.env.JOB_DIGEST_MATCHING_ENABLED === 'true';

    const newJobs = await Job.find({
      status: 'active',
      createdAt: { $gte: since }
    })
      .select('_id title company.location requirements.skills createdAt')
      .lean();

    const newJobsCount = newJobs.length;

    if (newJobsCount === 0) {
      logger.info('Job digest: no new jobs in lookback window', { lookbackDays });
      return;
    }

    // Opt-in via notifications.email.jobMatches
    const settings = await UserSettings.find({
      'notifications.email.enabled': true,
      'notifications.email.jobMatches': true
    })
      .select('userId')
      .limit(maxUsers)
      .lean();

    const userIds = settings.map(s => s.userId).filter(Boolean);
    if (userIds.length === 0) return;

    // Target "provider" users only
    const users = await User.find({ _id: { $in: userIds }, isActive: true, roles: { $in: ['provider'] } })
      .select('_id profile.address.city profile.address.state')
      .limit(maxUsers)
      .lean();

    const eligibleUserIds = users.map(u => u._id);
    if (eligibleUserIds.length === 0) return;

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const jobBoardUrl = `${frontend}/jobs`;

    // Optional skill/location matching (best-effort)
    const providerMatchMap = new Map();
    if (matchingEnabled) {
      const providers = await Provider.find({ userId: { $in: eligibleUserIds }, deleted: false })
        .select('_id userId professionalInfo')
        .lean();

      const profIds = providers.map(p => p.professionalInfo).filter(Boolean);
      const professionalInfos = await ProviderProfessionalInfo.find({ _id: { $in: profIds } })
        .select('provider specialties.skills specialties.serviceAreas')
        .lean();

      const skillIds = new Set();
      for (const pi of professionalInfos) {
        for (const sp of pi.specialties || []) {
          for (const sid of sp.skills || []) skillIds.add(String(sid));
        }
      }

      const skills = await ProviderSkill.find({ _id: { $in: Array.from(skillIds) } }).select('name').lean();
      const skillNameById = new Map(skills.map(s => [String(s._id), (s.name || '').toLowerCase()]));

      const profByProvider = new Map(professionalInfos.map(pi => [String(pi.provider), pi]));
      const userById = new Map(users.map(u => [String(u._id), u]));

      for (const p of providers) {
        const user = userById.get(String(p.userId));
        const prof = profByProvider.get(String(p._id));
        if (!user || !prof) continue;

        const userCity = (user.profile?.address?.city || '').toLowerCase();
        const userState = (user.profile?.address?.state || '').toLowerCase();

        const providerSkills = new Set();
        const providerAreas = [];

        for (const sp of prof.specialties || []) {
          for (const sid of sp.skills || []) {
            const n = skillNameById.get(String(sid));
            if (n) providerSkills.add(n);
          }
          for (const a of sp.serviceAreas || []) {
            providerAreas.push({
              city: (a.city || '').toLowerCase(),
              state: (a.state || '').toLowerCase()
            });
          }
        }

        let matched = 0;
        for (const j of newJobs) {
          const jobCity = (j.company?.location?.city || '').toLowerCase();
          const jobState = (j.company?.location?.state || '').toLowerCase();
          const isRemote = !!j.company?.location?.isRemote;

          const locationOk =
            isRemote ||
            (userCity && jobCity && userCity === jobCity) ||
            (userState && jobState && userState === jobState) ||
            providerAreas.some(a => (a.city && jobCity && a.city === jobCity) || (a.state && jobState && a.state === jobState));

          if (!locationOk) continue;

          const jobSkills = (j.requirements?.skills || []).map(s => (s || '').toLowerCase());
          const skillOk = jobSkills.length === 0 || jobSkills.some(s => providerSkills.has(s));
          if (!skillOk) continue;

          matched += 1;
        }

        providerMatchMap.set(String(p.userId), matched);
      }
    }

    let sent = 0;
    let skipped = 0;

    for (const uid of eligibleUserIds) {
      const existing = await Notification.findOne({
        user: uid,
        type: 'job_digest',
        createdAt: { $gte: dedupCutoff }
      })
        .select('_id')
        .lean();

      if (existing) {
        skipped += 1;
        continue;
      }

      await NotificationService.sendNotification({
        userId: uid,
        type: 'job_digest',
        title: 'New jobs this week',
        message: matchingEnabled
          ? `${providerMatchMap.get(String(uid)) || 0} job(s) may match your skills/location. Tap to explore and apply.`
          : `${newJobsCount} new job(s) were posted recently. Tap to explore and apply.`,
        data: {
          since: since.toISOString(),
          count: newJobsCount,
          matchedCount: matchingEnabled ? (providerMatchMap.get(String(uid)) || 0) : undefined,
          url: jobBoardUrl
        },
        priority: 'low'
      });
      sent += 1;
    }

    logger.info('Job digest completed', { newJobsCount, recipients: eligibleUserIds.length, sent, skipped });
  }
}

module.exports = new AutomatedJobBoardDigestService();


