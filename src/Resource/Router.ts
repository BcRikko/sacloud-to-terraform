import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';
import Switch from './Switch';

export interface IRouterResource extends Base.IBaseResource {
    bandWidthMbps: number;
    networkMaskLen: number;
    switch: {
        id: string;
        name: string;
        userSubnet: {
            defaultRoute: string;
            networkMaskLen: number;
        };
        hybridConnection: {};
        subnets: Array<{
            id: string;
            networkAddress: string;
            networkMaskLen: number;
            defaultRoute: string;
            nextHop: string;
            staticRoute: string;
        }>;
        iPv6Nets: Array<{
            id: string;
            iPv6Prefix: string;
            iPv6PrefixLen: number;
        }>;
        bridge: {}
    }
}

interface IResponse extends Sacloud.ICommonResponse {
    internet: IRouterResource[]
}

interface IRouterForTerraform {
    nw_mask_len?: number;
    band_width?: number;
    enable_ipv6?: boolean;
    server_ids?: string[];
    switch_id?: string;
    nw_address?: string;
    gateway?: string;
    min_ipaddress?: string;
    max_ipaddress?: string;
    ipaddress?: string;
    ipv6_prefix?: string;
    ipv6_prefix_len?: number;
    ipv6_nw_address?: string;
}

export default class Router extends Base.BaseResource<IRouterResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_internet',
            path: 'internet',
            resField: 'internet'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path
        });

        this.items = res.internet;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);

            const router: IRouterForTerraform = {
                nw_mask_len: item.networkMaskLen,
                band_width: item.bandWidthMbps,
                enable_ipv6: item.switch.iPv6Nets && item.switch.iPv6Nets.length > 0
            };

            dest[this.type][item.id] = Object.assign(base, router);

            return dest;
        }, dest);
    }
}