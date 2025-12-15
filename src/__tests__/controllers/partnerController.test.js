const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Partner = require('../../models/Partner');
const User = require('../../models/User');
const { generateToken } = require('../../utils/auth');

describe('Partner Controller', () => {
  let adminUser;
  let adminToken;
  let testPartner;

  beforeAll(async () => {
    // Create admin user for testing
    adminUser = await User.create({
      phoneNumber: '+1234567890',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin']
    });

    adminToken = generateToken(adminUser._id);

    // Create test partner
    testPartner = await Partner.create({
      name: 'Test Partner Inc.',
      email: 'partner@test.com',
      phoneNumber: '+1234567891',
      businessInfo: {
        companyName: 'Test Partner Inc.',
        industry: 'Technology',
        description: 'Test company for partner integration'
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Partner.deleteMany({
      email: { $in: ['partner@test.com', 'newpartner@test.com'] }
    });
    await User.deleteMany({
      phoneNumber: '+1234567890'
    });
    await mongoose.connection.close();
  });

  describe('POST /api/partners/onboarding/start', () => {
    it('should start partner onboarding successfully', async () => {
      const response = await request(app)
        .post('/api/partners/onboarding/start')
        .send({
          name: 'New Partner Corp',
          email: 'newpartner@test.com',
          phoneNumber: '+1234567892'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner).toHaveProperty('id');
      expect(response.body.data.partner.name).toBe('New Partner Corp');
      expect(response.body.data.partner.onboarding.currentStep).toBe('business_info');

      // Clean up
      await Partner.findOneAndDelete({ email: 'newpartner@test.com' });
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/partners/onboarding/start')
        .send({
          name: 'Duplicate Partner',
          email: 'partner@test.com', // Existing email
          phoneNumber: '+1234567893'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PARTNER_EXISTS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/partners/onboarding/start')
        .send({
          name: 'Test Partner'
          // Missing email and phone
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/partners/:id/business-info', () => {
    it('should update business information', async () => {
      const response = await request(app)
        .put(`/api/partners/${testPartner._id}/business-info`)
        .send({
          businessInfo: {
            companyName: 'Updated Partner Inc.',
            website: 'https://updatedpartner.com',
            industry: 'Software',
            description: 'Updated company description'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner.businessInfo.companyName).toBe('Updated Partner Inc.');
      expect(response.body.data.partner.onboarding.currentStep).toBe('api_setup');
    });

    it('should reject invalid partner ID', async () => {
      const response = await request(app)
        .put('/api/partners/invalid-id/business-info')
        .send({
          businessInfo: {
            companyName: 'Test'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/partners/:id/api-setup', () => {
    it('should complete API setup', async () => {
      const response = await request(app)
        .put(`/api/partners/${testPartner._id}/api-setup`)
        .send({
          webhookUrl: 'https://partner.com/webhooks',
          callbackUrl: 'https://partner.com/callback'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner.apiCredentials.webhookUrl).toBe('https://partner.com/webhooks');
      expect(response.body.data.partner.onboarding.currentStep).toBe('verification');
    });
  });

  describe('PUT /api/partners/:id/verification', () => {
    it('should complete verification', async () => {
      const response = await request(app)
        .put(`/api/partners/${testPartner._id}/verification`)
        .send({
          documents: [
            {
              type: 'business_registration',
              name: 'Business License',
              url: 'https://storage.example.com/license.pdf'
            }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner.verification.documents).toHaveLength(1);
      expect(response.body.data.partner.onboarding.currentStep).toBe('activation');
    });
  });

  describe('PUT /api/partners/:id/activate', () => {
    it('should activate partner when all steps completed', async () => {
      const response = await request(app)
        .put(`/api/partners/${testPartner._id}/activate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner.status).toBe('active');
      expect(response.body.data.partner.onboarding.completed).toBe(true);
      expect(response.body.data.partner.apiCredentials).toHaveProperty('clientId');
      expect(response.body.data.partner.apiCredentials).toHaveProperty('apiKey');
    });
  });

  describe('GET /api/partners/slug/:slug', () => {
    it('should get partner by slug', async () => {
      const response = await request(app)
        .get(`/api/partners/slug/${testPartner.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partner.name).toBe('Test Partner Inc.');
      expect(response.body.data.partner.slug).toBe(testPartner.slug);
    });

    it('should return limited data for public access', async () => {
      const response = await request(app)
        .get(`/api/partners/slug/${testPartner.slug}`)
        .expect(200);

      const partner = response.body.data.partner;
      expect(partner).toHaveProperty('name');
      expect(partner).toHaveProperty('businessInfo');
      expect(partner).not.toHaveProperty('apiCredentials'); // Should not expose sensitive data
    });

    it('should return 404 for inactive partner', async () => {
      // Set partner to inactive
      await Partner.findByIdAndUpdate(testPartner._id, { status: 'inactive' });

      const response = await request(app)
        .get(`/api/partners/slug/${testPartner.slug}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PARTNER_NOT_FOUND');

      // Restore status
      await Partner.findByIdAndUpdate(testPartner._id, { status: 'active' });
    });
  });

  describe('Admin Endpoints', () => {
    describe('POST /api/partners', () => {
      it('should create partner as admin', async () => {
        const response = await request(app)
          .post('/api/partners')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Admin Created Partner',
            email: 'admincreated@test.com',
            phoneNumber: '+1234567894',
            businessInfo: {
              companyName: 'Admin Created Inc.',
              industry: 'Consulting'
            }
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.partner.name).toBe('Admin Created Partner');

        // Clean up
        await Partner.findOneAndDelete({ email: 'admincreated@test.com' });
      });

      it('should reject creation without admin auth', async () => {
        const response = await request(app)
          .post('/api/partners')
          .send({
            name: 'Unauthorized Partner',
            email: 'unauthorized@test.com',
            phoneNumber: '+1234567895'
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/partners', () => {
      it('should get partners list as admin', async () => {
        const response = await request(app)
          .get('/api/partners')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.partners)).toBe(true);
        expect(response.body.data).toHaveProperty('pagination');
      });

      it('should filter partners by status', async () => {
        const response = await request(app)
          .get('/api/partners?status=active')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        response.body.data.partners.forEach(partner => {
          expect(partner.status).toBe('active');
        });
      });

      it('should search partners by name', async () => {
        const response = await request(app)
          .get('/api/partners?search=Test')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.partners.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/partners/:id', () => {
      it('should get partner details as admin', async () => {
        const response = await request(app)
          .get(`/api/partners/${testPartner._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.partner.id).toBe(testPartner._id.toString());
        expect(response.body.data.partner).toHaveProperty('apiCredentials');
      });

      it('should return 404 for non-existent partner', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/partners/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('PARTNER_NOT_FOUND');
      });
    });

    describe('PUT /api/partners/:id', () => {
      it('should update partner as admin', async () => {
        const response = await request(app)
          .put(`/api/partners/${testPartner._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Partner Name',
            status: 'suspended'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.partner.name).toBe('Updated Partner Name');
        expect(response.body.data.partner.status).toBe('suspended');

        // Restore original values
        await Partner.findByIdAndUpdate(testPartner._id, {
          name: 'Test Partner Inc.',
          status: 'active'
        });
      });
    });

    describe('POST /api/partners/:id/notes', () => {
      it('should add note to partner', async () => {
        const response = await request(app)
          .post(`/api/partners/${testPartner._id}/notes`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            content: 'Test admin note'
          })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify note was added
        const updatedPartner = await Partner.findById(testPartner._id);
        expect(updatedPartner.notes).toHaveLength(1);
        expect(updatedPartner.notes[0].content).toBe('Test admin note');
      });

      it('should validate note content', async () => {
        const response = await request(app)
          .post(`/api/partners/${testPartner._id}/notes`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            content: '' // Empty content
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe('MISSING_NOTE_CONTENT');
      });
    });

    describe('DELETE /api/partners/:id', () => {
      it('should soft delete partner', async () => {
        const partnerToDelete = await Partner.create({
          name: 'Delete Test Partner',
          email: 'delete@test.com',
          phoneNumber: '+1234567896'
        });

        const response = await request(app)
          .delete(`/api/partners/${partnerToDelete._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify soft delete
        const deletedPartner = await Partner.findById(partnerToDelete._id);
        expect(deletedPartner.deleted).toBe(true);
      });
    });
  });

  describe('Security & Validation', () => {
    it('should implement rate limiting', async () => {
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/partners/onboarding/start')
            .send({
              name: `Rate Limit Test ${i}`,
              email: `ratelimit${i}@test.com`,
              phoneNumber: `+1234567${i}89`
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate slug format', async () => {
      const response = await request(app)
        .get('/api/partners/slug/invalid@slug!')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should sanitize input data', async () => {
      const response = await request(app)
        .post('/api/partners/onboarding/start')
        .send({
          name: '<script>alert("xss")</script>Partner',
          email: 'sanitized@test.com',
          phoneNumber: '+1234567897'
        })
        .expect(201);

      expect(response.body.data.partner.name).not.toContain('<script>');

      // Clean up
      await Partner.findOneAndDelete({ email: 'sanitized@test.com' });
    });
  });
});
