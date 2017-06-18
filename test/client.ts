import * as Sacloud from '../src/Client';
import { expect } from 'chai';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

process.on('unhandledRejection', console.dir);

const envs = yaml.safeLoad(fs.readFileSync('env.yml', 'utf-8'));
const config = envs.find(a => a.account === process.env.ACCOUNT) || envs.find(a => a.account === 'default') || envs[0];

export default function test() {
    describe('GET /server', () => {
        it('サーバ一覧を取得できる', done => {
            // Error: Resolution method is overspecified. Specify a callback *or* return a Promise; not both.
            (async () => {
                const client = new Sacloud.Client({
                    accessToken: config.accessToken,
                    accessTokenSecret: config.secretToken,
                    apiRoot: 'http://localhost:3000/'
                });
                let res;
                try {
                    res = await client.send({
                        method: 'GET',
                        zone: 'tk1v',
                        path: 'server'
                    });
                    expect(!!res).to.be.true;
                    done();

                } catch (e) {
                    done(e);
                }
            })();
        });
    });
}