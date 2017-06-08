import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';
import Archive from '../DataSource/Archive';

export interface IDiskResource extends Base.IBaseResource {
    connection: TConnection;
    sizeMB: number;
    plan: {
        id: number;
        name: string;
    };
    sourceDisk?: {
        id: string;
        name: string;
        availability: string;
    };
    sourceArchive?: {
        id: string;
        name: string;
        availability: string;
    };
    bundleInfo?: {};
    server: {
        id: string;
        name: string;
        hostName: string;
    };
}

interface IResponse extends Sacloud.ICommonResponse {
    disks: IDiskResource[]
}

type TPlan = 'ssd' | 'hdd';
type TConnection = 'virtio' | 'ide';
interface IDiskForTerraform {
    plan?: TPlan;
    connector?: TConnection;
    size?: number;
    source_archive_id?: string;
    source_disk_id?: string;
    hostname?: string;
    password?: string;
    ssh_key_ids?: string[];
    disable_pw_auth?: boolean;
    note_ids?: string[];   
}

export default class Disk extends Base.BaseResource<IDiskResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_disk',
            path: 'disk',
            resField: 'disks'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path
        });

        this.items = res.disks;
    }

    mapping(resources, datasources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);
            const disk: IDiskForTerraform = {
                plan               : item.plan.id === 2 ? 'ssd' : 'hdd',
                connector          : item.connection,
                size               : item.sizeMB,
                source_archive_id  : this.getSourceArchiveID(item, datasources.archive),
                source_disk_id     : _.get<IDiskResource, string>(item, 'sourceDisk.id'),
                hostname           : _.get<IDiskResource, string>(item, 'server.hostName')
            };

            dest[this.type][item.id] = Object.assign(base, disk);

            return dest;
        }, dest);
    }

    private getSourceArchiveID(disk: IDiskResource, archive: Archive): string {
        if (!disk) return '';
        const publicArchive = archive.items.find(a => a.id === _.get<IDiskResource, string>(disk, 'sourceArchive.id'));

        return publicArchive ? super.createDataReference(archive.type, publicArchive.id) : '';
    }
}