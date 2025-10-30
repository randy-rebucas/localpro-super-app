const request = require('supertest');
const express = require('express');
const { paginationMiddleware, offsetPaginationMiddleware, cursorPaginationMiddleware } = require('../../src/middleware/paginationMiddleware');

describe('Pagination Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('offsetPaginationMiddleware', () => {
    beforeEach(() => {
      app.use('/test', offsetPaginationMiddleware({
        defaultLimit: 20,
        maxLimit: 100,
        minLimit: 1,
        defaultPage: 1,
        minPage: 1
      }));
      
      app.get('/test', (req, res) => {
        res.json({
          success: true,
          pagination: req.pagination,
          message: 'Test endpoint'
        });
      });
    });

    it('should parse default pagination parameters', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        skip: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        isValid: true
      });
    });

    it('should parse custom pagination parameters', async () => {
      const response = await request(app)
        .get('/test?page=3&limit=10&sortBy=name&sortOrder=asc')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 3,
        limit: 10,
        skip: 20,
        sortBy: 'name',
        sortOrder: 'asc',
        isValid: true
      });
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app)
        .get('/test?limit=200')
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });

    it('should enforce minimum limit', async () => {
      const response = await request(app)
        .get('/test?limit=0')
        .expect(200);

      expect(response.body.pagination.limit).toBeGreaterThanOrEqual(1);
    });

    it('should enforce minimum page', async () => {
      const response = await request(app)
        .get('/test?page=0')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/test?page=-1&limit=-5')
        .expect(200);

      // The middleware should normalize invalid values rather than reject them
      expect(response.body.pagination.page).toBeGreaterThanOrEqual(1);
      expect(response.body.pagination.limit).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cursorPaginationMiddleware', () => {
    beforeEach(() => {
      app.use('/test', cursorPaginationMiddleware({
        defaultLimit: 20,
        maxLimit: 100,
        cursorField: 'createdAt',
        sortField: 'createdAt',
        sortOrder: 'desc'
      }));
      
      app.get('/test', (req, res) => {
        res.json({
          success: true,
          pagination: req.pagination,
          message: 'Test endpoint'
        });
      });
    });

    it('should parse cursor pagination parameters', async () => {
      const response = await request(app)
        .get('/test?cursor=2023-01-01T00:00:00.000Z&limit=10')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        cursor: '2023-01-01T00:00:00.000Z',
        limit: 10,
        cursorField: 'createdAt',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        isValid: true
      });
    });

    it('should parse before/after cursor parameters', async () => {
      const response = await request(app)
        .get('/test?before=2023-01-01T00:00:00.000Z&after=2022-01-01T00:00:00.000Z')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        before: '2023-01-01T00:00:00.000Z',
        after: '2022-01-01T00:00:00.000Z',
        cursorField: 'createdAt',
        isValid: true
      });
    });
  });

  describe('paginationMiddleware (hybrid)', () => {
    beforeEach(() => {
      app.use('/test', paginationMiddleware({
        defaultLimit: 20,
        maxLimit: 100,
        enableCursor: true,
        cursorField: 'createdAt',
        sortField: 'createdAt',
        sortOrder: 'desc'
      }));
      
      app.get('/test', (req, res) => {
        res.json({
          success: true,
          pagination: req.pagination,
          message: 'Test endpoint'
        });
      });
    });

    it('should support both offset and cursor pagination', async () => {
      // Test offset pagination
      const offsetResponse = await request(app)
        .get('/test?page=2&limit=10')
        .expect(200);

      expect(offsetResponse.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        skip: 10,
        isValid: true
      });

      // Test cursor pagination
      const cursorResponse = await request(app)
        .get('/test?cursor=2023-01-01T00:00:00.000Z&limit=10')
        .expect(200);

      expect(cursorResponse.body.pagination).toMatchObject({
        cursor: '2023-01-01T00:00:00.000Z',
        limit: 10,
        cursorField: 'createdAt',
        isValid: true
      });
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      app.use('/test', offsetPaginationMiddleware());
      
      app.get('/test', (req, res) => {
        const { createOffsetQuery, createOffsetMetadata } = req.pagination;
        
        // Test createOffsetQuery
        const query = createOffsetQuery({ status: 'active' });
        
        // Test createOffsetMetadata
        const metadata = createOffsetMetadata(100, 20, { queryTime: 50 });
        
        res.json({
          success: true,
          query,
          metadata,
          message: 'Test endpoint'
        });
      });
    });

    it('should provide helper methods', async () => {
      const response = await request(app)
        .get('/test?page=2&limit=10')
        .expect(200);

      expect(response.body.query).toMatchObject({
        query: { status: 'active' },
        options: {
          skip: 10,
          limit: 10,
          sort: { createdAt: -1 }
        }
      });

      expect(response.body.metadata).toMatchObject({
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
        count: 20,
        hasNext: true,
        hasPrev: true,
        queryTime: 50
      });
    });
  });
});
