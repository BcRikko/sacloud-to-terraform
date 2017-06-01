import Utils from '../src/utils';
import { expect } from 'chai';

describe('isPremitive', () => {
    it('プリミティブ型はtrueを返す', () => {
        // number
        expect(Utils.isPrimitive(-1)).to.be.true;
        expect(Utils.isPrimitive(0)).to.be.true;
        expect(Utils.isPrimitive(1)).to.be.true;

        // string
        expect(Utils.isPrimitive('a')).to.be.true;
        expect(Utils.isPrimitive('')).to.be.true;

        // boolean
        expect(Utils.isPrimitive(true)).to.be.true;
        expect(Utils.isPrimitive(false)).to.be.true;
    });

    it('参照型はfalseを返す', () => {
        // array
        expect(Utils.isPrimitive([1,2,3])).to.be.false;
        expect(Utils.isPrimitive([])).to.be.false;

        // object
        expect(Utils.isPrimitive({ a: 1 })).to.be.false;
        expect(Utils.isPrimitive({})).to.be.false;

        // class
        expect(Utils.isPrimitive(Utils)).to.be.false;

        // null
        expect(Utils.isPrimitive(null)).to.be.false;

        // undefined
        expect(Utils.isPrimitive(undefined)).to.be.false;

        // function
        expect(Utils.isPrimitive(function () {})).to.be.false;
    });
});

describe('localizeKeys', () => {
    it('プリミティブ型とArrayはそのまま返す', () => {
        expect(Utils.localizeKeys(1)).to.be.eq(1);
        expect(Utils.localizeKeys('a')).to.be.eq('a');
        expect(Utils.localizeKeys(true)).to.be.true;
        expect(Utils.localizeKeys([1,2,3])).to.include.members([1,2,3]);
    });

    it('参照型のキーをcamelCaseにして返す', () => {
        const obj = { Hoge: 'hoge', fuga: 'fuga', FooBar: 'foobar', fizzBuzz: 'fizzBuzz' };
        const expectObj = { hoge: 'hoge', fuga: 'fuga', fooBar: 'foobar', fizzBuzz: 'fizzBuzz' };

        expect(Utils.localizeKeys(obj)).to.deep.equal(expectObj);

        const deepObj = {
            Hoge: 'hoge', 
            fuga: {
                FooBar: 'foobar',
                fizzBuzz: 'fizzBuzz'
            }
        };
        const expectDeepObj = {
            hoge: 'hoge',
            fuga: {
                fooBar: 'foobar',
                fizzBuzz: 'fizzBuzz'
            }    
        };

        expect(Utils.localizeKeys(deepObj)).to.deep.equal(expectDeepObj);
    });
});