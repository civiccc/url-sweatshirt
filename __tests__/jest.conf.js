var babel = require('babel');

module.exports = {
  process: function(src, path) {
    if (path.indexOf('node_modules') === -1) {
      src = babel.transform(src, { modules: 'common' }).code;
    }
    return src;
  }
};
