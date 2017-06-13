import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';

export interface IIPAddressResource extends Base.IBaseResource {
    index: number;
    ipAddress: string;
    hostName?: string;
    subnet: {
        id: number;
        switch: {
            id: number;
        };
        internet?: string;
        networkAddress: string;
        networkMaskLen: number;
        defaultRoute: string;
        nextHop?: string;
        staticRoute?: string;
    };
    interface?: string;
}

interface IResponse extends Sacloud.ICommonResponse {
    ipAddress: IIPAddressResource[]
}

interface IIPAddressTerraform {
}

export default class IPAddress extends Base.BaseResource<IIPAddressResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_dummy',
            path: 'ipaddress',
            resField: 'ipAddress',
            isSkip: true
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path
        });

        this.items = res.ipAddress;
    }

    mapping(resources): any {
        // nop
    }
}