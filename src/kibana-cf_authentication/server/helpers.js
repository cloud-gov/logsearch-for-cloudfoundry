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
  uaaPaginatorV2,
  uaaPaginatorV3
}
