/**
 * GraphQL/Apollo Server Example
 * Demonstrates how to use @localpro/auth-access with Apollo Server
 */

const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');
const { initAuth, authGraphQL, graphqlCheckScopes, graphqlCheckRole } = require('@localpro/auth-access');

// Initialize auth access
initAuth({
  issuer: process.env.AUTH_ISSUER || 'localpro',
  publicKey: process.env.AUTH_PUBLIC_KEY
});

// GraphQL Schema
const typeDefs = gql`
  type Query {
    me: User
    analytics: Analytics @auth(requires: ["read:analytics"])
    premiumData: PremiumData @auth(requires: ["premium"])
    adminUsers: [User] @auth(requires: ["admin"])
  }

  type User {
    id: ID!
    partnerId: String!
    role: String!
    scopes: [String!]!
  }

  type Analytics {
    views: Int!
    conversions: Int!
  }

  type PremiumData {
    revenue: Float!
    growth: String!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    me: (parent, args, context) => {
      if (!context || !context.user) {
        throw new Error('Authentication required');
      }
      return {
        id: context.user.partnerId,
        partnerId: context.partnerId,
        role: context.role,
        scopes: context.scopes
      };
    },

    analytics: (parent, args, context) => {
      if (!context || !context.user) {
        throw new Error('Authentication required');
      }
      
      // Check scopes
      graphqlCheckScopes(context, ['read:analytics']);
      
      return {
        views: 1000,
        conversions: 50
      };
    },

    premiumData: (parent, args, context) => {
      if (!context || !context.user) {
        throw new Error('Authentication required');
      }
      
      // Check role
      graphqlCheckRole(context, 'partner:premium');
      
      return {
        revenue: 10000,
        growth: '15%'
      };
    },

    adminUsers: (parent, args, context) => {
      if (!context || !context.user) {
        throw new Error('Authentication required');
      }
      
      // Check role
      graphqlCheckRole(context, 'admin');
      
      return [
        { id: '1', partnerId: 'partner-1', role: 'partner:basic', scopes: [] },
        { id: '2', partnerId: 'partner-2', role: 'partner:premium', scopes: [] }
      ];
    }
  }
};

// Create Apollo Server with auth context
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authGraphQL()
});

const app = express();

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`GraphQL server running on http://localhost:${PORT}${server.graphqlPath}`);
    console.log('Auth access initialized');
  });
}

startServer().catch(console.error);
