
import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';

export interface ISSHKeyResource extends Base.IBaseResource {
    publicKey: string;
    fingerprint: string;
}

interface IResponse extends Sacloud.ICommonResponse {
    sshKeys: ISSHKeyResource[]
}

interface ISSHKeyTerraform {
    public_key: string;
}

export default class SSHKey extends Base.BaseResource<ISSHKeyResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_ssh_key',
            path: 'sshkey',
            resField: 'sshKeys'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path
        });

        this.items = res.sshKeys;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);
            const sshKey: ISSHKeyTerraform = {
                public_key: item.publicKey
            };

            dest[this.type][item.id] = Object.assign(base, sshKey);

            return dest;
        }, dest);
    }
}