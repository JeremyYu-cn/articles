'use strict';

/**
 * 测试definedProperty用占用内存
 */
var i = 0;
var proxy = new Proxy({}, {
    get(target, propkey) {
        return target[propkey];
    },

    set(target, propkey, value) {
        return target[propkey] = value
    }
});
console.time('proxy');
for (var x = 0; x < 10000; x++) {
    proxy['test_' + x] = 1;
}
console.timeEnd('proxy');

// definedProperty
var i = 0;
var defineObj = {};
console.log('start');
timer = setInterval(function(){
    if (i > 10) {
        console.log('finish');
        return clearTimeout(timer);
    }
    for (var x = 0; x < 100000; x++) {
        Object.defineProperty(defineObj, 'test_' + i + '_' + x,{
            get() {
                return value;
            },
            set(value) {
                return defineObj['test_' + i + '_' + x] = value;
            }
        });
    }
    i++;
}, 1000)


/**
 * 测试defineProperty执行时间
 */
var i = 0;
var defineObj = {};
console.time('defineProperty');
for (var x = 0; x < 100000; x++) {
    Object.defineProperty(defineObj, 'test_' + x,{
        get() {
            return value;
        },
        set(value) {
            return defineObj['test_' + x] = value;
        }
    });
}
console.timeEnd('defineProperty');


/**
 * proxy监听数组下标 
 */
var proxyArr = new Proxy([], {
    get(target, propkey) {
        console.log('获取数组下标被监听');
        return target[propkey];
    },
    set(target, propkey, value) {
        console.log('设置数组下标被监听');
        return target[propkey] = value;
    }
})

proxyArr[0];

proxyArr[0] = 1;


/**
 * proxy监听对象原型
 */
var obj = {a:1};
var prototypeObj = Object.create(obj);
var proxyPrototype = new Proxy(prototypeObj, {
    get(target, propkey) {
        console.log('获取对象原型被监听');
        return target[propkey];
    },
    set(target, propkey, value) {
        console.log('设置对象原型被监听');
        return target[propkey] = value;
    }
})

console.log(proxyPrototype.a);

proxyPrototype.a = 2;
