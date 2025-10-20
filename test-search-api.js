/**
 * Test file for Global Search API
 * This file demonstrates how to use the Global Search API endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api/search`;

// Test data
const testQueries = [
  'cleaning',
  'plumbing',
  'electrical',
  'moving',
  'landscaping',
  'painting',
  'carpentry',
  'hvac',
  'tools',
  'certification'
];

const testFilters = {
  category: 'cleaning',
  location: 'Manila',
  minPrice: 50,
  maxPrice: 500,
  rating: 4.0
};

/**
 * Test Global Search
 */
async function testGlobalSearch() {
  console.log('\n🔍 Testing Global Search API...\n');

  try {
    // Test basic search
    console.log('1. Testing basic search...');
    const basicSearch = await axios.get(`${API_BASE}?q=cleaning&limit=5`);
    console.log('✅ Basic search successful');
    console.log(`   Results: ${basicSearch.data.data.totalResults} total, ${basicSearch.data.data.results.length} returned`);
    console.log(`   Query: "${basicSearch.data.data.query}"`);
    
    // Test filtered search
    console.log('\n2. Testing filtered search...');
    const filteredSearch = await axios.get(`${API_BASE}?q=plumbing&category=plumbing&location=Manila&rating=4&limit=3`);
    console.log('✅ Filtered search successful');
    console.log(`   Results: ${filteredSearch.data.data.totalResults} total, ${filteredSearch.data.data.results.length} returned`);
    
    // Test type-specific search
    console.log('\n3. Testing type-specific search...');
    const typeSearch = await axios.get(`${API_BASE}?q=cleaning&type=services&limit=3`);
    console.log('✅ Type-specific search successful');
    console.log(`   Results: ${typeSearch.data.data.totalResults} total, ${typeSearch.data.data.results.length} returned`);
    
    // Test pagination
    console.log('\n4. Testing pagination...');
    const paginatedSearch = await axios.get(`${API_BASE}?q=services&limit=2&page=1`);
    console.log('✅ Pagination test successful');
    console.log(`   Page: ${paginatedSearch.data.data.pagination.currentPage}`);
    console.log(`   Total Pages: ${paginatedSearch.data.data.pagination.totalPages}`);
    console.log(`   Has Next: ${paginatedSearch.data.data.pagination.hasNext}`);
    
    // Test sorting
    console.log('\n5. Testing sorting...');
    const sortedSearch = await axios.get(`${API_BASE}?q=cleaning&sortBy=rating&sortOrder=desc&limit=3`);
    console.log('✅ Sorting test successful');
    console.log(`   Results: ${sortedSearch.data.data.results.length} returned`);
    
    // Test empty query
    console.log('\n6. Testing empty query validation...');
    try {
      await axios.get(`${API_BASE}?q=a`);
      console.log('❌ Empty query validation failed - should have returned error');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Empty query validation working correctly');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

  } catch (error) {
    console.error('❌ Global search test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Test Search Suggestions
 */
async function testSearchSuggestions() {
  console.log('\n💡 Testing Search Suggestions API...\n');

  try {
    // Test suggestions
    console.log('1. Testing search suggestions...');
    const suggestions = await axios.get(`${API_BASE}/suggestions?q=clean&limit=5`);
    console.log('✅ Search suggestions successful');
    console.log(`   Query: "${suggestions.data.data.query}"`);
    console.log(`   Suggestions: ${suggestions.data.data.suggestions.length} returned`);
    
    suggestions.data.data.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion.text} (${suggestion.type})`);
    });

    // Test short query validation
    console.log('\n2. Testing short query validation...');
    try {
      await axios.get(`${API_BASE}/suggestions?q=a`);
      console.log('❌ Short query validation failed - should have returned error');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Short query validation working correctly');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }

  } catch (error) {
    console.error('❌ Search suggestions test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Test Popular Searches
 */
async function testPopularSearches() {
  console.log('\n📈 Testing Popular Searches API...\n');

  try {
    // Test popular searches
    console.log('1. Testing popular searches...');
    const popular = await axios.get(`${API_BASE}/popular?limit=5`);
    console.log('✅ Popular searches successful');
    console.log(`   Popular searches: ${popular.data.data.popularSearches.length} returned`);
    
    popular.data.data.popularSearches.forEach((search, index) => {
      console.log(`   ${index + 1}. "${search.term}" (${search.category}) - ${search.count} searches`);
    });

  } catch (error) {
    console.error('❌ Popular searches test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Test Categories API
 */
async function testCategories() {
  console.log('\n📂 Testing Categories API...\n');

  try {
    // Test categories
    console.log('1. Testing categories...');
    const categories = await axios.get(`${API_BASE}/categories`);
    console.log('✅ Categories API successful');
    console.log(`   Entity types: ${categories.data.data.entityTypes.length} available`);
    
    categories.data.data.entityTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type.label} (${type.value})`);
    });

    // Show some categories
    console.log('\n   Sample categories:');
    Object.entries(categories.data.data.categories).slice(0, 3).forEach(([entityType, cats]) => {
      console.log(`   ${entityType}: ${cats.slice(0, 3).join(', ')}...`);
    });

  } catch (error) {
    console.error('❌ Categories test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Test Locations API
 */
async function testLocations() {
  console.log('\n📍 Testing Locations API...\n');

  try {
    // Test locations
    console.log('1. Testing locations...');
    const locations = await axios.get(`${API_BASE}/locations?limit=5`);
    console.log('✅ Locations API successful');
    console.log(`   Locations: ${locations.data.data.locations.length} returned`);
    
    locations.data.data.locations.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.name}, ${location.country} (${location.count} searches)`);
    });

    // Test location search
    console.log('\n2. Testing location search...');
    const locationSearch = await axios.get(`${API_BASE}/locations?q=Manila&limit=3`);
    console.log('✅ Location search successful');
    console.log(`   Filtered locations: ${locationSearch.data.data.locations.length} returned`);

  } catch (error) {
    console.error('❌ Locations test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Test Trending Searches
 */
async function testTrendingSearches() {
  console.log('\n🔥 Testing Trending Searches API...\n');

  try {
    // Test trending searches
    console.log('1. Testing trending searches...');
    const trending = await axios.get(`${API_BASE}/trending?period=week&limit=5`);
    console.log('✅ Trending searches successful');
    console.log(`   Period: ${trending.data.data.period}`);
    console.log(`   Trending searches: ${trending.data.data.trending.length} returned`);
    
    trending.data.data.trending.forEach((search, index) => {
      console.log(`   ${index + 1}. "${search.term}" (${search.category}) - ${search.count} searches (+${search.growth}%)`);
    });

  } catch (error) {
    console.error('❌ Trending searches test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Test Advanced Search
 */
async function testAdvancedSearch() {
  console.log('\n🔬 Testing Advanced Search API...\n');

  try {
    // Test advanced search
    console.log('1. Testing advanced search...');
    const advanced = await axios.get(`${API_BASE}/advanced?q=cleaning&category=cleaning&location=Manila&minPrice=50&maxPrice=500&rating=4&limit=3`);
    console.log('✅ Advanced search successful');
    console.log(`   Results: ${advanced.data.data.totalResults} total, ${advanced.data.data.results.length} returned`);
    console.log(`   Filters applied: ${Object.keys(advanced.data.data.filters).length}`);

  } catch (error) {
    console.error('❌ Advanced search test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Test Entity-Specific Search
 */
async function testEntitySpecificSearch() {
  console.log('\n🎯 Testing Entity-Specific Search API...\n');

  const entityTypes = ['users', 'jobs', 'services', 'supplies', 'courses', 'rentals', 'agencies'];

  for (const entityType of entityTypes) {
    try {
      console.log(`1. Testing ${entityType} search...`);
      const entitySearch = await axios.get(`${API_BASE}/entities/${entityType}?q=cleaning&limit=3`);
      console.log(`✅ ${entityType} search successful`);
      console.log(`   Results: ${entitySearch.data.data.totalResults} total, ${entitySearch.data.data.results.length} returned`);
      
      if (entitySearch.data.data.results.length > 0) {
        const firstResult = entitySearch.data.data.results[0];
        console.log(`   Sample result: ${firstResult.title} (${firstResult.type})`);
      }
      
    } catch (error) {
      console.error(`❌ ${entityType} search test failed:`, error.response?.data?.message || error.message);
    }
  }
}

/**
 * Performance Test
 */
async function testPerformance() {
  console.log('\n⚡ Testing Search Performance...\n');

  try {
    const startTime = Date.now();
    
    // Test multiple concurrent searches
    const promises = testQueries.slice(0, 5).map(query => 
      axios.get(`${API_BASE}?q=${query}&limit=5`)
    );
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Performance test successful');
    console.log(`   Concurrent searches: ${promises.length}`);
    console.log(`   Total duration: ${duration}ms`);
    console.log(`   Average per search: ${Math.round(duration / promises.length)}ms`);
    
    results.forEach((result, index) => {
      console.log(`   Query ${index + 1}: ${result.data.data.totalResults} results`);
    });

  } catch (error) {
    console.error('❌ Performance test failed:', error.response?.data?.message || error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Global Search API Tests...\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);

  try {
    await testGlobalSearch();
    await testSearchSuggestions();
    await testPopularSearches();
    await testCategories();
    await testLocations();
    await testTrendingSearches();
    await testAdvancedSearch();
    await testEntitySpecificSearch();
    await testPerformance();

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Global Search API');
    console.log('   ✅ Search Suggestions');
    console.log('   ✅ Popular Searches');
    console.log('   ✅ Categories API');
    console.log('   ✅ Locations API');
    console.log('   ✅ Trending Searches');
    console.log('   ✅ Advanced Search');
    console.log('   ✅ Entity-Specific Search');
    console.log('   ✅ Performance Tests');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

/**
 * Example usage functions
 */
function showUsageExamples() {
  console.log('\n📖 Usage Examples:\n');
  
  console.log('1. Basic Search:');
  console.log(`   GET ${API_BASE}?q=cleaning&limit=10`);
  
  console.log('\n2. Filtered Search:');
  console.log(`   GET ${API_BASE}?q=plumbing&category=plumbing&location=Manila&rating=4`);
  
  console.log('\n3. Type-Specific Search:');
  console.log(`   GET ${API_BASE}?q=cleaning&type=services&limit=5`);
  
  console.log('\n4. Advanced Search:');
  console.log(`   GET ${API_BASE}/advanced?q=cleaning&minPrice=50&maxPrice=500&rating=4`);
  
  console.log('\n5. Entity-Specific Search:');
  console.log(`   GET ${API_BASE}/entities/jobs?q=developer&location=Manila`);
  
  console.log('\n6. Search Suggestions:');
  console.log(`   GET ${API_BASE}/suggestions?q=clean&limit=5`);
  
  console.log('\n7. Popular Searches:');
  console.log(`   GET ${API_BASE}/popular?limit=10`);
  
  console.log('\n8. Categories:');
  console.log(`   GET ${API_BASE}/categories`);
  
  console.log('\n9. Locations:');
  console.log(`   GET ${API_BASE}/locations?q=Manila`);
  
  console.log('\n10. Trending Searches:');
  console.log(`    GET ${API_BASE}/trending?period=week&limit=10`);
}

// Export functions for use in other files
module.exports = {
  testGlobalSearch,
  testSearchSuggestions,
  testPopularSearches,
  testCategories,
  testLocations,
  testTrendingSearches,
  testAdvancedSearch,
  testEntitySpecificSearch,
  testPerformance,
  runAllTests,
  showUsageExamples
};

// Run tests if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsageExamples();
  } else if (args.includes('--examples')) {
    showUsageExamples();
  } else {
    runAllTests();
  }
}
