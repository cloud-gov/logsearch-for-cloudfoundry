const uuid = require('uuid')
const { uaaPaginatorV2, uaaPaginatorV3 } = require('./helpers');

module.exports = (server, config, cache) => {
  const uaaProvider = {
    protocol: 'oauth2',
    auth: config.get('authentication.authorization_uri'),
    token: config.get('authentication.token_uri'),
    scope: ['openid', 'oauth.approvals', 'scim.userids', 'cloud_controller.read'],
    /*
      Function for obtaining user profile
      (is called after obtaining user access token in bell/lib/oauth.js v2 function).
      Here we get user account details (profile, orgs/spaces)
      and store it and user credentials (Oauth tokens) in the cache.
      We use generated session_id as a key when storing user data in the cache.
     */
    profile: async (credentials, params, get) => {
      server.log(
        ['debug', 'authentication'],
        JSON.stringify({ credentials, params })
      )

      const account = {}

      // generate user session_id, set it to auth credentials
      credentials.session_id = uuid.v1()

      try {
        const profile = await get(config.get('authentication.account_info_uri'))
        const apiUri = config.get('authentication.api_uri')

        server.log(['debug', 'authentication'], JSON.stringify({ profile }))

        account.profile = {
          id: profile.id,
          username: profile.username,
          displayName: profile.name,
          email: profile.email,
          raw: profile
        }

        // CF V2 API
        const orgs = await uaaPaginatorV2(get, apiUri, '/v2/organizations')
        server.log(['debug', 'authentication', 'orgs'], JSON.stringify(orgs))

        const spaces = await uaaPaginatorV2(get, apiUri, '/v2/spaces')
        server.log(['debug', 'authentication', 'spaces'], JSON.stringify(spaces))

        // CF V3 API - Commented out for later use
        // const orgs = await uaaPaginatorV3(get, `${apiUri}/v3/organizations`);
        // const spaces = await uaaPaginatorV3(get, `${apiUri}/v3/spaces`);

        account.orgIds = orgs.map(org => org.guid)
        account.orgs = orgs.map(org => org.name)
        account.spaceIds = spaces.map(space => space.guid)
        account.spaces = spaces.map(space => space.name)

        // store user data in the cache
        await cache.set(credentials.session_id, { credentials, account }, 0)
      } catch (error) {
        server.log(['error', 'authentication', 'session:set'], JSON.stringify(error))
      }
    }
  }

  return uaaProvider
}
