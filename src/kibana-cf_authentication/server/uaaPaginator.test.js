const fs = require('fs');
const path = require('path');
const url = require('url');
const helpers = require('./helpers');

async function get(reqUrl) {
  const { pathname } = url.parse(reqUrl);
  const filepath = path.join(__dirname, '../fixtures/', pathname)

  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (err, data) => {
      if (err) return reject(err);
      const response = JSON.parse(data);
      return resolve(response);
    });
  })
}

describe('UAA Pagination', () => {
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

});
