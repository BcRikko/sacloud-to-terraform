import * as _ from 'lodash';

export default class Utils {
    static isPrimitive(val: any): boolean {
        return _.includes(['string',  'number', 'boolean'], typeof val);
    }

    static localizeKeys(object: any): any {
        function _localize(obj) {
            if (Utils.isPrimitive(obj) || obj === null) {
                return obj;
            }

            if (Array.isArray(obj)) {
                const dest = [];
                obj.forEach(a => {
                    if (Utils.isPrimitive(a) || a === null)  return dest.push(a);
                    if (typeof a === 'object') return dest.push(_localize(a));
                });
                return dest;
            }

            if (typeof obj === 'object') {
                const dest = {};
                Object.keys(obj).forEach(a => {
                    if (Utils.isPrimitive(obj[a]) || obj[a] === null) {
                        return dest[Utils.camelCase(a)] = obj[a];
                    }

                    if (typeof obj[a] === 'object') {
                        return dest[Utils.camelCase(a)] = _localize(obj[a]);
                    }
                });
                return dest;
            }
        }

        return _localize(object);
    }

    static camelCase(str) {
        return str.replace(/^[A-Z]+$/g, function (str) {
                return str.toLowerCase();
            }).replace(/^[A-Z][^A-Z]+$/g, function (str) {
                return str.toLowerCase();
            }).replace(/^([A-Z]+)([A-Z])/g, function (str, p1, p2) {
                return p1.toLowerCase() + p2;
            }).replace(/^([A-Z])([a-z])/g, function (str, p1, p2) {
                return p1.toLowerCase() + p2;
            }).replace('cdroMs', 'cdroms');
    }

    static removeObjectBy(object: Object, condition: (value: any) => boolean): Object {
        const _obj = _.cloneDeep(object);
        const _cond = typeof condition === 'function' ? condition : function (value: any) { return true; };

        function _remove (obj: Object, cond?: (any) => boolean): void {
            for (let o in obj) {
                if (Array.isArray(obj[o])) {
                    // Through
                } else if (_cond(obj[o])) {
                    delete obj[o];

                } else if (typeof obj[o] === 'object') {
                    _remove(obj[o]);
                }
            }
        }

        _remove(_obj, _cond);
        return _obj;
    }
}