import * as _ from 'lodash';
import * as Sacloud from '../Client';
import * as Base from './Base';
import Disk from './Disk';
import PacketFilter from './PacketFilter';
import Switch from './Switch';

export interface IServerResource extends Base.IBaseResource {
    hostName: string;
    serverPlan: {
        id: number;
        name: string;
        cpu: number;
        memoryMB: number;
        serviceClass: string 
    };
    instance: {
        server: {
            id: string;
        },
        status: string;
    };
    disks: [
        {
            id: string;
            name: string;
            connection: string;
            sizeMB: number;
            plan: {
                id: number;
            },
            bundleInfo: {}
        }
    ];
    interfaces: [
        {
            id: string;
            macAddress: string;
            ipAddress: string;
            userIPAddress?: string;
            switch?: {
                id: string;
                name: string;
                scope: string;
                subnet: {
                    id?: string;
                    networkAddress: string;
                    networkMaskLen: number;
                    defaultRoute: string;
                    internet: {
                        bandWidthMbps: number;
                    }
                },
                userSubnet: {
                    defaultRoute: string;
                    networkMaskLen: number;
                }
            },
            packetFilter?: {
                id?: string;
                name?: string;
            }
        }
    ];
}

interface IResponse extends Sacloud.ICommonResponse {
    servers: IServerResource[]
}

interface IServerForTerraform {
    disks: string[];
    core?: number;
    memory?: number;
    nic?: string;
    additional_nics?: string[];
    packet_filter_ids?: string[];
    cdrom_id?: string;
    ipaddress?: string;
    gateway?: string;
    nw_mask_len?: string;
}

export default class Server extends Base.BaseResource<IServerResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_server',
            path: 'server',
            resField: 'servers'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone: zone as Sacloud.TZone,
            path: this.path
        });

        this.items = res.servers;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };
        return this.items.reduce((dest, item) => {
            const base = super.mapping(item);
            const server: IServerForTerraform = {
                disks: this.getDisks(item, resources.disk),
                core: item.serverPlan.cpu,
                memory: item.serverPlan.memoryMB,
                packet_filter_ids: this.getPacketFilterIDs(item, resources.packetFilter),
                nic: this.getNic(item, resources.switch),
                additional_nics: this.getAdditionalNics(item, resources.switch)
            };

            dest[this.type][item.id] = Object.assign(base, server);

            return dest;
        }, dest);
    }

    private getDisks(server: IServerResource, disk: Disk): string[] {
        if (!disk) return [];

        const diskIds = disk.items.map(a => a.id);

        return server.disks.reduce((dest, myDisk) => {
            if (_.includes(diskIds, myDisk.id)) {
                dest.push(super.createReference(disk.type, myDisk.id));
            }
            return dest;
        }, []);
    }

    private getPacketFilterIDs(server: IServerResource, pf: PacketFilter): string[] {
        if (!pf || !server.interfaces) return [];

        return server.interfaces.reduce((dest, iface) => {
            if (iface.packetFilter) {
                dest.push(super.createReference(pf.type, iface.packetFilter.id));
            }

            return dest;
        }, []);
    }

    private getNic(server: IServerResource, sw: Switch): string {
        switch (_.get<IServerResource, string>(server, 'interfaces[0].switch.scope')) {
            case 'shared':
                return 'shared';
            case 'user':
                return super.createReference(sw.type, server.interfaces[0].switch.id);
            default:
                return '';
        }
    }

    private getAdditionalNics(server: IServerResource, sw:Switch): string[] {
        if (server.interfaces.length <= 1) return [];

        return server.interfaces.slice(1).reduce((dest, iface) => {
            if (iface.switch.scope === 'user') {
                dest.push(super.createReference(sw.type, iface.switch.id));
            }
            return dest;
        }, []);
    }
}