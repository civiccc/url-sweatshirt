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
 *   There are a few special named parameters that can be provided:
 *
 *    * `_host`: The domain name to generate a URL for. If this is provided,
 *      URLs will be protocol-relative (`//host.com/path`) instead of relative.
 *
 *    * `_anchor`: A hash fragment to append to the URL.
 *
 *    * `_protocol`: A protocol to include in the URL. If this is given but
 *      there's no host, the helper will raise an error.
 *
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
 *   // returns 'http://api.example.com/users/1/posts/2'
 *   userPostUrl(1, 2, { _host: 'api.example.com', _protocol: 'http' });
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
  if (typeof urlSpec !== 'string') {
    throw new Error('Must provide a string as a URL spec');
  }

  if (!defaults || typeof defaults !== 'object') {
    throw new Error('Must provide an object for defaults');
  }

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
function withDefaults(globalDefaults, callback) {
  callback((urlSpec, localDefaults = {}) => {
    localDefaults = _cloneObject(localDefaults);

    for (let key in globalDefaults) {
      if (globalDefaults.hasOwnProperty(key) &&
          !localDefaults.hasOwnProperty(key)) {
        localDefaults[key] = globalDefaults[key];
      }
    }

    return generate(urlSpec, localDefaults);
  });
}

/**
 * Build a URL based on the given spec, defaults, and params.
 * @private
 * @param {string} urlSpec
 * @param {object} _defaults
 * @param {object[]} _positionalParams
 * @param {object} _namedParams
 * @return {string}
 */
function _generateUrl(urlSpec, _defaults, _positionalParams, _namedParams) {
  const defaults = _cloneObject(_defaults);
  const positionalParams = _positionalParams.slice(0);
  const namedParams = _cloneObject(_namedParams);

  const segments = urlSpec.split('/').filter(segment => segment);
  const missingSegments = [];

  /**
   * @param {string} segment
   * @return {boolean}
   */
  function isSegmentDynamic(segment) {
    return segment.charAt(0) === ':';
  }

  /**
   * @param {string} segment
   * @return {string}
   */
  function getParamValue(segment) {
    const name = isSegmentDynamic(segment) ? segment.slice(1) : segment;
    let value;

    if (defaults[name] !== undefined) {
      value = defaults[name];
      delete defaults[name];
    }

    if (positionalParams.length) {
      value = positionalParams.shift();
    }

    if (namedParams[name] !== undefined) {
      value = namedParams[name];
      delete namedParams[name];
    }

    if (value === undefined || value === null) {
      missingSegments.push(segment);
    }

    return value ? value.toString() : '';
  }

  /**
   * @return {string}
   */
  function buildProtocolAndHostString() {
    const protocol = getParamValue('_protocol');
    const host = getParamValue('_host');

    if (!host && protocol) {
      throw new Error("Can't provide a protocol with no host");
    }

    return [
      protocol ? `${protocol}:` : '',
      host ? `//${host}/` : '/'
    ].join('');
  }

  /**
   * @return {string}
   */
  function buildAnchorString() {
    const anchor = getParamValue('_anchor');
    return anchor ? `#${anchor}` : '';
  }

  /**
   * @return {string}
   */
  function buildQueryString() {
    const params = {};
    const paramObjects = [defaults, namedParams];
    const paramStrings = [];

    paramObjects.forEach((paramObject) => {
      Object.keys(paramObject).forEach((key) => {
        params[key] = paramObject[key];
      });
    });

    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        const encodedKey = encodeURIComponent(key);
        const value = encodeURIComponent(params[key].toString());
        paramStrings.push(`${encodedKey}=${value}`);
      }
    });

    return paramStrings.length ? `?${paramStrings.join('&')}` : '';
  }

  const urlParts = segments.map((segment) => {
    if (isSegmentDynamic(segment)) {
      return encodeURIComponent(getParamValue(segment));
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

  const protocolAndHost = buildProtocolAndHostString();
  const anchor = buildAnchorString();
  const query = buildQueryString(); // build last to avoid special params

  return [protocolAndHost, urlParts.join('/'), query, anchor].join('');
}

/**
 * @param {object} object
 * @return {object} Return a shallow clone of the given object.
 */
function _cloneObject(object) {
  const newObject = {};

  for (let key in object) {
    if (object.hasOwnProperty(key)) {
      newObject[key] = object[key];
    }
  }

  return newObject;
}

module.exports = { generate, withDefaults };
