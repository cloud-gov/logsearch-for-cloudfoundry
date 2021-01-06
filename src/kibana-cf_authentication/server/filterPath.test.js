const {filterPath} = require('./helpers');

describe('filterPath', () => {
    let spy;

    beforeEach(() => {
        spy = jest.spyOn(console, 'log')
    });

    afterEach(() => spy.mockRestore());

    describe('unknown endpoints', () => {
        test('bar passes through filter', () => {
            expect(filterPath('/bar/')).toEqual('/bar/')
            expect(spy).toHaveBeenCalledTimes(1)
        });
    });

    describe('known endpoints', () => {
        it("allows %s without logging",  () => {
            const paths = [
                'bundles/app/core/bootstrap.js',
                '2134/bundles/app/core/bootstrap.js',
            ];

            paths.map(path => expect(filterPath(path)).toEqual(path));
            expect(spy).not.toHaveBeenCalled();
        });

        it("blocks %s without logging", () => {
            const paths = [
                'app/dev_tools',
                'app/./././././dev_tools'
            ];

            paths.map(path => expect(filterPath(path)).toEqual('/401'));
            expect(spy).not.toHaveBeenCalled();
        });
    });
});
