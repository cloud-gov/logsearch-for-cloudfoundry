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

const filterQuery = (payload, cached) => {
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
  const response = await get(`${baseUrl}${path}`);

  const data = response.resources.map(resource => ({
    guid: resource.metadata.guid,
    name: resource.entity.name,
  }));

  const updatedValues = values.concat(data);

  if (!response.next_url) return updatedValues;

  return uaaPaginatorV2(get, baseUrl, response.next_url, updatedValues)
}

const uaaPaginatorV3 = async (get, url, values = []) => {
  // CF API V3
  const response = await get(url);

  const data = response.resources.map(resource => ({
    guid: resource.guid,
    name: resource.name,
  }));

  const updatedValues = values.concat(data);

  if (!response.pagination.next) return updatedValues;

  return uaaPaginatorV3(get, response.pagination.next.href, updatedValues)
}

module.exports = {
  filterQuery,
  uaaPaginatorV2,
  uaaPaginatorV3
}
