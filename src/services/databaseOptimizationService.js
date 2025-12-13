const mongoose = require('mongoose');
const logger = require('../config/logger');

class DatabaseOptimizationService {
  constructor() {
    this.queryAnalysis = new Map();
    this.indexRecommendations = [];
    this.performanceMetrics = {
      slowQueries: [],
      missingIndexes: [],
      duplicateIndexes: [],
      unusedIndexes: []
    };
  }

  async analyzeQueryPerformance() {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }
      const db = mongoose.connection.db;
      
      // Try to get current operations (may not be available on Atlas free tier)
      let slowOps = [];
      try {
        const currentOps = await db.command({ currentOp: 1, active: true });
        if (currentOps && currentOps.inprog) {
          slowOps = currentOps.inprog.filter(op => op.secs_running > 1 && op.command && op.command.find);
        }
      } catch (opError) {
        // currentOp may not be available on Atlas free/shared tier
        logger.warn('currentOp not available (Atlas free tier limitation):', opError.message);
      }
      
      const indexStats = await this.getIndexUsageStats();
      const collections = await db.listCollections().toArray();
      const collectionAnalysis = await Promise.all(collections.map(collection => this.analyzeCollection(collection.name)));
      return {
        slowOperations: slowOps,
        indexStats,
        collectionAnalysis,
        recommendations: this.generateOptimizationRecommendations(collectionAnalysis)
      };
    } catch (error) {
      logger.error('Error analyzing query performance:', error);
      throw error;
    }
  }

  async getIndexUsageStats() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const indexStats = await Promise.all(collections.map(async (collection) => {
        try {
          const stats = await db.collection(collection.name).aggregate([{ $indexStats: {} }]).toArray();
          return {
            collection: collection.name,
            indexes: stats.map(index => ({
              name: index.name,
              key: index.key,
              accesses: index.accesses,
              usage: index.accesses.ops || 0
            }))
          };
        } catch (error) {
          return {
            collection: collection.name,
            error: error.message
          };
        }
      }));
      return indexStats;
    } catch (error) {
      logger.error('Error getting index usage stats:', error);
      return [];
    }
  }

  async analyzeCollection(collectionName) {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection(collectionName);
      
      // Use collStats command instead of deprecated stats() method
      let stats = { count: 0, avgObjSize: 0, size: 0 };
      try {
        const collStats = await db.command({ collStats: collectionName });
        stats = {
          count: collStats.count || 0,
          avgObjSize: collStats.avgObjSize || 0,
          size: collStats.size || 0,
          storageSize: collStats.storageSize || 0,
          totalIndexSize: collStats.totalIndexSize || 0
        };
      } catch (statsError) {
        // If collStats fails, try to get count at least
        try {
          stats.count = await collection.countDocuments();
        } catch (countError) {
          logger.warn(`Could not get stats for ${collectionName}:`, statsError.message);
        }
      }
      
      const indexes = await collection.indexes();
      const sampleQueries = await this.getSampleQueries(collectionName);
      return {
        name: collectionName,
        documentCount: stats.count,
        avgDocumentSize: stats.avgObjSize,
        totalSize: stats.size,
        indexCount: indexes.length,
        indexes: indexes.map(idx => ({
          name: idx.name,
          key: idx.key,
          size: idx.size || 0,
          isUnique: idx.unique || false,
          isSparse: idx.sparse || false
        })),
        sampleQueries,
        recommendations: this.analyzeCollectionIndexes(collectionName, indexes, stats)
      };
    } catch (error) {
      logger.error(`Error analyzing collection ${collectionName}:`, error);
      return {
        name: collectionName,
        error: error.message
      };
    }
  }

  async backupDatabase() {
    const path = require('path');
    const fs = require('fs');
    const backupDir = path.join(__dirname, '../../backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }
      
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          database: mongoose.connection.name,
          collections: collections.length
        },
        collections: {}
      };
      
      // Export each collection
      for (const collInfo of collections) {
        const collName = collInfo.name;
        // Skip system collections
        if (collName.startsWith('system.')) continue;
        
        try {
          const documents = await db.collection(collName).find({}).toArray();
          backupData.collections[collName] = {
            count: documents.length,
            documents: documents
          };
          logger.info(`Backed up ${documents.length} documents from ${collName}`);
        } catch (collError) {
          logger.warn(`Could not backup collection ${collName}:`, collError.message);
        }
      }
      
      // Write backup to file
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      logger.info(`Database backup completed: ${backupFile}`);
      return {
        success: true,
        file: backupFile,
        collections: Object.keys(backupData.collections).length,
        totalDocuments: Object.values(backupData.collections).reduce((sum, c) => sum + c.count, 0),
        timestamp: backupData.metadata.timestamp
      };
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw error;
    }
  }

  async restoreDatabase(backupFilePath) {
    const fs = require('fs');
    
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }
      
      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found: ${backupFilePath}`);
      }
      
      const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
      const db = mongoose.connection.db;
      const results = {
        success: true,
        restored: [],
        errors: []
      };
      
      for (const [collName, collData] of Object.entries(backupData.collections)) {
        try {
          const collection = db.collection(collName);
          
          // Drop existing collection
          try {
            await collection.drop();
          } catch (dropError) {
            // Collection might not exist, ignore
          }
          
          // Insert documents if any
          if (collData.documents && collData.documents.length > 0) {
            await collection.insertMany(collData.documents);
            results.restored.push({
              collection: collName,
              documents: collData.documents.length
            });
            logger.info(`Restored ${collData.documents.length} documents to ${collName}`);
          }
        } catch (collError) {
          results.errors.push({
            collection: collName,
            error: collError.message
          });
          logger.error(`Failed to restore collection ${collName}:`, collError);
        }
      }
      
      logger.info('Database restore completed');
      return results;
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }
  
  async listBackups() {
    const path = require('path');
    const fs = require('fs');
    const backupDir = path.join(__dirname, '../../backups');
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          filename: f,
          path: filePath,
          size: stats.size,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created);
    
    return backups;
  }

  async getSampleQueries(_collectionName) {
    return [];
  }

  analyzeCollectionIndexes(collectionName, indexes, stats) {
    const recommendations = [];
    const compoundIndexRecommendations = this.recommendCompoundIndexes(collectionName, indexes);
    recommendations.push(...compoundIndexRecommendations);
    const duplicateIndexes = this.findDuplicateIndexes(indexes);
    if (duplicateIndexes.length > 0) {
      recommendations.push({
        type: 'duplicate_indexes',
        severity: 'medium',
        message: 'Duplicate indexes found',
        indexes: duplicateIndexes
      });
    }
    const unusedIndexes = this.findUnusedIndexes(collectionName, indexes);
    if (unusedIndexes.length > 0) {
      recommendations.push({
        type: 'unused_indexes',
        severity: 'low',
        message: 'Potentially unused indexes found',
        indexes: unusedIndexes
      });
    }
    const largeIndexes = indexes.filter(idx => idx.size > stats.size * 0.1);
    if (largeIndexes.length > 0) {
      recommendations.push({
        type: 'large_indexes',
        severity: 'medium',
        message: 'Large indexes found that may impact write performance',
        indexes: largeIndexes.map(idx => ({ name: idx.name, size: idx.size }))
      });
    }
    return recommendations;
  }

  recommendCompoundIndexes(collectionName, existingIndexes) {
    const recommendations = [];
    const existingKeys = existingIndexes.map(idx => JSON.stringify(idx.key));
    const recommendedIndexes = {
      'users': [
        { key: { role: 1, isActive: 1, status: 1 } },
        { key: { 'profile.address.city': 1, 'profile.address.state': 1, role: 1 } },
        { key: { 'profile.rating': -1, 'profile.totalReviews': -1 } },
        { key: { agency: 1, roles: 1 } },
        { key: { trustScore: -1, 'profile.rating': -1, isActive: 1 } }
      ],
      'jobs': [
        { key: { status: 1, isActive: 1, category: 1 } },
        { key: { category: 1, subcategory: 1, jobType: 1 } },
        { key: { 'company.location.city': 1, 'company.location.state': 1, status: 1 } },
        { key: { jobType: 1, experienceLevel: 1, status: 1 } },
        { key: { 'salary.min': 1, 'salary.max': 1, status: 1 } },
        { key: { 'featured.isFeatured': 1, 'featured.featuredUntil': 1, status: 1 } },
        { key: { employer: 1, status: 1, createdAt: -1 } }
      ],
      'services': [
        { key: { category: 1, subcategory: 1, isActive: 1 } },
        { key: { provider: 1, isActive: 1, category: 1 } },
        { key: { serviceArea: 1, isActive: 1, category: 1 } },
        { key: { 'rating.average': -1, 'rating.count': -1, isActive: 1 } },
        { key: { 'pricing.basePrice': 1, category: 1, isActive: 1 } }
      ],
      'bookings': [
        { key: { client: 1, status: 1, bookingDate: 1 } },
        { key: { provider: 1, status: 1, bookingDate: 1 } },
        { key: { service: 1, status: 1, bookingDate: 1 } },
        { key: { status: 1, bookingDate: 1, createdAt: -1 } }
      ],
      'rentalitems': [
        { key: { category: 1, subcategory: 1, isActive: 1 } },
        { key: { owner: 1, isActive: 1, 'availability.isAvailable': 1 } },
        { key: { 'location.address.city': 1, 'location.address.state': 1, isActive: 1 } },
        { key: { 'pricing.hourly': 1, 'pricing.daily': 1, category: 1 } }
      ],
      'products': [
        { key: { category: 1, subcategory: 1, isActive: 1 } },
        { key: { supplier: 1, isActive: 1, category: 1 } },
        { key: { 'pricing.retailPrice': 1, category: 1, isActive: 1 } },
        { key: { 'inventory.quantity': 1, isActive: 1 } }
      ]
    };
    if (recommendedIndexes[collectionName]) {
      for (const rec of recommendedIndexes[collectionName]) {
        if (!existingKeys.includes(JSON.stringify(rec.key))) {
          recommendations.push({
            type: 'missing_compound_index',
            severity: 'high',
            message: 'Recommended compound index missing',
            collection: collectionName,
            index: rec,
            reason: 'Common query pattern',
            action: 'createIndex'
          });
        }
      }
    }
    return recommendations;
  }

  findDuplicateIndexes(indexes) {
    const duplicates = [];
    const seen = new Set();
    indexes.forEach((index, i) => {
      const keyStr = JSON.stringify(index.key);
      if (seen.has(keyStr)) {
        duplicates.push({
          name: index.name,
          key: index.key,
          duplicateOf: indexes.find((idx, j) => j < i && JSON.stringify(idx.key) === keyStr)?.name
        });
      } else {
        seen.add(keyStr);
      }
    });
    return duplicates;
  }

  findUnusedIndexes(_collectionName, indexes) {
    const potentiallyUnused = indexes.filter(index => {
      if (index.name === '_id_') return false;
      const keyFields = Object.keys(index.key);
      if (keyFields.length > 3) return true;
      return false;
    });
    return potentiallyUnused.map(idx => ({
      name: idx.name,
      key: idx.key,
      reason: 'Complex compound index with many fields'
    }));
  }

  generateOptimizationRecommendations(collectionAnalysis) {
    const recommendations = [];
    collectionAnalysis.forEach(collection => {
      if (collection.recommendations) {
        recommendations.push(...collection.recommendations);
      }
    });
    recommendations.push({
      type: 'general',
      severity: 'info',
      message: 'Consider enabling MongoDB profiler for detailed query analysis',
      action: 'db.setProfilingLevel(2, { slowms: 100 })'
    });
    recommendations.push({
      type: 'general',
      severity: 'info',
      message: 'Monitor index usage with db.collection.getIndexes() and db.collection.aggregate([{$indexStats: {}}])',
      action: 'Regular index usage analysis'
    });
    return recommendations;
  }

  async createRecommendedIndexes(recommendations) {
    const results = [];
    for (const rec of recommendations) {
      if (rec.type === 'missing_compound_index') {
        try {
          const db = mongoose.connection.db;
          const collection = db.collection(rec.collection || 'unknown');
          await collection.createIndex(rec.index.key, {
            name: this.generateIndexName(rec.index.key),
            background: true
          });
          results.push({
            success: true,
            collection: rec.collection,
            index: rec.index,
            message: 'Index created successfully'
          });
          logger.info(`Created index for ${rec.collection}:`, rec.index);
        } catch (error) {
          results.push({
            success: false,
            collection: rec.collection,
            index: rec.index,
            error: error.message
          });
          logger.error(`Failed to create index for ${rec.collection}:`, error);
        }
      }
    }
    return results;
  }

  generateIndexName(key) {
    return Object.entries(key).map(([field, direction]) => `${field}_${direction}`).join('_');
  }

  async getOptimizationReport() {
    try {
      const analysis = await this.analyzeQueryPerformance();
      const indexStats = await this.getIndexUsageStats();
      return {
        timestamp: new Date().toISOString(),
        analysis,
        indexStats,
        summary: {
          totalCollections: analysis.collectionAnalysis.length,
          totalRecommendations: analysis.recommendations.length,
          highPriorityRecommendations: analysis.recommendations.filter(r => r.severity === 'high').length,
          mediumPriorityRecommendations: analysis.recommendations.filter(r => r.severity === 'medium').length
        }
      };
    } catch (error) {
      logger.error('Error generating optimization report:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseOptimizationService();
