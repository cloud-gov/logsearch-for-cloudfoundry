const each = require("jest-each").default
const {filterPath} = require('./helpers')

const spy = jest.spyOn(console, 'log');

describe('unknown endpoints', () => {

    afterEach(() => {
        expect(spy).toHaveBeenCalled()
    });

    test('bar passes through filter', () => {
        expect(filterPath('/bar/')).toEqual('/bar/')
    });
});

describe('known endpoints', () => {
    afterEach(() => {
        expect(spy).not.toHaveBeenCalled()
    });
    each([
        'bundles/app/core/bootstrap.js',
        '2134/bundles/app/core/bootstrap.js',
    ]).it("allows %s without logging",  (path) => {
        expect(filterPath(path)).toEqual(path)
    });
    each([
        'app/dev_tools',
        'app/./././././dev_tools'
    ]).it("blocks %s without logging", (path) => {
        expect(filterPath(path)).toEqual('/401')
    });
});
