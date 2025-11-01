const Provider = require('../models/Provider');
const { logger } = require('../utils/logger');
const { auditLogger } = require('../utils/auditLogger');

class ProviderVerificationService {
  constructor() {
    this.onboardingSteps = [
      'profile_setup',
      'business_info',
      'professional_info',
      'verification',
      'documents',
      'portfolio',
      'preferences',
      'review'
    ];
    
    this.verificationRequirements = {
      individual: {
        required: ['identity', 'background_check', 'insurance'],
        optional: ['licenses', 'references']
      },
      business: {
        required: ['identity', 'business_registration', 'insurance', 'background_check'],
        optional: ['licenses', 'references', 'tax_documents']
      },
      agency: {
        required: ['identity', 'business_registration', 'insurance', 'background_check', 'agency_license'],
        optional: ['licenses', 'references', 'tax_documents', 'bonding']
      }
    };
  }

  // Get onboarding progress
  async getOnboardingProgress(userId) {
    try {
      const provider = await Provider.findOne({ userId });
      if (!provider) {
        return {
          completed: false,
          progress: 0,
          currentStep: 'profile_setup',
          steps: this.onboardingSteps.map(step => ({
            step,
            completed: false,
            required: true
          }))
        };
      }

      const steps = this.onboardingSteps.map(step => {
        const stepData = provider.onboarding.steps.find(s => s.step === step);
        return {
          step,
          completed: stepData ? stepData.completed : false,
          completedAt: stepData ? stepData.completedAt : null,
          required: true,
          data: stepData ? stepData.data : null
        };
      });

      return {
        completed: provider.onboarding.completed,
        progress: provider.onboarding.progress,
        currentStep: provider.onboarding.currentStep,
        steps
      };
    } catch (error) {
      logger.error('Failed to get onboarding progress', error, { userId });
      throw error;
    }
  }

  // Validate onboarding step
  async validateOnboardingStep(userId, step, data) {
    try {
      const provider = await Provider.findOne({ userId });
      if (!provider) {
        throw new Error('Provider profile not found');
      }

      const validation = {
        valid: true,
        errors: [],
        warnings: []
      };

      switch (step) {
        case 'profile_setup':
          validation.valid = this.validateProfileSetup(data);
          if (!validation.valid) {
            validation.errors.push('Profile setup is incomplete');
          }
          break;

        case 'business_info':
          if (provider.providerType !== 'individual') {
            validation.valid = this.validateBusinessInfo(data);
            if (!validation.valid) {
              validation.errors.push('Business information is incomplete');
            }
          }
          break;

        case 'professional_info':
          validation.valid = this.validateProfessionalInfo(data);
          if (!validation.valid) {
            validation.errors.push('Professional information is incomplete');
          }
          break;

        case 'verification':
          validation.valid = this.validateVerificationInfo(data, provider.providerType);
          if (!validation.valid) {
            validation.errors.push('Verification information is incomplete');
          }
          break;

        case 'documents':
          validation.valid = this.validateDocuments(data, provider.providerType);
          if (!validation.valid) {
            validation.errors.push('Required documents are missing');
          }
          break;

        case 'portfolio':
          validation.valid = this.validatePortfolio(data);
          if (!validation.valid) {
            validation.warnings.push('Portfolio is empty - consider adding work samples');
          }
          break;

        case 'preferences':
          validation.valid = this.validatePreferences(data);
          if (!validation.valid) {
            validation.errors.push('Preferences configuration is incomplete');
          }
          break;

        case 'review':
          validation.valid = await this.validateCompleteProfile(provider);
          if (!validation.valid) {
            validation.errors.push('Profile is not ready for submission');
          }
          break;

        default:
          validation.valid = false;
          validation.errors.push('Invalid onboarding step');
      }

      return validation;
    } catch (error) {
      logger.error('Failed to validate onboarding step', error, { userId, step });
      throw error;
    }
  }

  // Validate profile setup
  validateProfileSetup(data) {
    return data && data.providerType && ['individual', 'business', 'agency'].includes(data.providerType);
  }

  // Validate business information
  validateBusinessInfo(data) {
    return data && 
           data.businessName && 
           data.businessType && 
           data.businessAddress && 
           data.businessPhone;
  }

  // Validate professional information
  validateProfessionalInfo(data) {
    return data && 
           data.specialties && 
           Array.isArray(data.specialties) && 
           data.specialties.length > 0 &&
           data.specialties.every(s => s.category && s.serviceAreas && s.serviceAreas.length > 0);
  }

  // Validate verification information
  validateVerificationInfo(data, providerType) {
    const requirements = this.verificationRequirements[providerType];
    if (!requirements) return false;

    return requirements.required.every(req => {
      switch (req) {
        case 'identity':
          return data.identityVerified === true;
        case 'business_registration':
          return providerType !== 'individual' && data.businessVerified === true;
        case 'insurance':
          return data.insurance && data.insurance.hasInsurance === true;
        case 'background_check':
          return data.backgroundCheck && data.backgroundCheck.status === 'passed';
        case 'agency_license':
          return providerType === 'agency' && data.licenses && data.licenses.length > 0;
        default:
          return true;
      }
    });
  }

  // Validate documents
  validateDocuments(data, providerType) {
    const requirements = this.verificationRequirements[providerType];
    if (!requirements) return false;

    return requirements.required.every(req => {
      switch (req) {
        case 'identity':
          return data.identityDocuments && data.identityDocuments.length > 0;
        case 'business_registration':
          return providerType !== 'individual' && data.businessDocuments && data.businessDocuments.length > 0;
        case 'insurance':
          return data.insuranceDocuments && data.insuranceDocuments.length > 0;
        case 'background_check':
          return data.backgroundCheckDocuments && data.backgroundCheckDocuments.length > 0;
        case 'agency_license':
          return providerType === 'agency' && data.licenseDocuments && data.licenseDocuments.length > 0;
        default:
          return true;
      }
    });
  }

  // Validate portfolio
  validatePortfolio(data) {
    return data && (data.images || data.videos || data.descriptions);
  }

  // Validate preferences
  validatePreferences(data) {
    return data && 
           data.notificationSettings && 
           data.jobPreferences && 
           data.communicationPreferences;
  }

  // Validate complete profile
  async validateCompleteProfile(provider) {
    try {
      // Check if all required steps are completed
      const requiredSteps = this.onboardingSteps.slice(0, -1); // All except review
      const completedSteps = provider.onboarding.steps.filter(s => s.completed);
      
      if (completedSteps.length < requiredSteps.length) {
        return false;
      }

      // Check provider-specific requirements
      const requirements = this.verificationRequirements[provider.providerType];
      if (!requirements) return false;

      // Validate required fields
      if (!provider.professionalInfo || !provider.professionalInfo.specialties || provider.professionalInfo.specialties.length === 0) {
        return false;
      }

      if (provider.providerType !== 'individual' && (!provider.businessInfo || !provider.businessInfo.businessName)) {
        return false;
      }

      if (!provider.verification.identityVerified) {
        return false;
      }

      if (provider.providerType !== 'individual' && !provider.verification.businessVerified) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate complete profile', error, { providerId: provider._id });
      return false;
    }
  }

  // Submit provider for review
  async submitForReview(userId) {
    try {
      const provider = await Provider.findOne({ userId });
      if (!provider) {
        throw new Error('Provider profile not found');
      }

      // Validate complete profile
      const isValid = await this.validateCompleteProfile(provider);
      if (!isValid) {
        throw new Error('Profile is not complete and cannot be submitted for review');
      }

      // Update provider status
      provider.status = 'pending';
      provider.onboarding.completed = true;
      provider.onboarding.progress = 100;
      provider.onboarding.currentStep = 'submitted';

      await provider.save();

      // Log audit event
      await auditLogger.logUser('verification_request', { user: { id: userId } }, {
        type: 'provider',
        id: provider._id,
        name: 'Provider Verification Request'
      }, {
        providerType: provider.providerType,
        status: 'submitted'
      });

      logger.info('Provider submitted for review', {
        userId,
        providerId: provider._id,
        providerType: provider.providerType
      });

      return {
        success: true,
        message: 'Provider profile submitted for review successfully',
        status: provider.status
      };
    } catch (error) {
      logger.error('Failed to submit provider for review', error, { userId });
      throw error;
    }
  }

  // Admin: Review provider application
  async reviewProviderApplication(providerId, adminId, decision, notes) {
    try {
      const provider = await Provider.findById(providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      if (provider.status !== 'pending') {
        throw new Error('Provider is not in pending status');
      }

      const oldStatus = provider.status;
      let newStatus;

      switch (decision) {
        case 'approve':
          newStatus = 'active';
          provider.verification.identityVerified = true;
          if (provider.providerType !== 'individual') {
            provider.verification.businessVerified = true;
          }
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'request_info':
          newStatus = 'pending';
          break;
        default:
          throw new Error('Invalid decision');
      }

      provider.status = newStatus;
      if (notes) {
        provider.metadata.notes = notes;
      }

      await provider.save();

      // Log audit event
      await auditLogger.logSystem('verification_approve', { user: { id: adminId } }, {
        type: 'provider',
        id: provider._id,
        name: 'Provider Verification Review'
      }, {
        decision,
        oldStatus,
        newStatus,
        notes
      });

      logger.info('Provider application reviewed', {
        adminId,
        providerId,
        decision,
        oldStatus,
        newStatus
      });

      return {
        success: true,
        message: `Provider application ${decision}d successfully`,
        status: newStatus
      };
    } catch (error) {
      logger.error('Failed to review provider application', error, { adminId, providerId, decision });
      throw error;
    }
  }

  // Get verification requirements for provider type
  getVerificationRequirements(providerType) {
    return this.verificationRequirements[providerType] || {
      required: [],
      optional: []
    };
  }

  // Check if provider can accept jobs
  async canAcceptJobs(userId) {
    try {
      const provider = await Provider.findOne({ userId });
      if (!provider) {
        return false;
      }

      return provider.canAcceptJobs();
    } catch (error) {
      logger.error('Failed to check if provider can accept jobs', error, { userId });
      return false;
    }
  }

  // Get provider verification status
  async getVerificationStatus(userId) {
    try {
      const provider = await Provider.findOne({ userId });
      if (!provider) {
        return {
          isProvider: false,
          status: 'not_registered'
        };
      }

      return {
        isProvider: true,
        status: provider.status,
        isVerified: provider.isVerified(),
        canAcceptJobs: provider.canAcceptJobs(),
        verificationProgress: this.calculateVerificationProgress(provider),
        requirements: this.getVerificationRequirements(provider.providerType)
      };
    } catch (error) {
      logger.error('Failed to get verification status', error, { userId });
      throw error;
    }
  }

  // Calculate verification progress
  calculateVerificationProgress(provider) {
    const requirements = this.getVerificationRequirements(provider.providerType);
    const totalRequirements = requirements.required.length;
    let completedRequirements = 0;

    requirements.required.forEach(req => {
      switch (req) {
        case 'identity':
          if (provider.verification.identityVerified) completedRequirements++;
          break;
        case 'business_registration':
          if (provider.verification.businessVerified) completedRequirements++;
          break;
        case 'insurance':
          if (provider.verification.insurance.hasInsurance) completedRequirements++;
          break;
        case 'background_check':
          if (provider.verification.backgroundCheck.status === 'passed') completedRequirements++;
          break;
        case 'agency_license':
          if (provider.verification.licenses && provider.verification.licenses.length > 0) completedRequirements++;
          break;
      }
    });

    return {
      completed: completedRequirements,
      total: totalRequirements,
      percentage: Math.round((completedRequirements / totalRequirements) * 100)
    };
  }
}

module.exports = new ProviderVerificationService();
