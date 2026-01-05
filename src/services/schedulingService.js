/**
 * AI-Powered Smart Scheduling Service
 * 
 * Provides intelligent job ranking and scheduling suggestions for providers
 * References: JobRankingScore, SchedulingSuggestion, Job, Provider, ProviderPerformance, ProviderProfessionalInfo
 */

const JobRankingScore = require('../models/JobRankingScore');
const SchedulingSuggestion = require('../models/SchedulingSuggestion');
const Job = require('../models/Job');
const Provider = require('../models/Provider');
const ProviderPerformance = require('../models/ProviderPerformance');
const ProviderProfessionalInfo = require('../models/ProviderProfessionalInfo');
const ProviderPreferences = require('../models/ProviderPreferences');
const JobSchedule = require('../models/JobSchedule');
const CalendarAvailability = require('../models/CalendarAvailability');
const GoogleMapsService = require('./googleMapsService');
const logger = require('../config/logger');

class SchedulingService {
  constructor() {
    // Weight factors for scoring (can be adjusted based on learning)
    this.scoreWeights = {
      skillsMatch: 0.25,
      certificationsMatch: 0.15,
      locationScore: 0.20,
      etaScore: 0.10,
      earningsScore: 0.15,
      performanceScore: 0.10,
      ratingsScore: 0.05
    };
  }

  /**
   * Calculate ranking score for a job for a specific provider
   */
  async calculateJobRanking(providerId, jobId) {
    try {
      const provider = await Provider.findOne({ userId: providerId }).populate('professionalInfo performance preferences');
      if (!provider) {
        throw new Error('Provider not found');
      }

      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const professionalInfo = await ProviderProfessionalInfo.findOne({ provider: provider._id });
      const performance = await ProviderPerformance.findOne({ provider: provider._id });
      const preferences = await ProviderPreferences.findOne({ provider: provider._id });

      // Calculate individual scores
      const skillsScore = await this._calculateSkillsMatchScore(professionalInfo, job);
      const certificationsScore = await this._calculateCertificationsMatchScore(professionalInfo, job);
      const { locationScore, distance, estimatedTravelTime } = await this._calculateLocationScore(provider, job);
      const etaScore = this._calculateETAScore(estimatedTravelTime);
      const earningsScore = await this._calculateEarningsScore(job, professionalInfo);
      const performanceScore = await this._calculatePerformanceScore(performance, job);
      const ratingsScore = this._calculateRatingsScore(performance);

      // Calculate overall score (weighted average)
      const overallScore = 
        (skillsScore * this.scoreWeights.skillsMatch) +
        (certificationsScore * this.scoreWeights.certificationsMatch) +
        (locationScore * this.scoreWeights.locationScore) +
        (etaScore * this.scoreWeights.etaScore) +
        (earningsScore * this.scoreWeights.earningsScore) +
        (performanceScore * this.scoreWeights.performanceScore) +
        (ratingsScore * this.scoreWeights.ratingsScore);

      // Extract matched skills and certifications
      const matchedSkills = this._getMatchedSkills(professionalInfo, job);
      const matchedCertifications = this._getMatchedCertifications(professionalInfo, job);

      // Calculate estimated earnings
      const estimatedEarnings = this._estimateEarnings(job);
      const estimatedEarningsPerHour = estimatedEarnings / (estimatedTravelTime / 60 + 2); // Assuming 2 hours average job duration

      const scoreData = {
        overallScore: Math.round(overallScore),
        scoreBreakdown: {
          skillsMatch: Math.round(skillsScore),
          certificationsMatch: Math.round(certificationsScore),
          locationScore: Math.round(locationScore),
          etaScore: Math.round(etaScore),
          earningsScore: Math.round(earningsScore),
          performanceScore: Math.round(performanceScore),
          ratingsScore: Math.round(ratingsScore)
        },
        details: {
          matchedSkills: matchedSkills,
          matchedCertifications: matchedCertifications,
          distance: distance,
          estimatedTravelTime: estimatedTravelTime,
          estimatedEarnings: estimatedEarnings,
          estimatedEarningsPerHour: estimatedEarningsPerHour,
          jobCategoryMatch: professionalInfo && job.category ? 
            professionalInfo.specialties.some(s => s.category.toString() === job.category.toString()) : false,
          jobTypeMatch: preferences ? 
            preferences.jobPreferences.preferredJobTypes.includes(job.jobType) : false
        }
      };

      // Store or update ranking
      const ranking = await JobRankingScore.findOrCreateRanking(providerId, jobId, scoreData);

      return ranking;
    } catch (error) {
      logger.error('Error calculating job ranking:', error);
      throw error;
    }
  }

  /**
   * Rank multiple jobs for a provider
   */
  async rankJobsForProvider(providerId, jobIds, limit = 50) {
    try {
      const rankings = [];

      for (const jobId of jobIds) {
        try {
          const ranking = await this.calculateJobRanking(providerId, jobId);
          rankings.push(ranking);
        } catch (error) {
          logger.warn(`Error ranking job ${jobId} for provider ${providerId}:`, error.message);
        }
      }

      // Sort by overall score descending
      rankings.sort((a, b) => b.overallScore - a.overallScore);

      return rankings.slice(0, limit);
    } catch (error) {
      logger.error('Error ranking jobs for provider:', error);
      throw error;
    }
  }

  /**
   * Generate daily schedule suggestions
   */
  async generateDailyScheduleSuggestion(providerId, date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      // Get available jobs
      const activeJobs = await Job.find({
        status: 'active',
        isActive: true,
        'applicationProcess.startDate': { $lte: endDate }
      }).limit(100);

      // Rank jobs for this provider
      const jobIds = activeJobs.map(j => j._id);
      const rankings = await this.rankJobsForProvider(providerId, jobIds, 20);

      // Get provider availability (for future conflict detection)
      await CalendarAvailability.findAvailability(providerId, startDate, endDate);
      await JobSchedule.findSchedules(providerId, startDate, endDate);

      // Generate suggestions based on availability
      const suggestedJobs = [];
      for (const ranking of rankings.slice(0, 10)) {
        const job = await Job.findById(ranking.job);
        if (!job) continue;

        // Simple scheduling logic - can be enhanced
        suggestedJobs.push({
          job: job._id,
          rankingScore: ranking._id,
          suggestedStartTime: new Date(startDate.getTime() + 9 * 60 * 60 * 1000), // 9 AM
          suggestedEndTime: new Date(startDate.getTime() + 11 * 60 * 60 * 1000), // 11 AM
          reason: `High match score (${ranking.overallScore}/100)`,
          priority: Math.ceil(ranking.overallScore / 10)
        });
      }

      const estimatedEarnings = suggestedJobs.reduce((sum, sj) => {
        const ranking = rankings.find(r => r._id.toString() === sj.rankingScore.toString());
        return sum + (ranking ? ranking.details.estimatedEarnings : 0);
      }, 0);

      const estimatedHours = suggestedJobs.reduce((sum, sj) => {
        const start = new Date(sj.suggestedStartTime);
        const end = new Date(sj.suggestedEndTime);
        return sum + ((end - start) / (1000 * 60 * 60));
      }, 0);

      const averageScore = rankings.length > 0 ?
        rankings.slice(0, suggestedJobs.length).reduce((sum, r) => sum + r.overallScore, 0) / suggestedJobs.length : 0;

      const expiresAt = new Date(endDate);
      expiresAt.setDate(expiresAt.getDate() + 1);

      const suggestion = new SchedulingSuggestion({
        provider: providerId,
        type: 'daily',
        suggestedJobs: suggestedJobs,
        dateRange: {
          start: startDate,
          end: endDate
        },
        summary: {
          totalJobs: suggestedJobs.length,
          estimatedEarnings: estimatedEarnings,
          estimatedHours: estimatedHours,
          averageScore: averageScore
        },
        expiresAt: expiresAt
      });

      await suggestion.save();
      return suggestion;
    } catch (error) {
      logger.error('Error generating daily schedule suggestion:', error);
      throw error;
    }
  }

  /**
   * Generate weekly schedule suggestions
   */
  async generateWeeklyScheduleSuggestion(providerId, weekStartDate) {
    try {
      const startDate = new Date(weekStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);

      // Similar logic to daily but for the week
      const activeJobs = await Job.find({
        status: 'active',
        isActive: true,
        'applicationProcess.startDate': { $lte: endDate }
      }).limit(200);

      const jobIds = activeJobs.map(j => j._id);
      const rankings = await this.rankJobsForProvider(providerId, jobIds, 50);

      // Generate suggestions for the week (simplified - can be enhanced)
      const suggestedJobs = rankings.slice(0, 20).map((ranking, index) => ({
        job: ranking.job,
        rankingScore: ranking._id,
        suggestedStartTime: new Date(startDate.getTime() + (index % 7) * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
        suggestedEndTime: new Date(startDate.getTime() + (index % 7) * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
        reason: `Weekly recommendation - Score: ${ranking.overallScore}/100`,
        priority: Math.ceil(ranking.overallScore / 10)
      }));

      const estimatedEarnings = suggestedJobs.reduce((sum, sj) => {
        const ranking = rankings.find(r => r._id.toString() === sj.rankingScore.toString());
        return sum + (ranking ? ranking.details.estimatedEarnings : 0);
      }, 0);

      const estimatedHours = suggestedJobs.reduce((sum, sj) => {
        const start = new Date(sj.suggestedStartTime);
        const end = new Date(sj.suggestedEndTime);
        return sum + ((end - start) / (1000 * 60 * 60));
      }, 0);

      const averageScore = rankings.length > 0 ?
        rankings.slice(0, suggestedJobs.length).reduce((sum, r) => sum + r.overallScore, 0) / suggestedJobs.length : 0;

      const expiresAt = new Date(endDate);
      expiresAt.setDate(expiresAt.getDate() + 1);

      const suggestion = new SchedulingSuggestion({
        provider: providerId,
        type: 'weekly',
        suggestedJobs: suggestedJobs,
        dateRange: {
          start: startDate,
          end: endDate
        },
        summary: {
          totalJobs: suggestedJobs.length,
          estimatedEarnings: estimatedEarnings,
          estimatedHours: estimatedHours,
          averageScore: averageScore
        },
        expiresAt: expiresAt
      });

      await suggestion.save();
      return suggestion;
    } catch (error) {
      logger.error('Error generating weekly schedule suggestion:', error);
      throw error;
    }
  }

  /**
   * Detect idle time and suggest fill-in jobs
   */
  async detectIdleTimeAndSuggestJobs(providerId, startDate, endDate) {
    try {
      const schedules = await JobSchedule.findSchedules(providerId, startDate, endDate, 'scheduled');
      const availability = await CalendarAvailability.findAvailability(providerId, startDate, endDate);

      // Find gaps in schedule (idle time)
      const gaps = this._findScheduleGaps(schedules, availability, startDate, endDate);

      if (gaps.length === 0) {
        return [];
      }

      // Get active jobs
      const activeJobs = await Job.find({
        status: 'active',
        isActive: true
      }).limit(100);

      const jobIds = activeJobs.map(j => j._id);
      const rankings = await this.rankJobsForProvider(providerId, jobIds, 30);

      // Match jobs to gaps
      const fillInSuggestions = [];
      for (const gap of gaps) {
        const gapDuration = (gap.end - gap.start) / (1000 * 60 * 60); // hours

        // Find jobs that fit in the gap
        for (const ranking of rankings) {
          const job = await Job.findById(ranking.job);
          if (!job) continue;

          // Simple fit check - can be enhanced
          if (gapDuration >= 2) { // At least 2 hours
            fillInSuggestions.push({
              job: job._id,
              rankingScore: ranking._id,
              suggestedStartTime: gap.start,
              suggestedEndTime: new Date(gap.start.getTime() + 2 * 60 * 60 * 1000),
              reason: `Fill-in job for idle time - Score: ${ranking.overallScore}/100`,
              priority: Math.ceil(ranking.overallScore / 10)
            });
            break; // One job per gap for now
          }
        }
      }

      if (fillInSuggestions.length > 0) {
        const suggestion = new SchedulingSuggestion({
          provider: providerId,
          type: 'idle_time',
          suggestedJobs: fillInSuggestions,
          dateRange: {
            start: startDate,
            end: endDate
          },
          summary: {
            totalJobs: fillInSuggestions.length,
            estimatedEarnings: fillInSuggestions.reduce((sum, sj) => {
              const ranking = rankings.find(r => r._id.toString() === sj.rankingScore.toString());
              return sum + (ranking ? ranking.details.estimatedEarnings : 0);
            }, 0),
            estimatedHours: fillInSuggestions.reduce((sum, sj) => {
              const start = new Date(sj.suggestedStartTime);
              const end = new Date(sj.suggestedEndTime);
              return sum + ((end - start) / (1000 * 60 * 60));
            }, 0),
            averageScore: rankings.length > 0 ?
              rankings.slice(0, fillInSuggestions.length).reduce((sum, r) => sum + r.overallScore, 0) / fillInSuggestions.length : 0
          },
          expiresAt: endDate
        });

        await suggestion.save();
        return suggestion;
      }

      return null;
    } catch (error) {
      logger.error('Error detecting idle time:', error);
      throw error;
    }
  }

  /**
   * Learn from job outcomes (update weights based on performance)
   */
  async learnFromJobOutcome(providerId, jobId, outcome) {
    try {
      // This is a simplified learning mechanism
      // In a production system, you'd use machine learning models
      const ranking = await JobRankingScore.findOne({ provider: providerId, job: jobId });

      if (!ranking) {
        return;
      }

      // Adjust weights based on outcome
      // Positive outcomes increase weights, negative decrease
      // This is a placeholder for more sophisticated ML
      logger.info(`Learning from job outcome for provider ${providerId}, job ${jobId}: ${outcome}`);

      // In a real implementation, you'd:
      // 1. Store outcome data
      // 2. Train ML models
      // 3. Update scoring weights
      // 4. Improve predictions over time

      return true;
    } catch (error) {
      logger.error('Error learning from job outcome:', error);
      throw error;
    }
  }

  // Private helper methods

  async _calculateSkillsMatchScore(professionalInfo, job) {
    if (!professionalInfo || !job.requirements.skills) {
      return 0;
    }

    const jobSkills = job.requirements.skills || [];
    const providerSkills = professionalInfo.specialties.flatMap(s => 
      s.skills ? s.skills.map(skill => skill.toString()) : []
    );

    const matched = jobSkills.filter(js => providerSkills.includes(js));
    return jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 0;
  }

  async _calculateCertificationsMatchScore(professionalInfo, job) {
    if (!professionalInfo || !job.requirements.certifications) {
      return 0;
    }

    const jobCerts = job.requirements.certifications || [];
    const providerCerts = professionalInfo.specialties.flatMap(s => 
      s.certifications ? s.certifications.map(c => c.name) : []
    );

    const matched = jobCerts.filter(jc => providerCerts.some(pc => 
      pc.toLowerCase().includes(jc.toLowerCase()) || jc.toLowerCase().includes(pc.toLowerCase())
    ));
    return jobCerts.length > 0 ? (matched.length / jobCerts.length) * 100 : 0;
  }

  async _calculateLocationScore(provider, job) {
    try {
      // Get provider location (from User profile or ProviderProfessionalInfo)
      if (!provider || !provider.userId) {
        return { locationScore: 50, distance: null, estimatedTravelTime: 30 };
      }
      
      const User = require('../models/User');
      const user = await User.findById(provider.userId);
      
      if (!user || !user.profile || !job.company?.location?.coordinates) {
        return { locationScore: 50, distance: null, estimatedTravelTime: 30 }; // Default
      }

      // Try to get provider location from various possible fields
      let providerLocation = null;
      if (user.profile.address?.coordinates) {
        providerLocation = user.profile.address.coordinates;
      } else if (user.profile.address?.lat && user.profile.address?.lng) {
        providerLocation = { lat: user.profile.address.lat, lng: user.profile.address.lng };
      } else if (user.profile.location) {
        providerLocation = user.profile.location;
      }

      const jobLocation = job.company.location.coordinates;

      if (!providerLocation || !providerLocation.lat || !providerLocation.lng || !jobLocation || !jobLocation.lat || !jobLocation.lng) {
        return { locationScore: 50, distance: null, estimatedTravelTime: 30 };
      }

      // Calculate distance using Google Maps
      const distanceResult = await GoogleMapsService.calculateDistance(
        { lat: providerLocation.lat, lng: providerLocation.lng },
        { lat: jobLocation.lat, lng: jobLocation.lng },
        { mode: 'driving' }
      );

      if (!distanceResult.success) {
        return { locationScore: 50, distance: null, estimatedTravelTime: 30 };
      }

      const distance = distanceResult.distance.value / 1000; // Convert to km
      const estimatedTravelTime = distanceResult.duration.value / 60; // Convert to minutes

      // Score based on distance (closer = higher score, max 50km = 0 score)
      const maxDistance = 50; // km
      const locationScore = Math.max(0, 100 * (1 - distance / maxDistance));

      return { locationScore, distance, estimatedTravelTime };
    } catch (error) {
      logger.error('Error calculating location score:', error);
      return { locationScore: 50, distance: null, estimatedTravelTime: 30 };
    }
  }

  _calculateETAScore(estimatedTravelTime) {
    // Lower travel time = higher score
    // 0-15 min = 100, 15-30 min = 80, 30-60 min = 60, 60+ min = 40
    if (estimatedTravelTime <= 15) return 100;
    if (estimatedTravelTime <= 30) return 80;
    if (estimatedTravelTime <= 60) return 60;
    return 40;
  }

  async _calculateEarningsScore(job, professionalInfo) {
    if (!job.salary || (!job.salary.min && !job.salary.max)) {
      return 50; // Unknown salary
    }

    const salary = job.salary.min || job.salary.max;
    const period = job.salary.period || 'yearly';

    // Convert to hourly (simplified)
    let hourlyRate = salary;
    if (period === 'yearly') hourlyRate = salary / (52 * 40);
    else if (period === 'monthly') hourlyRate = salary / (4 * 40);
    else if (period === 'weekly') hourlyRate = salary / 40;
    else if (period === 'daily') hourlyRate = salary / 8;

    // Compare with provider's typical rate
    if (professionalInfo && professionalInfo.specialties.length > 0) {
      const avgRate = professionalInfo.specialties.reduce((sum, s) => 
        sum + (s.hourlyRate || 0), 0) / professionalInfo.specialties.length;
      if (avgRate > 0) {
        // Score based on how much higher/lower than average
        return Math.min(100, Math.max(0, (hourlyRate / avgRate) * 50 + 50));
      }
    }

    // Default scoring (higher = better, normalize to 0-100)
    return Math.min(100, (hourlyRate / 50) * 100);
  }

  async _calculatePerformanceScore(performance, _job) {
    if (!performance) {
      return 50;
    }

    // Score based on completion rate and rating
    const completionRateScore = performance.completionRate || 0;
    const ratingScore = (performance.rating || 0) * 20; // 5 stars = 100

    return (completionRateScore + ratingScore) / 2;
  }

  _calculateRatingsScore(performance) {
    if (!performance || !performance.rating) {
      return 50;
    }

    // Convert 5-star rating to 0-100 score
    return performance.rating * 20;
  }

  _getMatchedSkills(professionalInfo, job) {
    if (!professionalInfo || !job.requirements.skills) {
      return [];
    }

    const jobSkills = job.requirements.skills || [];
    const providerSkills = professionalInfo.specialties.flatMap(s => 
      s.skills ? s.skills.map(skill => skill.toString()) : []
    );

    return jobSkills.filter(js => providerSkills.includes(js));
  }

  _getMatchedCertifications(professionalInfo, job) {
    if (!professionalInfo || !job.requirements.certifications) {
      return [];
    }

    const jobCerts = job.requirements.certifications || [];
    const providerCerts = professionalInfo.specialties.flatMap(s => 
      s.certifications ? s.certifications.map(c => c.name) : []
    );

    return jobCerts.filter(jc => providerCerts.some(pc => 
      pc.toLowerCase().includes(jc.toLowerCase()) || jc.toLowerCase().includes(pc.toLowerCase())
    ));
  }

  _estimateEarnings(job) {
    if (!job.salary || (!job.salary.min && !job.salary.max)) {
      return 0;
    }

    const salary = job.salary.min || job.salary.max;
    const period = job.salary.period || 'yearly';

    // Estimate for a 2-hour job
    let hourlyRate = salary;
    if (period === 'yearly') hourlyRate = salary / (52 * 40);
    else if (period === 'monthly') hourlyRate = salary / (4 * 40);
    else if (period === 'weekly') hourlyRate = salary / 40;
    else if (period === 'daily') hourlyRate = salary / 8;

    return hourlyRate * 2; // 2 hours
  }

  _findScheduleGaps(schedules, availability, startDate, endDate) {
    // Simplified gap detection - can be enhanced
    const gaps = [];
    const sortedSchedules = [...schedules].sort((a, b) => 
      a.scheduledStartTime - b.scheduledStartTime
    );

    let currentTime = new Date(startDate);
    for (const schedule of sortedSchedules) {
      if (schedule.scheduledStartTime > currentTime) {
        gaps.push({
          start: new Date(currentTime),
          end: new Date(schedule.scheduledStartTime)
        });
      }
      currentTime = schedule.scheduledEndTime > currentTime ? schedule.scheduledEndTime : currentTime;
    }

    if (currentTime < endDate) {
      gaps.push({
        start: new Date(currentTime),
        end: new Date(endDate)
      });
    }

    return gaps.filter(gap => (gap.end - gap.start) / (1000 * 60 * 60) >= 1); // At least 1 hour gaps
  }
}

module.exports = new SchedulingService();
