jest.autoMockOff();

const { withDefaults } = require('../index');

describe('withDefaults', () => {
  let userUrl;

  beforeEach(() => {
    withDefaults({ _host: 'api.example.com' }, function(generate) {
      userUrl = generate('/users/:id');
    });
  });

  xit('adds the params by default', () => {
    expect(userUrl(1)).toEqual('//api.example.com/users/1');
  });

  xit('allows the params to be overridden', () => {
    expect(userUrl(1, { _host: 'test.com' })).toEqual('//test.com/users/1');
  });

  xit('allows the params to be removed', () => {
    expect(userUrl(1, { _host: null })).toEqual('/users/1');
  });
});
