import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';

type TBool = 'True' | 'False';
type TProtocol = 'http'| 'https'| 'ping'| 'tcp'| 'dns'| 'ssh'| 'smtp'| 'pop3'| 'snmp';
type TSNMP = '1' | '2c';

export interface ISimpleMonitorResource extends Base.IBaseResource {
    status: {
        target: string;
    };
    settings: {
        simpleMonitor: {
            delayLoop: number;
            healthCheck: {
                protocol: TProtocol;
                host?: string;
                path?: string;
                status?: string;
                port?: string;
                qName?: string;
                expectedData?: string;
                threshold?: string;
                community?: string;
                snmpVersion?: TSNMP;
                oid?: string;
            };
            enabled: TBool;
            notifyEmail: {
                enabled: TBool;
                html: TBool;
            };
            notifySlack: {
                enabled: TBool;
                incomingWebhooksURL: string;
            }
        }
    };
}

interface IResponse extends Sacloud.ICommonResponse {
    commonServiceItems : ISimpleMonitorResource[]
}

interface ISimpleMonitorTerraform {
    target: string;
    health_check: {
        protocol: TProtocol;
        delay_loop?: number;
        path?: string;
        host_header?: string;
        status?: string;
        port?: number;
        qname?: string;
        expected_data?: string;
        community?: string;
        snmp_version?: TSNMP;
        oid?: string;
    };
    notify_email_enabled?: boolean;
    notify_email_html?: boolean;
    notify_slack_enabled?: boolean;
    notify_slack_webhook?: string;
    enabled?: boolean;
}

export default class SimpleMonitor extends Base.BaseResource<ISimpleMonitorResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_simple_monitor',
            path: 'commonserviceitem',
            resField: 'commonServiceItems'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path,
            body  : {
                Filter: {
                    'Provider.Class': 'simplemon'
                }
            }
        });

        this.items = res.commonServiceItems;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);
            const s = item.settings.simpleMonitor;
            const simplemon: ISimpleMonitorTerraform = {
                target: item.status.target,
                health_check: {
                    protocol: s.healthCheck.protocol,
                    delay_loop: s.delayLoop,
                    path: s.healthCheck.path,
                    host_header: s.healthCheck.host,
                    status: s.healthCheck.status,
                    port: parseInt(s.healthCheck.port, 10),
                    qname: s.healthCheck.qName,
                    expected_data: s.healthCheck.expectedData,
                    community: s.healthCheck.community,
                    snmp_version: s.healthCheck.snmpVersion,
                    oid: s.healthCheck.oid
                },
                notify_email_enabled: s.notifyEmail.enabled === 'True',
                notify_email_html: s.notifyEmail.html === 'True',
                notify_slack_enabled: s.notifySlack.enabled === 'True',
                notify_slack_webhook: s.notifySlack.incomingWebhooksURL,
                enabled: s.enabled === 'True'
            };

            dest[this.type][item.id] = Object.assign(base, simplemon);

            return dest;
        }, dest);
    }
}