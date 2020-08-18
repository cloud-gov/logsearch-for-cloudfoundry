const fetch = require('cross-fetch');
const helpers = require('./server/helpers');

async function get(url) {
  const res = await fetch(url);
  const data = await res.json();
  return data
}

test('the v2 api pagination helper to make multiple requests', async () => {
  const baseUrl = 'http://localhost:8080';
  const path = '/v2/page1.json';

  const results = await helpers.uaaPaginatorV2(get, baseUrl, path);
  expect(results).toHaveLength(13);
  results.map(item => expect(Object.keys(item)).toEqual(['guid', 'name']));
});

test('the v3 api pagination helper to make multiple requests', async () => {
  const url = 'http://localhost:8080/v3/page1.json';

  const results = await helpers.uaaPaginatorV3(get, url);
  expect(results).toHaveLength(13);
  results.map(item => expect(Object.keys(item)).toEqual(['guid', 'name']));
});
