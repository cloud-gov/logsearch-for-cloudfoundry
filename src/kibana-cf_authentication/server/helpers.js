const path = require('path')

const isObject = (value) => {
  return value instanceof Object && !(value instanceof Array)
}

const ensureKeys = (value, keys) => {
  let key
  while (keys.length) {
    key = keys.shift()
    if (typeof value[key] === 'undefined') {
      value[key] = {}
    }
    value = value[key]
  }
  return value
}

const filterSuggestionQuery = (payload, cached) => {
  // query for /api/kibana/suggestions/values/<index name> endpoints after kibana 7.7
  let boolFilter = payload.boolFilter || []

  boolFilter.push(
    {'bool':
      {'must': [
        { 'terms': { '@cf.space_id': cached.account.spaceIds } },
        { 'terms': { '@cf.org_id': cached.account.orgIds } }
        ]
      }
    }
  )
  payload.boolFilter = boolFilter
  return payload
}

const filterInternalQuery = (payload, cached) => {
  // query for /internal/search/es endpoints after kibana 7.7
  let bool = ensureKeys(payload, ['params', 'body', 'query', 'bool'])

  bool.must = bool.must || []
  // Note: the `must` clause may be an array or an object
  if (isObject(bool.must)) {
    bool.must = [bool.must]
  }
  bool.must.push(
    { 'terms': { '@cf.space_id': cached.account.spaceIds } },
    { 'terms': { '@cf.org_id': cached.account.orgIds } }
  )
  return payload
}

const filterQuery = (payload, cached) => {
  // query for /elasticsearch/_msearch and /elasticsearch/_search prior to Kibana 7.7
  let bool = ensureKeys(payload, ['query', 'bool'])

  bool.must = bool.must || []
  // Note: the `must` clause may be an array or an object
  if (isObject(bool.must)) {
    bool.must = [bool.must]
  }
  bool.must.push(
    { 'terms': { '@cf.space_id': cached.account.spaceIds } },
    { 'terms': { '@cf.org_id': cached.account.orgIds } }
  )
  return payload
}

const filterPath = (requestPath, server=console) => {
  /*
  Strategy:
  check if the url is blocked. If it is, redirect to the blocked endpoint.
  then check if it's explicitly allowed, and return it unchanged if so.
  Finally, if it's neither blocked nor allowed, log and allow.
  */

  const normalized = path.normalize(requestPath)
  const blocked = "/401"
  // These should probably always be anchored with ^
  const allowlist = [
    /^\/?ui\//,
    /^\/?(\d+\/)?bundles/,
    /^\/?app\/home/,
    /^\/?api\/core\/capabilities/,
    /^\/?api\/index_patterns\/_fields_for_wildcard/,
    /^\/?api\/kibana\/management\/saved_objects\/_allowed_types/,
    /^\/?api\/kibana\/management\/saved_objects\/_find/,
    /^\/?api\/kibana\/management\/saved_objects\/scroll\/counts/,
    /^\/?api\/licensing\/info/,
    /^\/?api\/saved_objects\/_bulk_get/,
    /^\/?api\/saved_objects\/_find/,
    /^\/?translations/,
    /^\/?internal\/search/,
    /^\/?login/,
    /^\/?oauth\/authorize/,
    /^\/?plugins\/authenication/,
    /^\/?node_modules/,
  ]
  const denylist = [
    /^\/?indexPatterns/,
    /^\/?advancedSettings/,
    /^\/?management\/data\//,
    /^\/?management\/ingest\//,
    /^\/?management\/insightsAndAlerting\//,
    /^\/?management\/stack\/license_management/,
    /^\/?app\/dev_tools/,
  ]

  for (denied of denylist) {
    if (denied.test(normalized)) {
      return blocked
    }
  }
  for (allowed of allowlist) {
    if (allowed.test(normalized)) {
      return requestPath
    }
  }
  server.log(["warn", "authentication", "helpers:filterUrl"], `unknown url allowed: ${requestPath} (normalized to ${normalized})`)
  return requestPath
}

module.exports = {
  ensureKeys,
  filterQuery,
  filterInternalQuery,
  filterSuggestionQuery,
  filterPath
}
