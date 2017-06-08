import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';

type TDatabase = 'postgresql' | 'mariadb';
type TPlan = '10g' | '30g' | '90g' | '240g';

export interface IDatabaseResource extends Base.IBaseResource {
    plan: {
        id: number;
    };
    settings: {
        dbConf: {
            common: {
                adminPassword: string;
                defaultUser: string;
                userPassword: string;
                servicePort: string;
            },
            backup: {
                rotate: number;
                time: string;
            }
        }
    };
    remark: {
        network: string[];
        servers: {
            ipAdress: string;
        };
        dbConf: {
            common: {
                databaseName: string;
                databaseVersion: string;
                databaseRevision: string;
            }
        };
        switch: {
            id: string;
        };
    };
    interfaces: Array<{
        ipAddress: string;
        userIPAddress: string;
        switch: {
            id: string;
            name: string;
            subnet: {
                networkAddress: string;
                networkMaskLen: number;
                defaultRoute: string;
            },
            userSubnet: {
                defaultRoute: string;
                networkMaskLen: number;
            }
    }
    }>;
    switch: {
        id: string;
    }
}

interface IResponse extends Sacloud.ICommonResponse {
    appliances: IDatabaseResource[]
}

interface IDatabaseTerraform {
    database_type?: TDatabase;
    plan?: TPlan;
    user_name: string;
    user_password?: string;
    allow_networks?: string[];
    port?: number;
    backup_time: string;
    switch_id: string
    ipaddress1: string;
    nw_mask_len: number;
    default_route: string;
}

export default class Database extends Base.BaseResource<IDatabaseResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_database',
            path: 'appliance',
            resField: 'appliances'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path,
            body  : {
                Filter: {
                    'Class': 'database'
                }
            }
        });

        this.items = res.appliances;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);

            const db: IDatabaseTerraform = {
                database_type: this.getDatabaseType(item),
                plan: item.plan.id === 1 ? '10g' : `${item.plan.id}g` as TPlan,
                user_name: item.settings.dbConf.common.defaultUser,
                user_password: item.settings.dbConf.common.userPassword,
                allow_networks: [],
                port: parseInt(item.settings.dbConf.common.servicePort, 10) || null,
                backup_time: item.settings.dbConf.backup.time,
                switch_id: item.switch.id,
                ipaddress1: item.interfaces[0].switch.subnet.networkAddress,
                nw_mask_len: item.interfaces[0].switch.subnet.networkMaskLen,
                default_route: item.interfaces[0].switch.subnet.defaultRoute
            };

            dest[this.type][item.id] = Object.assign(base, db);

            return dest;
        }, dest);
    }

    private getDatabaseType(item: IDatabaseResource): TDatabase {
        switch (item.remark.dbConf.common.databaseName.toLowerCase()) {
            case 'postgres':
                return 'postgresql';
            case 'mariadb':
                return 'mariadb';
            default:
                return null;
        }
    }
}