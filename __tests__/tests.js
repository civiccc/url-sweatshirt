jest.autoMockOff();

const { wrap, withDefaults } = require('../src/');

describe('wrap', () => {
  describe('with a basic spec', () => {
    var userPostUrl;

    beforeEach(() => {
      userPostUrl = wrap('/users/:user_id/posts/:id');
    });

    it('supports positional params', () => {
      expect(userPostUrl(1, 2)).toEqual('/users/1/posts/2');
    });

    it('supports named params', () => {
      expect(userPostUrl(1, { id: 2 })).toEqual('/users/1/posts/2');
    });

    it('supports a mix of named and positional params', () => {
      expect(userPostUrl({ user_id: 1, id: 2 })).toEqual('/users/1/posts/2');
    });

    it('adds extra params to the query string', () => {
      expect(userPostUrl(1, 2, { extra_param: 3, another_extra_param: 4 }))
        .toEqual('/users/1/posts/2?extra_param=3&another_extra_param=4');
    });

    it('leaves a query param out if null is provided', () => {
      expect(userPostUrl(1, 2, { extra_param: null }))
        .toEqual('/users/1/posts/2');
    });

    it('escapes params', () => {
      expect(userPostUrl('a b', 'c d')).toEqual('/users/1/posts/2');
    });

    it('adds an anchor', () => {
      expect(userPostUrl(1, 2, { _anchor: 'an_anchor' }))
        .toEqual('/users/1/posts/2#an_anchor');
    })

    it('adds a hostname', () => {
      expect(userPostUrl(1, 2, { _host: 'api.example.com' }))
        .toEqual('//api.example.com/users/1/posts/2');
    });

    xit('raises an error if there are missing params');
    // userPostUrl();
    // userPostUrl(1);
    // userPostUrl(1, null);
    // userPostUrl(1, 2, 3);
    // userPostUrl({ id: 1 }, 2);
  });

  describe('with a default parameter', () => {
    var categoryUrl;

    beforeEach(() => {
      categoryUrl = wrap('/categories/:name', { name: 'all' });
    });

    it('fills in the default', () => {
      expect(categoryUrl()).toEqual('/categories/all');
    });

    it('overrides the default with a positional param', () => {
      expect(categoryUrl('sports')).toEqual('/categories/sports');
    });

    it('overrides the default with a named param', () => {
      expect(categoryUrl({ name: 'sports' })).toEqual('/categories/sports');
    });
  });

  xdescribe('with invalid arguments');
  // wrap();
  // wrap(1);
  // wrap({ _host: 'example.com' });
});

describe('withDefaults', () => {
  var userUrl;

  beforeEach(() => {
    withDefaults({ _host: 'api.example.com' }, function(wrap) {
      userUrl = wrap('/users/:id');
    });
  });

  it('adds the params by default', () => {
    expect(userUrl(1)).toEqual('//api.example.com/users/1');
  });

  it('allows the params to be overridden', () => {
    expect(userUrl(1, { _host: 'test.com' })).toEqual('//test.com/users/1');
  });

  it('allows the params to be removed', () => {
    expect(userUrl(1, { _host: null })).toEqual('/users/1');
  });
});
