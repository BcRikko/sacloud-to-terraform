import * as _ from 'lodash';
import * as Sacloud from '../Client';

export interface IBaseResource {
    needsRemove: boolean;
    id: string;
    name: string;
    description: string;
    tags: string[];
    availability: string;
    serviceClass: string;
    zone: {
        id: number;
        name: string;
        description: string;
    }
}

export interface IBaseForTerraform {
    id?: number;
    name: string;
    description?: string;
    tags?: string[];
    zone?: string;
}

export interface IBase {
    type: string;
    path: string;
    resField: string;
    isSkip?: boolean;
}

export interface IResource {
    load: (client: Sacloud.Client, zone: string) => Promise<void>;
    mapping: (resources: any, datasource?: any) => any;
    
}

export class BaseResource<T> {
    readonly type: string;
    readonly path: string;
    readonly resField: string;
    readonly isSkip: boolean;
    items: T[] = [];

    constructor(config: IBase) {
        this.type = config.type;
        this.path = config.path;
        this.resField = config.resField;
        this.isSkip = !!config.isSkip;
    }

    baseMapping(item: IBaseResource): IBaseForTerraform {
        return {
            // id         : parseInt(item.id),
            name       : item.name,
            description: item.description,
            tags       : item.tags,
            zone       : _.get<IBaseResource, string>(item, 'zone.name')
        };
    }

    createReference(referenceType: string, referenceId: string, referenceField: string = 'id'): string {
        return `\${${referenceType}.${referenceId}.${referenceField}}`;
    }

    createDataReference(referenceType: string, referenceId: string): string {
        return `\${data.${referenceType}.${referenceId}.id}`;
    }
}