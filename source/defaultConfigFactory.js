const config = require('config');

module.exports = defaultConfigFactory;

function defaultConfigFactory() {
    return {
        get: (key) => config.get(key)
    };
}