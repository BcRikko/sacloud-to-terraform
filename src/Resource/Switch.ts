import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';
import Bridge from './Bridge';

export interface ISwitchResource extends Base.IBaseResource {
    userSubnet: {
        defaultRoute?: string;
        networkMaskLen?: string;
    };
    hybridConnection?: {};
    subnets: [
        {
            id?: string;
            networkAddress?: string;
            networkMaskLen?: string;
            defaultRoute?: string;
            nextHop?: string;
            staticRoute?: string;
            ipAddresses: {
                min?: string;
                max?: string;
            };
            internet: {
                id?: string;
                name?: string;
            }
        }
    ];
    ipb6Nets: string[];
    internet?: {
        id: string;
        name: string;
    };
    bridge?: {};
}

interface IResponse extends Sacloud.ICommonResponse {
    switches: ISwitchResource[]
}

interface ISwitchTerraform {
    bridge_id?: string;
    server_ids?: string[];
}

export default class Switch extends Base.BaseResource<ISwitchResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_switch',
            path: 'switch',
            resField: 'switches'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path
        });

        this.items = res.switches;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            if (item.needsRemove) { return dest; }

            const base = super.baseMapping(item);

            const sw: ISwitchTerraform = {
                bridge_id: this.getBridgeID(item, resources.bridge)
            };

            dest[this.type][item.id] = Object.assign(base, sw);

            return dest;
        }, dest);
    }

    private getBridgeID(sw: ISwitchResource, bridge: Bridge): string {
        const bridgeID = _.get<ISwitchResource, string>(sw, 'bridge.id');
        return bridgeID && super.createReference(bridge.type, bridgeID) || '';
    }
}