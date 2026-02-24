/**
 * OAuth2 Token Management API – /api/oauth/*
 *
 * Used primarily by third-party integrations and machine-to-machine flows.
 * Requires API-key auth for client_credentials endpoints.
 *
 * Covers:
 *  - Authorization code issuance with PKCE (authorize)
 *  - Token exchange (client_credentials + authorization_code + PKCE)
 *  - Token refresh
 *  - Token revocation
 *  - Token introspection (token-info)
 *  - List user tokens
 *
 * See docs/AUTH_SECURITY.md#10-pkce-oauth2-authorization-code-flow for the
 * full PKCE flow diagram and request/response examples.
 */
class OAuthTokensAPI {
  constructor(client) {
    this.client = client;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUTHORIZATION CODE (PKCE)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create an authorization code using the PKCE flow (RFC 7636).
   *
   * Only `code_challenge_method: "S256"` is accepted — plain PKCE is rejected.
   * The resulting code is valid for 10 minutes and is single-use.
   *
   * Requires: the client must be authenticated (Bearer access token).
   *
   * @param {Object} data
   * @param {string} data.client_id              - Your API key / OAuth client ID
   * @param {string} data.redirect_uri           - Must be a valid HTTPS URL
   * @param {string} data.code_challenge         - BASE64URL(SHA256(code_verifier))
   * @param {string} data.code_challenge_method  - Must be "S256"
   * @param {string} [data.scope]                - Space-separated scope string
   * @param {string} [data.state]                - CSRF state parameter
   * @returns {Promise<Object>} { success, code, state, expiresIn }
   */
  async authorize(data) {
    if (!data.client_id) throw new Error('client_id is required');
    if (!data.redirect_uri) throw new Error('redirect_uri is required');
    if (!data.code_challenge) throw new Error('code_challenge is required');
    if (data.code_challenge_method !== 'S256') throw new Error('code_challenge_method must be S256');
    return this.client.post('/api/oauth/authorize', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TOKEN EXCHANGE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Exchange credentials for an OAuth2 access + refresh token pair.
   *
   * Supported grant types:
   *  - "client_credentials"  – server-to-server; requires apiKey auth header
   *  - "authorization_code"  – PKCE browser/mobile code flow; requires
   *                            `code`, `redirect_uri`, `client_id`, `code_verifier`
   *
   * @param {Object} data
   * @param {string} data.grant_type           - "client_credentials" | "authorization_code"
   * @param {string} [data.client_id]          - OAuth client ID
   * @param {string} [data.client_secret]      - OAuth client secret (client_credentials)
   * @param {string} [data.code]               - Authorization code (authorization_code)
   * @param {string} [data.redirect_uri]       - Redirect URI (authorization_code)
   * @param {string} [data.code_verifier]      - PKCE plain verifier string (authorization_code)
   * @param {string} [data.scope]              - Requested scope
   * @param {number} [data.expires_in]         - Requested token lifetime in seconds (300–86400)
   * @returns {Promise<Object>} { access_token, refresh_token, token_type, expires_in, scope }
   */
  async exchangeToken(data) {
    if (!data.grant_type) throw new Error('grant_type is required');
    return this.client.post('/api/oauth/token', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TOKEN REFRESH
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtain a new access token using a refresh token (OAuth2 refresh_token grant)
   * @param {Object} data
   * @param {string} data.refresh_token - Valid refresh token
   * @param {string} [data.scope]       - Subset of the original scope (optional downscope)
   * @returns {Promise<Object>} { access_token, refresh_token, expires_in }
   */
  async refreshToken(data) {
    if (!data.refresh_token) throw new Error('refresh_token is required');
    return this.client.post('/api/oauth/refresh', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TOKEN REVOCATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Revoke an access token or refresh token (RFC 7009)
   * @param {Object} data
   * @param {string} data.token           - The token to revoke
   * @param {string} [data.token_type_hint] - "access_token" | "refresh_token"
   * @returns {Promise<Object>}
   */
  async revokeToken(data) {
    if (!data.token) throw new Error('token is required');
    return this.client.post('/api/oauth/revoke', data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TOKEN INTROSPECTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Introspect the current access token to get metadata (RFC 7662)
   * The "current" token is the Bearer token already set on the client.
   * @returns {Promise<Object>} { active, sub, scope, exp, iat, client_id, user }
   */
  async getTokenInfo() {
    return this.client.get('/api/oauth/token-info');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIST USER TOKENS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List all active OAuth tokens issued to the authenticated user.
   * Requires API-key authentication.
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<Object>} Paginated list of token records
   */
  async listTokens(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.client.get(`/api/oauth/tokens${qs ? `?${qs}` : ''}`);
  }
}

module.exports = OAuthTokensAPI;
