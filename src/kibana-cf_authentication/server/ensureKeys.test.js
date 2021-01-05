const {ensureKeys} = require('./helpers')


test('returns same when keys present', () => {
    let obj =  {'foo': {'bar':{'baz':{}}}}
    expect(ensureKeys(obj, ['foo','bar','baz'])).toBe(obj.foo.bar.baz);
    expect(obj).toEqual({'foo': {'bar':{'baz':{}}}});
});

test('adds keys when not present', () => {
    let obj = {'foo': {}};
    expect(ensureKeys(obj, ['foo','bar','baz'])).toBe(obj.foo.bar.baz);
    expect(obj).toEqual({'foo': {'bar':{'baz':{}}}});
});

test('does not mess with siblings', () => {
    let obj = {'foo': {'quux': {}}};
    expect(ensureKeys(obj, ['foo','bar','baz'])).toBe(obj.foo.bar.baz);
    expect(obj).toEqual({'foo': {'quux': {}, 'bar':{'baz':{}}}});
})
