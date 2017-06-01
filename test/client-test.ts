import * as Sacloud from '../src/Client';
import { expect } from 'chai';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

process.on('unhandledRejection', console.dir);

const config = yaml.safeLoad(fs.readFileSync('env.yml', 'utf-8'));

describe('GET /server', () => {
    it('サーバ一覧を取得できる', done => {
        // Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both.
        (async () => {
            const client = new Sacloud.Client({
                accessToken: config.accessToken,
                accessTokenSecret: config.secretToken
            });

            let res;
            try {
                res = await client.send({
                    method: 'GET',
                    zone: 'tk1v',
                    path: 'archive'
                });
            } catch (e) {
                console.error(e);
                done(e);
            }

            expect(true).to.be.true;
            done();
        })();
    });
});