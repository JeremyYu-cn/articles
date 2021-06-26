### 1.什么是Proxy
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)中的描述   
 > The Proxy object is used to define custom behavior for fundamental operations (e.g. property lookup, assignment, enumeration, function invocation, etc).   
 Proxy 对象一般用于给基本操作定义自定义行为（例如：属性查询，赋值，枚举，函数调用等）

Proxy是ES6中原生提供的一个构造函数，Proxy字面意思是“代理”，其实它更像一种拦截器，在访问,赋值等基本操作时会先到我们定义好的拦截方法中，根据访问的信息去执行我们想要的操作。

---

### 2.Proxy的用法

Proxy构造函数中接受两个参数   

``` javascript
    new Proxy(target, handler);
```

* `target` 参数指的是目标对象
* `handler` 指用户自定义的行为对象

来看一个使用例子🌰：
``` javascript
    var handler = {
        get (target, propkey, receiver) {
            console.log('getting values');
            return target[propkey] || 'value is not defined';
        },
        set (target, propkey, value, receiver) {
            console.log('setting values');
            return target[propkey] = value;
        }
    }
    var proxy = new Proxy({}, handler);
    
    console.log(proxy.a);
    // 输出
    // getting values
    // value is not defined
    
    proxy.a = 111;
    // 输出
    // setting values
    
    console.log(proxy.a)
    // 输出
    // getting values
    // 111
```
上面代码定义了一个拥有 get 和 set 的代理，当我们在访问`proxy`对象中的`a`时，会进入`handler`中的 get 方法并执行。同样，当我们给`proxy`赋值时，亦会进入`handler`中的set方法中。   

* proxy中的的get和set方法和<b>[Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)</b>的descriptor的get和set方法很像，但`proxy`中的get和set更为强大，不仅可以监听数组下标的变化，还可以监听到对象原型属性的变化
``` javascript
    /**
     *  proxy监听数组下标
     */
    var proxyArr = new Proxy([], {
        get(target, propkey) {
            console.log('数组下标被监听:get');
            return target[propkey];
        },
        set(target, propkey, value) {
            console.log('数组下标被监听:set');
            return target[propkey] = value;
        }
    })
    console.log(proxyArr[0]);
    // 数组下标被监听:get
    // undefined
    
    proxyArr[0] = 1;
    // 数组下标被监听:set

    /**
     *   proxy监听对象原型
     */
    var obj = {a:1};
    var prototypeObj = Object.create(obj);
    var proxyPrototype = new Proxy(prototypeObj, {
        get(target, propkey) {
            console.log('对象原型被监听:get');
            return target[propkey];
        },
        set(target, propkey, value) {
            console.log('对象原型被监听:set');
            return target[propkey] = value;
        }
    })
    console.log(proxyPrototype.a);
    // 对象原型被监听:get
    //  1
    
    proxyPrototype.a = 2;
    // 对象原型被监听:set
```   

* `handler`中的对象属性   
`Proxy`不仅可以用于监听数据变化，还可以监听调用函数，构造函数实例化等操作   
`handler`对象具体的参数有13个：
    * `get(target, propkey, receiver)`
    * `set(target, propkey, receiver)`
    * `has(target, propkey)`
    * `deleteProperty(target, propkey)`
    * `ownkeys(target)`
    * `getOwnPropertyDescriptor(target, propKey)`
    * `defineProperty(target, propkey, propDesc)`
    * `preventExtensions(target)`
    * `getPrototypeOf(target)`
    * `isExtensible(target)`
    * `setPrototypeOf(target, proto)`
    * `apply(target, object, args) // 调用函数前触发`
    * `construct(target, args) // 构造函数实例化前触发`

---

### 3.Proxy与defineProperty比较

1. 上文说到，`defineProperty`不能监听数组下标变化和对象原型的变化，`Proxy`则可以支持。

2. `defineProperty`监听的是一个对象的属性，`proxy`监听的是整个对象。

3. 与`defineProperty`比较`proxy`的速度更快，我们写两个测试的用例比较一下两者的速度
``` javascript
    /**
    *  defineProperty测试用例
    */
    var defineObj = {};
    console.time('defineProperty');
    for (var x = 0; x < 100000; x++) {
        Object.defineProperty(defineObj, 'test_' + x, {
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
     *  proxy测试用例
     */
    var proxy = new Proxy({}, {
        get(target, propkey) {
            return target[propkey];
        },

        set(target, propkey, value) {
            return target[propkey] = value
        }
    });
    console.time('proxy');
    for (var x = 0; x < 100000; x++) {
        proxy['test_' + x] = 1;
    }
    console.timeEnd('proxy');
```   
* 在chrome中运行proxy的速度
![](https://user-gold-cdn.xitu.io/2019/11/5/16e3af5938767e98?w=266&h=221&f=jpeg&s=25211)

* 运行defineProperty的速度

![](https://user-gold-cdn.xitu.io/2019/11/5/16e3af7c9f6dda36?w=408&h=194&f=jpeg&s=25797)


4. 不仅是运行速度的快了，`proxy`比`defineProperty`占用的内存更少，我们用上面的例子改造测试一下两者的内存占用
``` javascript
    /**
     *  proxy 内存占用测试
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
    console.log('start');
    var timer = null;
    timer = setInterval(function(){
        if (i > 10) {
            console.log('finish');
            return clearTimeout(timer);
        }
        i++;
        for (var x = 0; x < 10000; x++) {
            proxy['test_' + i + '_' + x] = 1;
        }
    }, 1000)
    
    
    /**
     * defineProperty 内存占用测试
     */
    var i = 0;
    var defineObj = {};
    console.log('start');
    timer = setInterval(function(){
        if (i > 10) {
            console.log('finish');
            return clearTimeout(timer);
        }
        for (var x = 0; x < 10000; x++) {
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
```

* chrome 运行`defineProperty`的测试用例
![](https://user-gold-cdn.xitu.io/2019/11/5/16e3b12fa32cdcfe?w=1192&h=274&f=jpeg&s=47074)

* 运行`proxy`的测试用例

![](https://user-gold-cdn.xitu.io/2019/11/5/16e3b14abf5205fc?w=1184&h=229&f=jpeg&s=33915)

