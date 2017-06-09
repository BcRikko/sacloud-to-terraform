import * as _ from 'lodash';
import * as Sacloud from './Client';
import Utils from './utils';

// Resource
import * as Base from './Resource/Base';
import Server from './Resource/Server';
import Disk from './Resource/Disk';
import Switch from './Resource/Switch';
import Router from './Resource/Router';
import PacketFilter from './Resource/PacketFilter';
import Bridge from './Resource/Bridge';
import SimpleMonitor from './Resource/SimpleMonitor';
import Database from './Resource/Database';
import SSHKey from './Resource/SSHKey';

// DataSource
import * as DataBase from './DataSource/Base';
import Archive from './DataSource/Archive';

export default class Terraform {
    readonly accessToken: string;
    readonly secretToken: string;
    readonly defaultZone: string
    readonly client: Sacloud.Client;

    readonly resourceInstances: {[instance: string]: Base.IResource};
    readonly datasourceInstances: {[instance: string]: DataBase.IData};

    constructor ({ accessToken, secretToken, defaultZone}) {
        this.accessToken = accessToken;
        this.secretToken = secretToken;
        this.defaultZone = defaultZone;

        this.client = new Sacloud.Client({
            accessToken: this.accessToken,
            accessTokenSecret: this.secretToken
        });

        this.resourceInstances = {
            server       : new Server(),
            disk         : new Disk(),
            packetFilter : new PacketFilter(),
            switch       : new Switch(),
            router       : new Router(),
            bridge       : new Bridge(),
            database     : new Database(),
            simpleMonitor: new SimpleMonitor(),
            sshKey       : new SSHKey()
        };

        this.datasourceInstances = {
            archive: new Archive()
        };
    }

    async load(): Promise<void[]> {
        const resourceRequests = Object.keys(this.resourceInstances).map(r => {
            return this.resourceInstances[r].load(this.client, this.defaultZone);
        });

        const datasourceRequests = Object.keys(this.datasourceInstances).map(d => {
            return this.datasourceInstances[d].load(this.client, this.defaultZone);
        });

        const requests = [...resourceRequests, ...datasourceRequests];
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
            resource: [],
            data: []
        };

        const isEmpty = val => val === '' || val === null || val === undefined;
        Object.keys(this.resourceInstances).forEach(r => {
            const items = this.resourceInstances[r]['items'] as Base.IBaseResource[];

            if (items.length > 0 && items.some(a => !a.needsRemove)) {
                const resource = Utils.removeObjectBy(
                    this.resourceInstances[r].mapping(this.resourceInstances, this.datasourceInstances),
                    isEmpty
                );

                tfJSON.resource.push(resource);
            }
        });

        Object.keys(this.datasourceInstances).forEach(d => {
            if (this.datasourceInstances[d]['items'].length > 0) {
                const datasource = Utils.removeObjectBy(
                    this.datasourceInstances[d].mapping(this.datasourceInstances),
                    isEmpty
                );
                tfJSON.data.push(datasource);
            }
        });

        return tfJSON;
    }
}