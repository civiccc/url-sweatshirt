jest.autoMockOff();

const { generate } = require('..');

describe('generate', () => {
  describe('with a basic spec', () => {
    var userPostUrl;

    beforeEach(() => {
      userPostUrl = generate('/users/:user_id/posts/:id');
    });

    it('supports positional params', () => {
      expect(userPostUrl(1, 2)).toEqual('/users/1/posts/2');
    });

    it('supports named params', () => {
      expect(userPostUrl({ user_id: 1, id: 2 })).toEqual('/users/1/posts/2');
    });

    it('supports a mix of named and positional params', () => {
      expect(userPostUrl(1, { id: 2 })).toEqual('/users/1/posts/2');
    });

    it('overrides positional params with named ones', () => {
      expect(userPostUrl(3, { user_id: 1, id: 2 })).toEqual('/users/1/posts/2');
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
      expect(userPostUrl('a/b', 'c/d', { e: 'f/g' }))
        .toEqual('/users/a%2Fb/posts/c%2Fd?e=f%2Fg');
    });

    xit('adds an anchor', () => {
      expect(userPostUrl(1, 2, { _anchor: 'an_anchor' }))
        .toEqual('/users/1/posts/2#an_anchor');
    })

    xit('adds a hostname', () => {
      expect(userPostUrl(1, 2, { _host: 'api.example.com' }))
        .toEqual('//api.example.com/users/1/posts/2');
    });

    it('raises an error if there are missing params', () => {
      expect(() => userPostUrl()).toThrow(
        "Missing [:user_id, :id] for spec '/users/:user_id/posts/:id'"
      );

      expect(() => userPostUrl(1)).toThrow(
        "Missing [:id] for spec '/users/:user_id/posts/:id'"
      );

      expect(() => userPostUrl(1, null)).toThrow(
        "Missing [:id] for spec '/users/:user_id/posts/:id'"
      );
    });

    it('raises an error if there are extra positional params', () => {
      expect(() => userPostUrl(1, 2, 3)).toThrow(
        "Extra params [3] for spec '/users/:user_id/posts/:id'"
      );
    });
  });

  describe('with a default parameter', () => {
    var categoryUrl;

    beforeEach(() => {
      categoryUrl = generate('/categories/:name', { name: 'all' });
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

  describe("with a default parameter that isn't in the path", () => {
    var categoryUrl;

    beforeEach(() => {
      categoryUrl = generate('/categories', { name: 'all' });
    });

    it('adds it as a query param', () => {
      expect(categoryUrl()).toEqual('/categories?name=all');
    });

    it('can be removed with null', () => {
      expect(categoryUrl({ name: null })).toEqual('/categories');
    });
  });

  xdescribe('with invalid arguments');
  // generate();
  // generate(1);
  // generate({ _host: 'example.com' });
});
