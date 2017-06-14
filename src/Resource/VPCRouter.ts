import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';
import Switch from './Switch';
import Router, { IRouterResource } from './Router';

type TPlan = 'standard' | 'premium' | 'highspec';
type TProtocol = 'tcp' | 'udp' | 'icmp' | 'fragment' | 'ip';
type TDirection = 'receive' | 'send';

export interface IFirewallConfig {
    protocol: TProtocol;
    sourceNetwork?: string;
    sourcePort?: number;
    destinationNetwork?: string;
    destinationPort?: number;
    acction: string;
    logging: string;
    description: string;
}

export interface IVPCRouterResource extends Base.IBaseResource {
    plan: {
        id: number;
    };
    settings: {
        router: {
            interfaces: Array<{
                ipAddress: string[];
                vietualIPAddress: string;
                ipAliases: string[];
                networkMaskLen: number;
            }>;
            vrid: number;
            syslogHost: string;
            staticNAT: {
                config: Array<{
                    globalAddress: string;
                    privateAddress: string;
                    description: string;
                }>;
                enabled: string;
            };
            portForwarding: {
                config: Array<{
                    protocol: TProtocol;
                    globalPort: string;
                    privateAddress: string;
                    privatePort: string;
                    description: string;
                }>;
                enabled: string;
            };

            siteToSiteIPsecVPN: {
                config: Array<{
                    peer: string;
                    preSharedSecret: string;
                    remoteId: string;
                    routes: string[];
                    localPrefix: string[];
                }>;
                enabled: string;
            }
            firewall: {
                config: Array<{
                    receive: Array<IFirewallConfig>;
                    send: Array<IFirewallConfig>;
                }>;
                enabled: string;
            }
        };
    };
    remark: {
        servers: Array<{
            ipAddress: string;
        }>;
        switch: {
            id: string;
        }
    };
    switch: {
        id: string;
        name: string;
    };
    interfaces: Array<{
        ipAddress?: string;
        userIPAddress: string;
        hostName?: string;
        switch: {
            id: string;
            name: string;
            subnet: {
                networkAddress: string;
                networkMaskLen: number;
                defaultRoute: string;
            };
            userSubnet: {
                defaultRoute: string;
                networkMaskLen: number;
            }
        }
    }>;
}

interface IResponse extends Sacloud.ICommonResponse {
    appliances: IVPCRouterResource[]
}

interface IVPCRouterForTerraform {
    plan?: TPlan;
    switch_id?: string;
    vip?: string;
    ipaddress1?: string;
    ipaddress2?: string;
    VRID?: number;
    aliases?: string[];
    syslog_host?: string;
}

interface IVPCRouterInterfaceForTerraform {
    vpc_router_id: string;
    index: number;
    vip?: string;
    ipaddress: string[];
    nw_mask_len: number;
    switch_id: string;
}

interface IVPCRouterStaticNatForTerraform {
    vpc_router_id: string;
    vpc_router_interface_id: string;
    global_address: string;
    private_address: string;
}

interface IVPCRouterPortFowardingForTerraform {
    vpc_router_id: string;
    vpc_router_interface_id: string;
    protocol: TProtocol;
    global_port: number;
    private_address: string;
    private_port: string;
    description: string;
}

interface IVPCRouterFirewallForTerraform {
    vpc_router_id: string;
    direction: TDirection;
    expressions: IVPCRouterExpressionForTerraform[];
}

interface IVPCRouterExpressionForTerraform {
    protocol: TProtocol;
    source_nw: string;
    source_port: number;
    dest_nw: string;
    dest_port: number;
    allow: boolean;
    logging?: boolean;
    description?: string;
}

interface IVPCRouterDHCPServerForTerraform {
    vpc_router_id: string;
    vpc_router_interface_index: number;
    range_start: string;
    range_stop: string;
}

interface IVPCRouterDHCPStaticMappingForTerraform {
    vpc_router_id: string;
    vpc_router_dhcp_server_id: string;
    ipaddress: string;
    macaddress: string;
}

interface IVPCRouterPPTPForTerraform {
    vpc_router_id: string;
    vpc_router_interface_id: string;
    range_start: string;
    range_stop: string;
}

interface IVPCRouterL2TPForTerraform {
    vpc_router_id: string;
    vpc_router_interface_id: string;
    pre_shared_secret: string;
    range_start: string;
    range_stop: string;
}

interface IVPCRouterUserForTerraform {
    vpc_router_id: string;
    name: string;
    password: string;
}

interface IVPCRouterS2SVPNForTerraform {
    vpc_router_id: string;
    peer: string;
    remote_id: string;
    pre_shared_secret: string;
    routes: string[];
    local_prefix: string[];
}

interface IVPCRouterStaticRouteForTerraform {
    vpc_router_id: string;
    vpc_router_interface_id: string;
    prefix: string;
    next_hop: string;
}


export default class VPCRouter extends Base.BaseResource<IVPCRouterResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_vpc_router',
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
                    Class: 'vpcrouter'
                }
            }
        });

        this.items = res.appliances;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {},
            [this.type + '_interface']: {},
            // [this.type + '_static_nat']: {},
            // [this.type + '_port_forwarding']: {},
            [this.type + '_firewall']: {},
            // [this.type + '_dhcp_server']: {},
            // [this.type + '_dhcp_static_mapping']: {},
            // [this.type + '_pptp']: {},
            // [this.type + '_l2tp']: {},
            // [this.type + '_user']: {},
            // [this.type + '_site_to_site_vpn']: {},
            // [this.type + '_static_route']: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);
            debugger
            const connectedRouter = this.getConnectedRouter(item, resources.switch, resources.router);
            if (!connectedRouter) { return dest; }

            const vpc: IVPCRouterForTerraform = {
                plan: this.getPlan(item),
                switch_id: super.createReference(resources.router.type, connectedRouter.id),
                vip: super.createReference(resources.router.type, connectedRouter.id, 'nw_ipaddresses.0'),
                ipaddress1: super.createReference(resources.router.type, connectedRouter.id, 'nw_ipaddresses.1'),
                ipaddress2: super.createReference(resources.router.type, connectedRouter.id, 'nw_ipaddresses.2'),
                aliases: [super.createReference(resources.router.type, connectedRouter.id, 'nw_ipaddresses.3')],
                VRID: item.settings.router.vrid,
                syslog_host: item.settings.router.syslogHost
            };
            dest[this.type][item.id] = Object.assign({}, base, vpc);

            const vpcRouterId = super.createReference(this.type, item.id);

            // _interface
            const ifaces = item.settings.router.interfaces || [];
            ifaces.forEach((iface, i) => {
                const vpcIface: IVPCRouterInterfaceForTerraform = {
                    vpc_router_id: vpcRouterId,
                    switch_id: item.interfaces[i].switch.id,
                    index: i + 1,
                    vip: iface.vietualIPAddress,
                    ipaddress: iface.ipAddress,
                    nw_mask_len: iface.networkMaskLen || item.interfaces[i].switch.userSubnet.networkMaskLen
                };
                dest[this.type + '_interface'][item.id + `_eth${i + 1}`] = vpcIface;
            });

            // _static_nat

            // // _port_forwarding
            // const forwardings = item.settings.router.portForwarding && item.settings.router.portForwarding.config || [];
            // forwardings.forEach((conf, i) => {
            //     const vpcPortForwarding: IVPCRouterPortFowardingForTerraform = {
            //         vpc_router_id: vpcRouterId,
            //         vpc_router_interface_id: '',
            //         protocol: conf.protocol,
            //         global_port: parseInt(conf.globalPort, 10),
            //         private_address: conf.privateAddress,
            //         private_port: conf.privatePort,
            //         description: conf.description
            //     };

            //     dest[this.type + '_port_forwarding'][item.id + `_forward${i + 1}`] = vpcPortForwarding;
            // });

            // _firewall
            const firewalls = item.settings.router.firewall && item.settings.router.firewall.config || [];
            firewalls.forEach((fw, i) => {
                const confMapping = fw => {
                    return <IVPCRouterExpressionForTerraform>{
                        protocol: fw.protocol,
                        source_nw: fw.sourceNetwork,
                        source_port: fw.sourcePort,
                        dest_nw: fw.destinationNetwork,
                        dest_port: fw.destinationPort,
                        allow: fw.acction === 'True',
                        logging: fw.logging === 'True',
                        description: fw.description
                    };
                };

                const receive = fw.receive.map(confMapping);
                const send = fw.send.map(confMapping);

                dest[this.type + '_firewall'][item.id + `_receive_fw${i + 1}`] = <IVPCRouterFirewallForTerraform>{
                    vpc_router_id: vpcRouterId,
                    direction: 'receive',
                    expressions: receive
                };
                dest[this.type + '_firewall'][item.id + `_send_fw${i + 1}`] = <IVPCRouterFirewallForTerraform>{
                    vpc_router_id: vpcRouterId,
                    direction: 'send',
                    expressions: send
                };
            });

            // _dhcp_server
            // _dhcp_static_mapping
            // _pptp
            // _l2tp
            // _user
            // _site_to_site_vpn
            // _static_route


            return dest;
        }, dest);
    }

    private getPlan(vpc: IVPCRouterResource): TPlan {
        switch (vpc.plan.id) {
            case 1:
                return 'standard';
            case 2:
                return 'premium';
            case 3:
                return 'highspec';
            default:
                return 'standard';
        }
    }

    private getConnectedRouter(vpc: IVPCRouterResource, sw: Switch, router: Router): IRouterResource {
        if (!_.includes([2, 3], vpc.plan.id)) { return null; }

        const connectedSwitch = sw.items.find(a => a.id === vpc.switch.id);
        return router.items.find(a => a.id === connectedSwitch.internet.id);
    }
}