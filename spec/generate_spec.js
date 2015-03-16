jest.autoMockOff();

const { generate } = require('../index');

describe('generate', () => {
  it('throws an error with invalid arguments', () => {
    expect(() => generate())
      .toThrow('Must provide a string as a URL spec');
    expect(() => generate(1))
      .toThrow('Must provide a string as a URL spec');
    expect(() => generate('/', null))
      .toThrow('Must provide an object for defaults');
  });

  describe('with a basic spec', () => {
    let userPostUrl;

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

    it('escapes params and query param names', () => {
      expect(userPostUrl('a/b', 'c/d', { 'e[]': 'f/g' }))
        .toEqual('/users/a%2Fb/posts/c%2Fd?e%5B%5D=f%2Fg');
    });

    it('adds an anchor', () => {
      expect(userPostUrl(1, 2, { _anchor: 'an_anchor' }))
        .toEqual('/users/1/posts/2#an_anchor');
    });

    it('adds a host', () => {
      expect(userPostUrl(1, 2, { _host: 'api.example.com' }))
        .toEqual('//api.example.com/users/1/posts/2');
    });

    it('can include a port in the _host param', () => {
      expect(userPostUrl(1, 2, { _host: 'api.example.com:8888' }))
        .toEqual('//api.example.com:8888/users/1/posts/2');
    });

    it('adds a protocol', () => {
      expect(userPostUrl(1, 2, { _host: 'example.com', _protocol: 'https' }))
        .toEqual('https://example.com/users/1/posts/2');
    });

    it('raises an error if given a protocol and no host', () => {
      expect(() => userPostUrl(1, 2, { _protocol: 'https' })).toThrow(
        "Can't provide a protocol with no host"
      );
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
    let categoryUrl;

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

    it('can be called more than once [regression]', () => {
      expect(categoryUrl()).toEqual(categoryUrl());
    });
  });

  describe("with a default parameter that isn't in the path", () => {
    let categoryUrl;

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

  describe('with a custom query encoder', () => {
    let generate, homeUrl;

    function myCustomEncoder(obj) {
      if (obj.returnHello) {
        return 'hello';
      } else {
        return '';
      }
    }

    beforeEach(() => {
      generate = require('../index')(myCustomEncoder).generate;
      homeUrl = generate('/');
    });

    it('uses the custom encoder', () => {
      expect(homeUrl({ returnHello: true })).toEqual('/?hello');
    });

    it('omits the ? if the custom encoder returns an empty string', () => {
      expect(homeUrl({ dontReturnHello: true })).toEqual('/');
    });
  });
});
