const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const endpoints = path.resolve('./test', 'api');
const api = fs.readdirSync(endpoints).reduce((api, file) => {
    const endpoint = path.basename(file, path.extname(file));
    api[endpoint] = yaml.safeLoad(fs.readFileSync(endpoints + '/' + file, 'utf-8'));

    return api;
}, {});

module.exports = () => api;