const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Database Optimization Service
 * Provides comprehensive database optimization including query analysis, index recommendations, and performance monitoring
 */
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

  /**
   * Analyze query performance and identify optimization opportunities
   */
  async analyzeQueryPerformance() {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }

      const db = mongoose.connection.db;
      
      // Get current operation statistics
      const currentOps = await db.admin().currentOp();
      
      // Analyze slow operations
      const slowOps = currentOps.inprog.filter(op => 
        op.secs_running > 1 && op.command && op.command.find
      );

      // Get index usage statistics
      const indexStats = await this.getIndexUsageStats();
      
      // Analyze collection statistics
      const collections = await db.listCollections().toArray();
      const collectionAnalysis = await Promise.all(
        collections.map(collection => this.analyzeCollection(collection.name))
      );

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

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      const indexStats = await Promise.all(
        collections.map(async (collection) => {
          try {
            const stats = await db.collection(collection.name).aggregate([
              { $indexStats: {} }
            ]).toArray();
            
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
        })
      );

      return indexStats;
    } catch (error) {
      logger.error('Error getting index usage stats:', error);
      return [];
    }
  }

  /**
   * Analyze individual collection for optimization opportunities
   */
  async analyzeCollection(collectionName) {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection(collectionName);
      
      // Get collection stats
      const stats = await collection.stats();
      
      // Get index information
      const indexes = await collection.indexes();
      
      // Analyze query patterns (simplified - in production, you'd use MongoDB profiler)
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

  /**
   * Get sample queries for a collection (simplified implementation)
   */
  async getSampleQueries(collectionName) {
    // In a real implementation, you would query MongoDB's profiler collection
    // For now, we'll return common query patterns based on the collection name
    const commonQueries = {
      'users': [
        { filter: { role: 'provider' }, sort: { 'profile.rating': -1 } },
        { filter: { 'profile.address.city': 'New York' } },
        { filter: { isActive: true, status: 'active' } }
      ],
      'jobs': [
        { filter: { status: 'active', isActive: true } },
        { filter: { category: 'technology', jobType: 'full_time' } },
        { filter: { 'company.location.city': 'San Francisco' } }
      ],
      'services': [
        { filter: { isActive: true, category: 'cleaning' } },
        { filter: { 'rating.average': { $gte: 4.0 } } },
        { filter: { serviceArea: { $in: ['10001', '10002'] } } }
      ],
      'bookings': [
        { filter: { status: 'pending' } },
        { filter: { client: ObjectId(), status: 'confirmed' } },
        { filter: { bookingDate: { $gte: new Date() } } }
      ]
    };

    return commonQueries[collectionName] || [];
  }

  /**
   * Analyze collection indexes and provide recommendations
   */
  analyzeCollectionIndexes(collectionName, indexes, stats) {
    const recommendations = [];
    
    // Check for missing compound indexes
    const compoundIndexRecommendations = this.recommendCompoundIndexes(collectionName, indexes);
    recommendations.push(...compoundIndexRecommendations);
    
    // Check for duplicate indexes
    const duplicateIndexes = this.findDuplicateIndexes(indexes);
    if (duplicateIndexes.length > 0) {
      recommendations.push({
        type: 'duplicate_indexes',
        severity: 'medium',
        message: 'Duplicate indexes found',
        indexes: duplicateIndexes
      });
    }
    
    // Check for unused indexes
    const unusedIndexes = this.findUnusedIndexes(collectionName, indexes);
    if (unusedIndexes.length > 0) {
      recommendations.push({
        type: 'unused_indexes',
        severity: 'low',
        message: 'Potentially unused indexes found',
        indexes: unusedIndexes
      });
    }
    
    // Check for large indexes
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

  /**
   * Recommend compound indexes based on common query patterns
   */
  recommendCompoundIndexes(collectionName, existingIndexes) {
    const recommendations = [];
    const existingKeys = existingIndexes.map(idx => JSON.stringify(idx.key));
    
    // Define recommended compound indexes for each collection
    const recommendedIndexes = {
      'users': [
        { key: { role: 1, isActive: 1, status: 1 } },
        { key: { 'profile.address.city': 1, 'profile.address.state': 1, role: 1 } },
        { key: { 'profile.rating': -1, 'profile.totalReviews': -1 } },
        { key: { 'agency.agencyId': 1, 'agency.status': 1, role: 1 } },
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
      ],
      'courses': [
        { key: { category: 1, level: 1, isActive: 1 } },
        { key: { instructor: 1, isActive: 1, category: 1 } },
        { key: { 'pricing.regularPrice': 1, category: 1, isActive: 1 } },
        { key: { 'enrollment.isOpen': 1, 'enrollment.maxCapacity': 1, isActive: 1 } }
      ]
    };

    const collectionRecommendations = recommendedIndexes[collectionName] || [];
    
    collectionRecommendations.forEach(recommended => {
      const keyStr = JSON.stringify(recommended.key);
      if (!existingKeys.includes(keyStr)) {
        recommendations.push({
          type: 'missing_compound_index',
          severity: 'high',
          message: `Missing compound index for ${collectionName}`,
          index: recommended,
          reason: 'Common query pattern detected'
        });
      }
    });

    return recommendations;
  }

  /**
   * Find duplicate indexes
   */
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

  /**
   * Find potentially unused indexes
   */
  findUnusedIndexes(collectionName, indexes) {
    // This is a simplified implementation
    // In production, you'd analyze actual query patterns and index usage
    const potentiallyUnused = indexes.filter(index => {
      // Skip the default _id index
      if (index.name === '_id_') return false;
      
      // Check if index has very specific fields that might not be used
      const keyFields = Object.keys(index.key);
      if (keyFields.length > 3) return true; // Very specific compound indexes
      
      return false;
    });
    
    return potentiallyUnused.map(idx => ({
      name: idx.name,
      key: idx.key,
      reason: 'Complex compound index with many fields'
    }));
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(collectionAnalysis) {
    const recommendations = [];
    
    collectionAnalysis.forEach(collection => {
      if (collection.recommendations) {
        recommendations.push(...collection.recommendations);
      }
    });
    
    // Add general recommendations
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

  /**
   * Create recommended indexes
   */
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

  /**
   * Generate index name from key
   */
  generateIndexName(key) {
    return Object.entries(key)
      .map(([field, direction]) => `${field}_${direction}`)
      .join('_');
  }

  /**
   * Get optimization report
   */
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
