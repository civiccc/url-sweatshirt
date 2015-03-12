/**
 * @param {string} urlSpec A string specifying a path, including optional
 *   placeholders. For example, `/users/:id`.
 * @param {object} defaults Parameters to be pre-applied to the generated
 *   helper. They can still be overridden by the helper's caller.
 * @return {function} A function that can be called to generate URLs based on
 *   the given spec. The function can take positional args for the placeholders
 *   in the spec, as well as named arguments in an options object. Any extra
 *   named parameters will be included as query params; if any named parameters
 *   are missing, `generate` will throw an error.
 *
 *   There are a couple of special named parameters that can be provided:
 *
 *    * `_host`: The domain name to generate a URL for. If this is provided,
 *      URLs will be protocol-relative (`//host.com/path`) instead of relative.
 *
 *    * `_anchor`: A hash fragment to append to the URL.
 * @example
 *   var userPostUrl = generate('/users/:user_id/posts/:id');
 *
 *   // all return '/users/1/posts/2'
 *   userPostUrl(1, 2);
 *   userPostUrl(1, { id: 2 });
 *   userPostUrl({ user_id: 1, id: 2 });
 *
 *   // returns '/users/1/posts/2?extra_param=3'
 *   userPostUrl(1, 2, { extra_param: 3 });
 *
 *   // returns '/users/a%20b/posts/c%20d'
 *   userPostUrl('a b', 'c d');
 *
 *   // returns '/users/1/posts/2#an_anchor'
 *   userPostUrl(1, 2, { _anchor: 'an_anchor' });
 *
 *   // returns '//api.example.com/users/1/posts/2'
 *   userPostUrl(1, 2, { _host: 'api.example.com' });
 *
 *   // all raise errors
 *   userPostUrl();
 *   userPostUrl(1);
 *   userPostUrl(1, 2, 3);
 *   userPostUrl({ id: 1 }, 2);
 * @example
 *   var categoryUrl = generate('/categories/:name', { name: 'all' });
 *
 *   // returns '/categories/all'
 *   categoryUrl();
 *
 *   // returns '/categories/sports'
 *   categoryUrl('sports');
 */
function generate(urlSpec, defaults = {}) {
  return (...args) => {
    const lastArg = args[args.length - 1];
    let namedParams;

    if (lastArg && typeof lastArg === 'object') {
      namedParams = lastArg;
      args.pop();
    } else {
      namedParams = {};
    }

    return _generateUrl(urlSpec, defaults, args, namedParams);
  };
}

/**
 * @param {object} defaults An object containing parameters that should be
 *   pre-applied to a group of generated URL helpers. The most likely use case
 *   for this is to provide `_host`.
 * @param {function} callback A function that will have a customized version of
 *   `generate` passed to it.
 * @example
 *   var userUrl;
 *
 *   withDefaults({ _host: 'api.example.com' }, function(generate) {
 *     userUrl = generate('/users/:id');
 *   });
 *
 *   // returns '//api.example.com/users/1'
 *   userUrl(1);
 *
 *   // returns '//test.com/users/1'
 *   userUrl(1, { _host: 'test.com' });
 *
 *   // returns '/users/1'
 *   userUrl(1, { _host: null });
 */
function withDefaults(defaults, callback) {
}

/**
 * Build a URL based on the given spec, defaults, and params.
 * @private
 */
function _generateUrl(urlSpec, defaults, positionalParams, namedParams) {
  const segments = urlSpec.split('/').filter(segment => segment);
  const missingSegments = [];
  let queryString;

  let urlParts = segments.map((segment) => {
    if (segment.indexOf(':') === 0) {
      let paramName = segment.slice(1);
      let value;

      // Defaults have the lowest priority...
      if (defaults[paramName] !== undefined) {
        value = defaults[paramName];
        delete defaults[paramName];
      }

      // ... then positional params ...
      if (positionalParams.length) {
        value = positionalParams.shift();
      }

      // ... then named params.
      if (namedParams[paramName] !== undefined) {
        value = namedParams[paramName];
        delete namedParams[paramName];
      }

      if (value === undefined || value === null) {
        missingSegments.push(segment);
      }

      return value && encodeURIComponent(value.toString());
    } else {
      return segment;
    }
  });

  if (missingSegments.length) {
    throw new Error(
      `Missing [${missingSegments.join(', ')}] for spec '${urlSpec}'`
    );
  }

  if (positionalParams.length) {
    throw new Error(
      `Extra params [${positionalParams.join(', ')}] for spec '${urlSpec}'`
    );
  }

  queryString = _buildQueryString(defaults, namedParams) || '';

  return `/${urlParts.join('/')}${queryString}`;
}

/**
 * @param {array} paramObjects Objects containing key-value pairs of params.
 *   Objects passed later in the list have a higher precedence. Params with the
 *   value `null` will not appear in the final query string.
 * @return {string} A query string of the form '?a_param=1&another_param=2'.
 * @private
 */
function _buildQueryString(...paramObjects) {
  const params = {};
  let paramStrings = [];

  paramObjects.forEach((paramObject) => {
    Object.keys(paramObject).forEach((key) => {
      params[key] = paramObject[key];
    });
  });

  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      let value = encodeURIComponent(params[key].toString());
      paramStrings.push(`${key}=${value}`);
    }
  });

  if (paramStrings.length) {
    return `?${paramStrings.join('&')}`;
  }
}

module.exports = { generate, withDefaults };
