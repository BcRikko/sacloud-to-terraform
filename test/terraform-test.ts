import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process'
import * as yaml from 'js-yaml';
import * as jsonServer from 'json-server';

import ClientTest from './client';

const execSync = cp.execSync;

const endpoints = path.resolve('./test', 'api');

const api = fs.readdirSync(endpoints).reduce((api, file) => {
    const endpoint = path.basename(file, path.extname(file));
    api[endpoint] = yaml.safeLoad(fs.readFileSync(endpoints + '/' + file, 'utf-8'));
    return api;
}, {});

const server = jsonServer.create();
const router = jsonServer.router(api);
const middlewares = jsonServer.defaults();

function start() {
    server.use(middlewares);
    server.use(router);
    server.listen(3000, () => {
        // test
        ClientTest();
    });
}

start();