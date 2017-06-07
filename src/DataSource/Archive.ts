import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';

type TScope = 'user' | 'shared';

export interface IArchiveData extends Base.IBaseData {
    scope: TScope;

}

interface IResponse extends Sacloud.ICommonResponse {
    archives: IArchiveData[]
}

interface IArchiveTerraform {
    filter?: Array<{
        name: string;
        values: string[];
    }>
    os_type?: string;
}

export default class Archive extends Base.BaseData<IArchiveData> implements Base.IData {
    constructor() {
        super({
            type: 'sakuracloud_archive',
            path: 'archive',
            resField: 'archives'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path,
            body  : {
                Filter: {
                    Availability: 'available',
                    Scope: 'shared'
                }
            }
        });
        
        this.items = res.archives;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const archive: IArchiveTerraform = {
                filter: [
                    {
                        name: 'Tags',
                        values: item.tags
                    }
                ]
            };

            const name = item.name.replace(/\s/g, '');
            dest[this.type][name] = archive;

            return dest;
        }, dest);
    }
    
}