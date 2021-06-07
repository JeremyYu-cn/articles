
## 发布-订阅模式的定义

发布订阅模式不管是在程序还是现实生活中都非常地常见，例如，过年或者节假日火车票买不到票时，购票软件会有一个候补下单的功能，用户可以向购票软件后台发出一个订阅请求：如果有人退票或某些原因增加座位后，软件后台会帮助用户下单并及时通知用户成功购买该车次车票。   
这就是一个发布-订阅的例子，购票软件是一个发布消息的`发布者`，而用户则是订阅消息的`订阅者`。可以看到，这是一个`一对多`的依赖关系，**当发布的对象状态发生改变时，所有依赖他的对象都将得到通知。<sup>[1]</sup>**   
这就是发布-订阅模式的定义。

## Vue中的双向绑定

了解了发布订阅模式的定义，再来看一下vue双向绑定的原理。   
下面是vue官网双向绑定原理的图，他是通过`Object.defineProperty`或者`new Proxy`去监听对象数据变化，对象相当于一个**发布者(publisher)**，当监听到对象改变后对象的`setter`就会发送消息通知**订阅者(watcher)**，订阅者收到消息后通知对DOM文本进行`update`操作。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/29a79ebc9e594c8e812b6a7e854c01fd~tplv-k3u1fbpfcp-watermark.image)


![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1711a01d2d24433cb60ab09df23e3754~tplv-k3u1fbpfcp-watermark.image)


![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d8c295badaaf46198df5e3d64d576676~tplv-k3u1fbpfcp-watermark.image)

上面图是[用Proxy实现一个双向绑定](https://juejin.cn/post/6844903990170222600)的部分代码，从代码片段中可以看到`observer`作为一个发布者，它可以同时被多个变量订阅，当监听到数据发生改变时，调用`set`方法通知`watcher(订阅者)`去改变node节点和值。   


![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c4e2954b793b4f0fae0b7a7a9cc29877~tplv-k3u1fbpfcp-watermark.image)   

同理，上图代码描述的是，当我们给`input`输入框作为一个发布者，`watcher`作为订阅者。当用户输入数据时，**发布者(input)** 向**订阅者(watcher)** 发送改变信息的通知，`watcher`收到通知后进行值得修改和node节点数据更改，这就是vue通过发布订阅模式实现的数据双向绑定。

## JavaScript中的发布订阅模式

除了vue中数据双向绑定使用的是发布订阅模式，相信我们在JavaScript也会经常使用到的`事件`也是一个发布订阅模式。例如`addEventListener`：
```javascript
document.body.addEventListener('click', () => {
    console.log('click 111');
})

document.body.addEventListener('click', () => {
    console.log('click 222');
})

document.body.addEventListener('click', () => {
    console.log('click 333');
})
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0b80b41a2b6b42e5bddc0e5f762bbfb7~tplv-k3u1fbpfcp-watermark.image)
在给body订阅了点击事件后，点击body都会`依次`触发上面的三个函数。

又例如，在node中的`EventEmitter`类
```javascript
const event = require('events').EventEmitter;

event.on('data', () => {
    console.log('111');
})
event.on('data', () => {
    console.log('222');
})
event.on('data', () => {
    console.log('333');
})

setTimeout(() => {
    event.emit('data');
},1000)
```

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4b0a8d1693e6463b99b58910c74484cb~tplv-k3u1fbpfcp-watermark.image)

可见，发布-订阅模式在JavaScript中非常有用而且使用广泛。

## 实现一个简单的发布-订阅模式通用函数

了解了发布订阅的模式后，最后我们来实现一个通用的发布订阅模式函数吧~
```javascript
    class CommonEvent {
        constructor() {
            this.events = {}
        }
        
        // 订阅函数
        listen(name, eventFun) {
            if (!this.events[ name ]) this.events[ name ] = [];
            if (typeof eventFun !== 'function') throw 'eventFun must be a function!';
            this.events[ name ].push(eventFun);
        }
        
        // 触发事件函数
        emit(name, ...params) {
            if (!this.events[ name ]) return;
            this.events[ name ].forEach(val => {
                val(...params);
            })
        }
        
        // 清除订阅事件
        remove(name, eventFun) {
            if (!this.events[ name ]) return;
            this.events[ name ] = this.events[ name ].filter(val => val !== eventFun);
            console.log(this.events[ name ])
        }
    }
    
    const event = new CommonEvent();
    function handleFun(msg) {
        console.log(msg)
    }
    event.listen('data', handleFun);
    event.listen('data', handleFun);
    event.listen('data', handleFun);
    
    event.emit('data', '111'); // 111 111 111
    
    event.remove('data', handleFun); // []
```

## 发布-订阅模式的优缺点 **<sup>[1]</sup>**

使用发布订阅模式编写程序，他的优点有：   

    1. 实现时间上的解耦(组件，模块之间的异步通讯)
    2. 对象之间的解耦，交由发布订阅的对象管理对象之间的耦合关系
    
当然发布订阅模式也存在缺点：   

    1. 创建的订阅者本身要消耗一定的时间和内存，当我们订阅一个消息后，如果不去销毁，这个订阅这会一直存在于内存之中。
    2. 对象之间解耦的同时，他们的关系也会被深埋在代码背后，这会造成一定的维护成本


## 小结

本文主要介绍了设计模式中的**发布订阅模式**   
阅读文本可以了解到：   
1. 发布订阅模式的定义
2. vue是如何使用发布订阅模式实现数据双向绑定的
3. JavaScript中有哪些实现是通过发布订阅模式编写的
4. 实现一个简单的通用发布订阅函数
5. 了解了发布订阅模式的优缺点

## 参考

1. JavaScript设计模式与开发实践
2. [从发布-订阅模式到Vue响应系统](https://segmentfault.com/a/1190000013338801)
