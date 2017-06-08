import * as _ from 'lodash';
import * as Base from './Base';
import * as Sacloud from '../Client';

type IProtocol = 'tcp' | 'udp' | 'icmp' | 'fragment' | 'ip';

export interface IPacketFilterResource extends Base.IBaseResource {
    expression: Array<{
        protocol: IProtocol;
        sourceNetwork?: string;
        sourcePort?: number | string;
        destinationPort?: number | string;
        action?: string;
        description?: string;
    }>;
}

interface IResponse extends Sacloud.ICommonResponse {
    packetFilters: IPacketFilterResource[]
}

interface IExpressionForTerraform {
    protocol: IProtocol;
    source_nw?: string;
    source_port?: number | string;
    dest_port?: number | string;
    allow?: boolean;
    description?: string;
}

interface IPacketFilterForTerraform {
    expressions: IExpressionForTerraform[];
}

export default class PacketFilter extends Base.BaseResource<IPacketFilterResource> implements Base.IResource {
    constructor() {
        super({
            type: 'sakuracloud_packet_filter',
            path: 'packetfilter',
            resField: 'packetFilters'
        });
    }

    async load(client: Sacloud.Client, zone: string) {
        const res = await client.send<IResponse>({
            method: 'GET',
            zone  : zone as Sacloud.TZone,
            path  : this.path
        });

        this.items = res.packetFilters;
    }

    mapping(resources): any {
        const dest = {
            [this.type]: {}
        };

        return this.items.reduce((dest, item) => {
            const base = super.baseMapping(item);

            const expressions = item.expression && item.expression.map(ex => {
                return <IExpressionForTerraform>{
                    protocol: ex.protocol,
                    source_nw: ex.sourceNetwork,
                    source_port: ex.sourcePort,
                    dest_port: ex.destinationPort,
                    allow: ex.action === 'allow',
                    description: ex.description
                };
            })

            const pf: IPacketFilterForTerraform = {
                expressions: expressions || []
            };

            dest[this.type][item.id] = Object.assign(base, pf);

            return dest;
        }, dest);
    }
}