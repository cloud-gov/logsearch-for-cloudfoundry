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

const pathAllowed = (requestPath, server=console) => {
  /*
  Strategy:
  check if the url is blocked. If it is, return false.
  then check if it's explicitly allowed, and return true.
  Finally, if it's neither blocked nor allowed, log and return true.
  */

  const normalized = path.normalize(requestPath)
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

  for (const denied of denylist) {
    if (denied.test(normalized)) {
      return false
    }
  }
  for (const allowed of allowlist) {
    if (allowed.test(normalized)) {
      return true
    }
  }
  server.log(["warn", "authentication", "helpers:filterUrl"], `unknown url allowed: ${requestPath} (normalized to ${normalized})`)
  return true
}

 const uaaPaginatorV2 = async (get, baseUrl, path, values = []) => {
  // CF API V2
  const response = await get(`${baseUrl}${path}`, { 'results-per-page': 100 })

  const data = response.resources.map(resource => ({
    guid: resource.metadata.guid,
    name: resource.entity.name,
  }))

  const updatedValues = values.concat(data)

  if (!response.next_url) return updatedValues

  return uaaPaginatorV2(get, baseUrl, response.next_url, updatedValues)
}

const uaaPaginatorV3 = async (get, url, values = []) => {
  // CF API V3
  const response = await get(url, { 'per_page': 100 })

  const data = response.resources.map(resource => ({
    guid: resource.guid,
    name: resource.name,
  }))

  const updatedValues = values.concat(data)

  if (!response.pagination.next) return updatedValues

  return uaaPaginatorV3(get, response.pagination.next.href, updatedValues)
}

module.exports = {
  ensureKeys,
  filterQuery,
  filterInternalQuery,
  filterSuggestionQuery,
  pathAllowed,
  uaaPaginatorV2,
  uaaPaginatorV3
}
