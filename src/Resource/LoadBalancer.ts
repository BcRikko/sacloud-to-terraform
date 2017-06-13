import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';
import Server from './Server';
import Switch from './Switch';
import { ISwitchResource } from './Switch';
import Router from './Router';
import IPAddress from './IPAddress';

interface IInnerLoadBalancer {
    virtualIPAddress: string;
    port: string;
    delayLoop: string;
    sorryServer: string;
    servers: Array<{
        ipAddress: string;
        port: string;
        healthCheck: {
            protocol: TProtocol;
            path: string;
            status: string;
        };
        enabled: string;
    }>;    
}

export interface ILoadBalancerResource extends Base.IBaseResource {
    plan: {
        id: number;
    };
    settings: {
        loadBalancer: Array<IInnerLoadBalancer>;
    };
    remark: {
        servers: Array<{
            ipAddress: string;
        }>;
        switch: {
            id: string;
        };
        vrrp: {
            vrid: number;
        };
        network: {
            networkMaskLen: number;
            defaultRoute: string;
        }
    };
    interfaces: Array<{
        ipAddress?: string;
        userIPAddress?: string;
        switch: {
            id: string;
            subnet: {
                networkAddress: string;
                networkMaskLen: number;
                defaultRoute: string;
            };
            userSubnet: {
                networkMaskLen: number;
                defaultRoute: string;
            };
        }
    }>;
}

interface IResponse extends Sacloud.ICommonResponse {
    appliances: ILoadBalancerResource[]
}


type TPlan = 'standard' | 'highspec';
type TProtocol = 'ping' | 'tcp' | 'http' | 'https';

interface ILoadBalancerForTerraform {
    switch_id: string;
    VRID: number;
    high_availability?: boolean;
    plan?: TPlan;
    ipaddress1: string;
    ipaddress2?: string;
    nw_mask_len: number | string;
    default_route?: string;
}

interface ILoadBalancerVIPForTerraform {
    load_balancer_id: string;
    vip: string;
    port: number;
    delay_loop?: number;
    sorry_server?: string;
}

interface ILoadBalancerServerForTerraform {
    load_balancer_vip_id: string;
    ipaddress: string;
    check_protocol: TProtocol;
    check_path? :string;
    check_status?: string;
    enabled?: boolean;
}

export default class LoadBalancer extends Base.BaseResource<ILoadBalancerResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_load_balancer',
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
                    Class: 'loadbalancer'
                }
            }
        });

        this.items = res.appliances;
    }

    mapping(resources, datasources): any {
        const dest = {
            [this.type]: {},
            [this.type + '_vip']: {},
            [this.type + '_server']: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);
            const lb: ILoadBalancerForTerraform = {
                switch_id: item.remark.switch.id,
                VRID: item.remark.vrrp.vrid,
                high_availability: this.isHighAvailability(item),
                plan: item.plan.id === 1 ? 'standard' : 'highspec',
                ipaddress1: this.getIPAddress(1, item, resources.switch, resources.router),
                ipaddress2: this.getIPAddress(2, item, resources.switch, resources.router),
                nw_mask_len: this.getNetworkMaskLen(item, resources.switch, resources.router),
                default_route: this.getDefaultRoute(item, resources.switch, resources.router)
            };
            dest[this.type][item.id] = Object.assign({}, base, lb);


            _.forEach(item.settings && item.settings.loadBalancer, (a, i) => {
                // VIP
                const lbVIP: ILoadBalancerVIPForTerraform = {
                    load_balancer_id: super.createReference(this.type, item.id),
                    vip: this.getVIP(a, item, resources.switch, resources.router, resources.ipAddress),
                    port: parseInt(a.port, 10),
                    delay_loop: parseInt(a.delayLoop, 10),
                    sorry_server: a.sorryServer
                };

                const vipId = item.id + `_vip${i}`
                dest[this.type + '_vip'][vipId] = lbVIP;

                // Servers
                _.forEach(a.servers, (sv, j) => {
                    const lbServers: ILoadBalancerServerForTerraform = {
                            load_balancer_vip_id: super.createReference(this.type + '_vip', vipId),
                            ipaddress: this.getServerIPAddress(sv, resources.server),
                            check_protocol: sv.healthCheck.protocol,
                            check_path: sv.healthCheck.path,
                            check_status: sv.healthCheck.status,
                            enabled: sv.enabled === 'True'
                    };

                    dest[this.type + '_server'][vipId + `_server${j}`] = lbServers;
                });
            });

            return dest;
        }, dest);
    }

    private getIPAddress(index: number, lb: ILoadBalancerResource, sw: Switch, router: Router): string {
        if (index === 2 && !this.isHighAvailability(lb)) {
            return null;
        }

        if (this.isRouter(lb, router)) {
            const swId = this.getSwitchID(lb, sw, router);
            return super.createReference(router.type, swId, `ipaddresses[${index + 1}]`);

        } else {
            return lb.remark.servers[index - 1].ipAddress;
        }

    }

    private getNetworkMaskLen(lb: ILoadBalancerResource, sw: Switch, router: Router): string | number {
        if (this.isRouter(lb, router)) {
            const swId = this.getSwitchID(lb, sw, router);
            return super.createReference(router.type, swId, 'nw_mask_len');

        } else {
            return _.get<ILoadBalancerResource, number>(lb, 'interfaces[0].switch.subnet.networkMaskLen') || _.get<ILoadBalancerResource, number>(lb, 'interfaces[0].switch.userSubnet.networkMaskLen')
        }
    }

    private getDefaultRoute(lb: ILoadBalancerResource, sw: Switch, router: Router): string {
        if (this.isRouter(lb, router)) {
            const swId = this.getSwitchID(lb, sw, router);
            return super.createReference(router.type, swId, 'gateway');

        } else {
            return _.get<ILoadBalancerResource, string>(lb, 'interfaces[0].switch.subnet.defaultRoute') || _.get<ILoadBalancerResource, string>(lb, 'interfaces[0].switch.userSubnet.defaultRoute')
        }
    }

    private getVIP(item: any, lb:ILoadBalancerResource ,sw: Switch, router: Router, ipAddress: IPAddress): string {
        const ip = ipAddress.items.find(a => a.ipAddress === item.virtualIPAddress);
        if (ip) {
            const swId = this.getSwitchID(lb, sw, router);
            return super.createReference(router.type, swId, `ipaddresses[${ip.index}]`);
        } else {
            return item.virtualIPAddress;
        }
    }

    private getServerIPAddress(lb, server: Server): string {
        const s = server.items.find(a => _.includes([a.interfaces[0].ipAddress, a.interfaces[0].userIPAddress], lb.ipAddress));
        if (s) {
            return super.createReference(server.type, s.id, 'ipaddress')
        }
        return lb.apAddress;
    }

    private getSwitchID(lb: ILoadBalancerResource, sw: Switch, router: Router): string {
        let swId: string;
        const r = router.items.find(a => a.switch.id === lb.remark.switch.id);
        if (r) {
            // ルータ+スイッチに接続
            swId = r.id;
        } else {
            // スイッチに接続
            swId = _.get<ISwitchResource, string>(sw.items.find(a => a.id === lb.remark.switch.id), 'id');
        }
        return swId;
    }

    private isHighAvailability(lb: ILoadBalancerResource): boolean {
        return lb.remark.servers.length > 1
    }

    private isRouter(lb: ILoadBalancerResource, router: Router): boolean {
        return !!router.items.find(a => a.id === lb.remark.switch.id);
    }
}