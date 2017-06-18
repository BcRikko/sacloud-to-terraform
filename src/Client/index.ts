import * as request from 'superagent';
import * as _ from 'lodash';
import Utils from '../utils';

export interface ICommonResponse {
    count: number;
    from: number;
    total: number;
    is_ok: boolean;
}

export interface IOption {
    accessToken: string;
    accessTokenSecret: string;
    apiRoot?: string;
    debug?: boolean;
    disableLocalizeKeys?: boolean;
}

export type TZone = 'is1a' | 'is1b' | 'tk1a' | 'tk1v';
export type TMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
interface IRequest {
    zone: TZone
    path: string;
    method?: TMethod;
    body?: object;
}

export class Client {
    constructor(private option: IOption) {}

    send <T>(req: IRequest): Promise<T> {
        const method = req.method || 'GET' as TMethod;
        const root = this.option.apiRoot || `https://secure.sakura.ad.jp/cloud/zone/${req.zone}/api/cloud/1.1/`

        return new Promise((resolve, reject) => {
            const r = request(method, root + req.path)
                .auth(this.option.accessToken, this.option.accessTokenSecret)
                .set({
                    'X-Sakura-HTTP-Method': method,
                    'X-Sakura-No-Authenticate-Header': 1,
                    'X-Sakura-API-Request-Format': 'json',
                    'X-Sakura-API-Response-Format': 'json',
                    'X-Sakura-Error-Level': 'none'
                });
            
            if (method === 'GET') {
                r.query(JSON.stringify(req.body));
            } else {
                r.send(req.body);
            }

            r.end((err, res) => {
                if (err) { reject(err); }

                if (this.option.disableLocalizeKeys) {
                    resolve(res.body);
                } else {
                    resolve(Utils.localizeKeys(res.body));
                }
            });
        });
    }
}