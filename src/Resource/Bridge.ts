import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';

export interface IBridgeResource extends Base.IBaseResource {
}

interface IResponse extends Sacloud.ICommonResponse {
    bridges: IBridgeResource[]
}

interface IBridgeTerraform {
}

export default class Bridge extends Base.BaseResource<IBridgeResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_bridge',
            path: 'bridge',
            resField: 'bridges'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path
        });

        this.items = res.bridges;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);
            dest[this.type][item.id] = base;

            return dest;
        }, dest);
    }
}