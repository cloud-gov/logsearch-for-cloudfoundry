# kibana-cf_authentication

This plugin performs authentication and authorization for kibana.
Details on its working are spelled out in comments in [server/index.js](server/index.js)

The high-level is:

- users who are not authenticated are sent to authenticate
- users who are authenticated are considered admins if they are a member of a specific, configurable cf org
- users who are not admins have filters injected (server-side) to limit search results to their orgs/spaces
  (_n.b. this is applied on an endpoint-by-endpoint basis_)
- responses from the /api/capabilities endpoint are modified to hide irrelevant options from admins and users
- responses from the /api/capabilities endpoint are further modified to hide administrative options from users

## Developing

Tests are set up to use [jest](https://jestjs.io). Jest is not included package.json / package-lock.json
to keep node_modules (which is vendored into the bosh release) slimmer and more straightforward. It's recommended
that you install jest outside of this repository.
