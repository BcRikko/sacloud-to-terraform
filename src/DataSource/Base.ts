import { IResource, IBase, IBaseResource } from '../Resource/Base';

export interface IBase extends IBase {}
export interface IBaseData extends IBaseResource {}
export interface IData extends IResource {}

export class BaseData<T> {
    readonly type: string;
    readonly path: string;
    readonly resField: string;
    items: T[];

    constructor(config: IBase) {
        this.type = config.type;
        this.path = config.path;
        this.resField = config.resField;
    }
}