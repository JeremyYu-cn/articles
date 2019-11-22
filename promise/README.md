## 引言
`Promise`出现解决了js中的回调地狱的问题，使代码更简洁，是ES6中的规范和重要特性。它的使用很简单，但你知道它是怎么样实现的吗~~   
现在我们就来看一下Promise究竟是怎么样实现的😄   
* **promise规范**   
Promise规范是Promise函数中需要遵循的规则，
ES6中使用的Promise，它就是遵循[Promise/A+规范](https://promisesaplus.com/)的。   
既然是有规则可循的，那我们根据规则来一步步实现`Promise`。

## 1.创建Promise类
看一下`Promise`是如何使用的
``` javascript
    const promise = new Promise((resolve, reject) => {
        try {
            resolve('123');
        } catch(err) {
            reject('error');
        }
    });
    
    promise
    .then((msg) => {
        console.log(msg)
    })
```
* 首先它是一个**构造方法**，并且接收一个`function`作为参数，   
而这个`function`中有`resolve`和`reject`两个方法。`resolve`代表成功后返回的值，`reject`代表拒绝返回的原因      

根据`Promise`的使用来创建一个叫`MyPromise`的类
``` javascript

    /**
     *  @params {function} callback 需要执行的业务方法
     */
    class MyPromise {
        // 构造方法接收一个function
        constructor(callback) {
            callback(this.resolve, this.reject); // 调用此function
        }
        resolve = (value) => {} // callback中执行的resolve方法
        reject = (reason) => {} // callback中执行的reject方法
    }
    
    // 测试
    var test = new MyPromise((resolve, reject) => {
        console.log('my promise is running!');
    }) // 打印出 my promise is running!
```


## 2.三种状态
现在我们创建的类已经可以执行传入的方法了，但是它传入的`resolve`和`reject`方法是有什么用的呢？   
我们接着看[Promise规范](https://promisesaplus.com/)
![](https://user-gold-cdn.xitu.io/2019/11/21/16e8d3e468224e0d?w=783&h=348&f=png&s=54826)

* 根据规范可知`Promise`有三种状态 `pending`（等待），`fulfilled`（完成），`rejected`（拒绝）。
* 当状态为`pending`时，Promise可以变为`fulfilled`或`rejected`状态
* 当状态为`fulfilled`时，Promise不能改变其状态；必须有值且不能改变
* 当状态为`rejected`时，Promise不能改变其状态；必须有拒绝的原因且不能改变

根据`Promise`规则，接着写刚刚创建的类：
``` javascript 
    const stateArr = ['pending', 'fulfilled', 'rejected']; // 三种状态
    /**
     *  @params {function} callback 需要执行的业务方法
     */
    class MyPromise {
        constructor(callback) {
            this.state = stateArr[0]; // 当前状态
            this.value = null; // 完成时的返回值
            this.reason = null; // 失败原因
            
            callback(this.resolve, this.reject); // 调用此function
        }
        
        // callback中执行的resolve方法
        resolve = (value) => {
            // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[1]; // 更新状态为 fulfilled
               this.value = value; // 写入最终的返回值
            }
        }
        
        // callback中执行的reject方法
        reject = (reason) => {
            // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[2]; // 更新状态为 rejected
               this.reason = reason; // 写入拒绝的原因
            }
        } 
    }
```

测试一下：
![](https://user-gold-cdn.xitu.io/2019/11/22/16e91fef6ecec66e?w=624&h=233&f=png&s=33331)
可以看到，调用`resolve`后，状态变为**fulfilled**，再调用`reject`时，状态和值都不会改变，这样符合Promise规范~~

## 3.then方法
我们的`MyPromise`写到这里，他已经可以实现更新状态和传值了，但是它的值怎么样输出给我们的业务呢？   
由`Promise`的使用可以看到，它是通过`then`方法来输出值的。`then`是是一个必要的方法，看一下`then`的规范：

![](https://user-gold-cdn.xitu.io/2019/11/22/16e920775a740a45?w=896&h=955&f=png&s=221293)
* promise必须提供一个`then`方法去访问他的当前或最终的值或原因
* promise中`then`方法接收两个参数 `onFulilled`和`onRejected`  
    
下面是关于`onFulilled`和`onRejected`的规范（部分）   
* `onFulilled`和`onRejected`两者都是一个可选的参数：   
  * 如果`onFulilled`不是一个函数，它必须被忽视
  * 如果`onRejected`不是一个函数，它必须被忽视
* 如果`onFulilled`是一个函数：
  * 它必须在fulfilled时被调用，promise方法中的`value`作为第一个参数
  * 它必须在fulfilled之前**不**被调用
  * 它不能被多次调用
* 如果`onRejected`是一个函数：
  * 它必须在rejected时被调用，promise方法中的`reason`作为第一个参数
  * 它必须在rejected之前**不**被调用
  * 它不能被多次调用   
* 在执行上下文堆栈仅包含平台代码之前，不能调用`onFulfilled`或`onRejected`
* `onFulfilled`和`onRejected`必须是一个函数
* `then`可以在同一个promise中多次被调用
* `then` 必须返回一个`promise`
   
根据then函数的规则，我们来设计这个then方法

``` javascript
    const stateArr = ['pending', 'fulfilled', 'rejected']; // 三种状态
    class MyPromise {
        constructor(callback) {
            this.state = stateArr[0]; // 当前状态
            this.value = null; // 完成时的返回值
            this.reason = null; // 失败原因
            
            callback(this.resolve, this.reject); // 调用此function
        }
        
        // callback中执行的resolve方法
        resolve = (value) => {
            // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[1]; // 更新状态为 fulfilled
               this.value = value; // 写入最终的返回值
            }
        }
        
        // callback中执行的reject方法
        reject = (reason) => {
            // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[2]; // 更新状态为 rejected
               this.reason = reason; // 写入拒绝的原因
            }
        }
        
        // then方法
        then = (onFulilled, onRejected) => {
            // 判断onFulilled 和 onRejected是否是一个函数，如果不是函数则忽略它
            onFulilled = typeof onFulilled === 'function' ? onFulilled : (value) => value;
            onRejected = typeof onRejected === 'function' ? onRejected : (reason) => reason;
            
            // 如果状态是fulfilled
            if (this.state === stateArr[1]) {
                // then返回的必须是一个promise
                return new MyPromise((resolve, reject) => {
                    try {
                        const result = onFulilled(this.value); // 执行传入的onFulilled方法
                        
                        // 如果onFulilled返回的是一个Promise,则调用then方法
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(err) {
                        reject(err);
                    }
                })
            }
            
            // 如果状态是rejected
            if (this.state === stateArr[2]) {
                // then返回的必须是一个promise
                return new MyPromise((resolve, reject) => {
                    try {
                        const result = onRejected(this.reason); // 执行传入的onRejected方法
                        
                        // 如果onRejected返回的是一个Promise,则调用then方法
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(err) {
                        reject(err);
                    }
                })
            }
        }
    }

```

测试一下：   
   
成功返回：
![](https://user-gold-cdn.xitu.io/2019/11/22/16e927ecf47fee96?w=285&h=105&f=png&s=9550)
   
失败返回：

![](https://user-gold-cdn.xitu.io/2019/11/22/16e928372303774e?w=267&h=105&f=png&s=10048)

## 4.继续完善
至此，我们的`MyPromise`的已经基本可以运行了，但是现在有一个很严重的缺陷，如果遇到异步的请求时候，`resolve`不能按上下文执行，这会导致then方法执行失败例如
``` javascript
    var test = new MyPromise((resolve, reject) => {
        setTimeout(() => {
            resolve(123);
        }, 2000)
    })
    .then(msg => {
        console.log(msg);
        return 456;
    })
```
因为在调用`then`方法的时候，`promise`的状态还没有改变，而我们的`then`方法还没有处理pending状态的逻辑。 这导致执行异步方法的时候，then方法不会返回任何东西   
比如，在上面的例子中，javscript已经把`then`方法执行了，但`setTimeout`中的方法还在`eventloop`中等待执行。
这样需要做的是：   
* 将`then`中的方法保存起来，等待`resolve`或`reject`执行后再调用刚刚保存的`then`中的方法
* 由于在这期间可能会有多个`then`方法会被执行，所以需要用一个数据来保存这些方法   
根据这两点，再来修改一些代码
``` javascript
    // 在constructor中新增两个数组分别用于装then中的resolve和reject方法
    constructor(callback) {
        this.resolveArr = [];
        this.rejectArr = [];
    }
    
    // 修改resolve方法
    resolve = (value) => {
        // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[1]; // 更新状态为 fulfilled
               this.value = value; // 写入最终的返回值
               
               this.resolveArr.forEach(fun => fun(value)) // 循环执行then已插入的resolve方法
            }
    }
    
    // 修改reject方法
    resolve = (reason) => {
        // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[1]; // 更新状态为 fulfilled
               this.reason = reason; // 写入最终的返回值
               
               this.rejectArr.forEach(fun => fun(reason)) // 循环执行then已插入的resolve方法
            }
    }
    
    // then方法中需要添加捕捉pending状态的逻辑
    then = (onFulilled, onRejected) => {
        // 如果状态为pending
        if (this.state === stateArr[0]) {
            // 插入成功时调用的函数
            this.resolveArr.push((value) => {
                try {
                    const result = onFulilled(value);
                    if (result instanceof MyPromise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } catch(err) {
                    reject(err);
                }
            })
            
            // 插入失败时调用的函数
            this.rejectArr.push((value) => {
                try {
                    const result = onRejected(value);
                    if (result instanceof MyPromise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } catch(err) {
                    reject(err)
                }
            })
        }
    }
```

写好了，测试一下~
``` javascript
    new MyPromise((resolve, reject) => {
        setTimeout(() => {
            resolve(123);
        }, 2000)
    })
    .then(msg => {
        console.log(msg);
        return new MyPromise((resolve, reject) => {
			setTimeout(()=> {
				resolve(456)
			}, 2000);
		})
    })
    .then(msg => {
        console.log(msg);
    })
```

![](https://user-gold-cdn.xitu.io/2019/11/22/16e9305dfe1d1c32?w=562&h=282&f=gif&s=2403569)

## 5.Promise的其他方法
根据Promise规范实现的`Promise`大致已经完成啦，最后我们把Promise中实现的方法也补一下

* catch方法
``` javascript
    // 在MyPromise原型中实现
    class MyPromise {
        // 调用then中的reject
        catch = (reject) => {
            this.then(null, reject);
        }
    }
```

* resolve
``` javascript
    MyPromise.resolve = (value) => {
        return new MyPromise((resolve, reject) => { resolve(value) });
    }
```
* reject
``` javascript
    MyPromise.resolve = (reason) => {
        return new MyPromise((resolve, reject) => { reject(reason) });
    }
```

* 还有`all`，`race`，`finally(原型方法)`，其实都是根据**Promise中的原型**方法和**Promise规则**实现的，这里就不一一列举啦。需要了解的小伙伴可以[自行去看](https://github.com/then/promise)


## 小结
这次我们了解了promise是如何实现的：
* 必须是构造函数
* 三种状态（pending，resolve，reject）
* then方法（promise中必须要有的方法）

从构造函数开始，到三种状态的实现，最后实现then方法一步步根据`Promise规则`来实现Promise。了解完以后就可以在面试官面前手写一个Promise啦！😄
