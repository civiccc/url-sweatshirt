# url-sweatshirt

*Wrap your URLs in a warm layer of helper functions.*

[![npm version](https://badge.fury.io/js/url-sweatshirt.svg)](http://badge.fury.io/js/url-sweatshirt)
[![Build Status](https://travis-ci.org/brigade/url-sweatshirt.svg?branch=master)](https://travis-ci.org/brigade/url-sweatshirt)

Projects like [JsRoutes] are great when your JavaScript is tightly integrated
with a Rails backend. However, if you want to reduce coupling between your
frontend and backend code, you're going to need to manage your routes manually.
`url-sweatshirt` eases that transition by generating Rails-like URL helpers for
you.

``` javascript
var generate = require('url-sweatshirt').generate;
var userPostUrl = generate('/users/:userId/posts/:id');

// all return '/users/1/posts/2'
userPostUrl(1, 2));
userPostUrl(1, { id: 2 });
userPostUrl({ userId: 1, id: 2 });

// returns '/users/1/posts/2?q=javascript'
userPostUrl(1, 2, { q: 'javascript' });

// returns '/users/1/posts/2?q=javascript&foo=bar'
userPostUrl(1, 2, { q: 'javascript' }, { foo: 'bar' });
```

### Defaults

When you define a URL, you can pass in defaults for both path parameters and
query parameters.

``` javascript
var categoryUrl = generate('/categories/:name', { name: 'all', locale: 'en' });

// returns '/categories/all?locale=en'
categoryUrl();
```

Callers can then override the defaults. They can also remove a default query
parameter by passing `null`.

``` javascript
// returns '/categories/books'
categoryUrl('books', { locale: null });
```

### Special parameters

`_anchor`, `_host`, and `_protocol` are special:

``` javascript
var fancyUrl = generate('/', {
  _host: 'www.example.com',
  _protocol: 'https'
});

// returns 'https://www.example.com/#post-5'
fancyUrl({ _anchor: 'post-5' });
```

If you provide `_host` but not `_protocol`, you'll get a protocol-relative URL
(i.e., one starting with `//`).

### Shared defaults

If you need to define a bunch of helpers with shared default parameters, you
can use the `withDefaults` function. It takes a callback and passes in a
version of `generate` with the given defaults baked in.

``` javascript
var withDefaults = require('url-sweatshirt').withDefaults;
var urls = {};

withDefaults({ _host: 'api.example.com' }, function(generate) {
  urls.userUrl = generate('/users/:id');
});

// returns '//api.example.com/users/1'
urls.userUrl(1);
```

### Using a fancier query encoder

By default, the query string is built using a simple function that calls
`toString()` on param values and then URI-encodes the param keys and values.
For some use cases, it's helpful to use alternate strategies for this -- for
example, you might want to use jQuery's `$.param` to convert objects and arrays
into Rails-style bracket notation. You can accomplish this by calling the
function exported from the `url-sweatshirt` module and passing in a function
with the appropriate signature (takes a single object param and returns a
string).

``` javascript
var simpleGenerate = require('url-sweatshirt').generate;
var simpleHomeUrl = simpleGenerate('/');

var complexGenerate = require('url-sweatshirt')($.param).generate;
var complexHomeUrl = complexGenerate('/');

// returns '/?a=1&b=[object%20Object]'
simpleHomeUrl({ a: 1, b: { c: 2, d: 3 }});

// returns '/?a=1&b[c]=2&b[d]=3`
complexHomeUrl({ a: 1, b: { c: 2, d: 3 }});
```

### Features that aren't supported yet

* Optional and splat params.
* Lots of other features that we didn't need yet. Pull requests welcome!

[JsRoutes]: https://github.com/railsware/js-routes

## Code of conduct

This project adheres to the [Open Code of Conduct][code-of-conduct]. By
participating, you are expected to honor this code.

[code-of-conduct]: https://github.com/brigade/code-of-conduct
