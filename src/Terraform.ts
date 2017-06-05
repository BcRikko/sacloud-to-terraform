import * as Sacloud from './Client';
import Utils from './utils';

import * as Base from './Resource/Base';
import Server from './Resource/Server';
import Disk from './Resource/Disk';
import Switch from './Resource/Switch';
import PacketFilter from './Resource/PacketFilter';
import Bridge from './Resource/Bridge';

export default class Terraform {
    readonly accessToken: string;
    readonly secretToken: string;
    readonly defaultZone: string
    readonly client: Sacloud.Client;

    readonly resourceInstances: {[instance: string]: Base.IResource};

    constructor ({ accessToken, secretToken, defaultZone}) {
        this.accessToken = accessToken;
        this.secretToken = secretToken;
        this.defaultZone = defaultZone;

        this.client = new Sacloud.Client({
            accessToken: this.accessToken,
            accessTokenSecret: this.secretToken
        });

        this.resourceInstances = {
            server      : new Server(),
            disk        : new Disk(),
            packetFilter: new PacketFilter(),
            switch      : new Switch(),
            bridge      : new Bridge()
        };
    }

    async load(): Promise<void[]> {
        const requests = Object.keys(this.resourceInstances).map(r => {
            return this.resourceInstances[r].load(this.client, this.defaultZone);
        });

        return Promise.all(requests);
    }

    exportFile() {
        const tfJSON = {
            provider: {
                sakuracloud: {
                    token: this.accessToken,
                    secret: this.secretToken,
                    zone: this.defaultZone
                }
            },
            resource: []
        };

        const isEmpty = val => val === '' || val === null || val === undefined;
        Object.keys(this.resourceInstances).forEach(r => {
            const resource = Utils.removeObjectBy(
                this.resourceInstances[r].mapping(this.resourceInstances),
                isEmpty
            );
            tfJSON.resource.push(resource);
        });

        return tfJSON;
    }
}