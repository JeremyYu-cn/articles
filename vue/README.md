## 前言   

上一篇文章说了[ES6中的Proxy](https://juejin.im/post/5db80feb6fb9a0207b212121)，现在就来利用proxy一步步实现一个模拟vue的双向绑定。

## 目录
* [1.如何实现](#heading-2)
* [2.实现observer](#heading-3)
* [3.实现数据动态更新到前端](#heading-4)
* [4.实现数据双向绑定](#heading-5)

## 如何实现

* 在学习vue的时候，vue是通过劫持数据的变化，监听到数据变化时改变前端视图。   
* 那么要实现双向绑定，必然需要一个监听数据的方法。如文章标题所示，这里使用的`proxy`实现数据的监听。   
* 当监听到数据变化时，需要一个watcher响应并调用更新数据的compile方法去更新前端视图。
* 在vue中`v-model`作为绑定的入口。当我们监听到前端input输入信息并绑定了数据项的时候，需要先告知watcher，由watcher改变监听器的数据。
* 大概的双向绑定的原理为：
![](https://user-gold-cdn.xitu.io/2019/11/8/16e49471edf9917b?w=1102&h=213&f=jpeg&s=37196)

## 1.实现一个observer(数据监听器)

利用`proxy`实现一个数据监听器很简单，因为`proxy`是监听整个对象的变化的，所以可以这样写：

``` javascript
    class VM {
        constructor(options, elementId) {
            this.data = options.data || {}; // 监听的数据对象
            this.el = document.querySelector(elementId);
            this.init(); // 初始化
        }
        
        // 初始化
        init() {
            this.observer();
        }
        
        // 监听数据变化方法
        observer() {
            const handler = {
                get: (target, propkey) => {
                    console.log(`监听到${propkey}被取啦,值为:${target[propkey]}`);
                    return target[propkey];
                },
                set: (target, propkey, value) => {
                    if(target[propkey] !== value){
                        console.log(`监听到${propkey}变化啦,值变为:${value}`);
                    }
                    return true;
                }
            };
            this.data = new Proxy(this.data, handler);
        }
    }
    
    // 测试一下
    const vm = new VM({
        data: {
            name: 'defaultName',
            test: 'defaultTest',
        },
    }, '#app');
    
    vm.data.name = 'changeName'; // 监听到name变化啦,值变为:changeName
    vm.data.test = 'changeTest'; // 监听到test变化啦,值变为:changeTest
    
    vm.data.name; // 监听到name被取啦,值为:changeName 
    vm.data.test; // 监听到test被取啦,值为:changeTest
```
这样，数据监听器已经基本实现了，但是现在这样只能监听到数据的变化，不能改变前端的视图信息。现在需要实现一个更改前端信息的方法，在VM类中添加方法`changeElementData`
``` javascript

    // 改变前端数据
    changeElementData(value) {
        this.el.innerHTML = value;
    }
```
在监听到数据变化时调用`changeElementData`改变前端数据,`handler`的`set`方法中调用方法
```
    set(target, propkey, value) {
        this.changeElementData(value);
        return true;
    }
```
在init中设置一个定时器更改数据
``` javascript
    init() {
        this.observer();
        
        setTimeout(() => {
            console.log('change data !!');
            this.data.name = 'hello world';
        }, 1000)
    }
```

已经可以看到监听到的信息改变到前端了，但是！
![](https://user-gold-cdn.xitu.io/2019/11/7/16e45535d22317d6?w=1165&h=703&f=gif&s=141105)

这样写死的绑定数据显然是没有意义，现在实现的逻辑大概如下面的图
![](https://user-gold-cdn.xitu.io/2019/11/8/16e48a2b0f6a0727?w=859&h=218&f=jpeg&s=22129)

## 2.实现数据动态更新到前端

上面实现了一个简单的数据绑定展示，但是只能绑定一个指定的节点去改变此节点的数据绑定。这样显然是不能满足的，我们知道vue中是以`{{key}}`这样的形式去绑定展示的数据的，而且vue中是监听指定的节点的所有子节点的。因此对象中需要在**VIEW**和**OBSERVER**之间添加一个监听层**WATCHER**。当监听到数据发生变化时，通过**WATCHER**去改变**VIEW**，如图：
![](https://user-gold-cdn.xitu.io/2019/11/8/16e48a862c7ffdc8?w=1123&h=222&f=jpeg&s=29744)
根据这个流程，下一步我们需要做的是：

 1. 监听整个绑定的element的所有节点并匹配所有节点中的所有`{{text}}`模板
 2. 监听到数据变化时，告知watcher需要数据改变了，替换前端模板
    
在VM类的构造器中添加三个参数
``` javascript
    constructor() {
        this.fragment = null; // 文档片段
        this.matchModuleReg = new RegExp('\{\{\s*.*?\s*\}\}', 'gi'); // 匹配所有{{}}模版
        this.nodeArr = []; // 所有带有模板的前端结点
    }
```
新建一个方法遍历`el`中的所有节点，并存放到`fragment`中
``` javascript
    /**
     *  创建一个文档片段
     */
    createDocumentFragment() {
        let fragment = document.createDocumentFragment();
        let child = this.el.firstChild;
        // 循环添加到文档片段中
        while (child) {
            this.fragment.appendChild(child);
            child = this.el.firstChild;
        }
        this.fragment = fragment;
    }
```
匹配`{{}}`的数据并替换模版
``` javscript
    
    /**
     *  匹配模板
     *  @param { string } key 触发更新的key
     *  @param { documentElement } fragment 结点
     */
    matchElementModule(key, fragment) {
        const childNodes = fragment || this.fragment.childNodes;
        [].slice.call(childNodes).forEach((node) => {
            if (node.nodeType === 3 && this.matchModuleReg.test(node.textContent)) {
                node.defaultContent = node.textContent; // 将初始化的前端内容保存到节点的defaultContent中
                this.changeData(node);
                this.nodeArr.push(node); // 保存带有模板的结点
            }

            // 递归遍历子节点
            if(node.childNodes && node.childNodes.length) {
                this.matchElementModule(key, node.childNodes);
            }
        })
    }
    
    /**
     * 改变视图数据
     * @param { documentElement } node
     */
    changeData(node) {
        const matchArr = node.defaultContent.match(this.matchModuleReg); // 获取所有需要匹配的模板
        let tmpStr = node.defaultContent;
        for(const key of matchArr) {
            tmpStr = tmpStr.replace(key, this.data[key.replace(/\{\{|\}\}|\s*/g, '')] || '');
        }
        node.textContent = tmpStr;
    }
```
实现watcher，数据变化是触发此watcher更新前端
``` javascript
    watcher(key) {
        for(const node of this.nodeArr) {
            this.changeData(node);
        }
    }
```
在`init`和`proxy`的`set`方法中执行新增的方法
``` javascript
    init() {
        this.observer();
        this.createDocumentFragment(this.el); // 将绑定的节点都放入文档片段中
        for (const key of Object.keys(this.data)) {
            this.matchElementModule(key);
        }
        this.el.appendChild(this.fragment); // 将初始化的数据输出到前端
    }
    
    set: () => {
        if(target[propkey] !== value) {
            target[propkey] = value;
            this.watcher(propkey);
        }
        return true;
    }
```

测试一下：
![](https://user-gold-cdn.xitu.io/2019/11/8/16e48fd661828192?w=426&h=438&f=jpeg&s=36961)

![](https://user-gold-cdn.xitu.io/2019/11/8/16e490258f723bac?w=1157&h=716&f=gif&s=56518)

## 3.实现数据双向绑定

现在我们的程序已经可以通过改变data动态地改变前端的展示了，接下来需要实现的是一个类似VUE`v-model`绑定input的方法，通过input输入动态地将输入的信息输出到对应的前端模板上。大概的流程图如下：
    
![](https://user-gold-cdn.xitu.io/2019/11/8/16e4911afabdc06a?w=1102&h=213&f=jpeg&s=37196)

一个简单的实现流程大概如下:   
1. 获取所有带有v-model的input结点
2. 监听输入的信息并设置到对应的data中

在constructor中添加
``` javascript
    constructor() {
        this.modelObj = {};
    }
    
```
在VM类中新增方法
``` javascript
    // 绑定 y-model
    bindModelData(key, node) {
        if (this.data[key]) {
            node.addEventListener('input', (e) => {
                this.data[key] = e.target.value;
            }, false);
        }
    }
    
    // 设置 y-model 值
    setModelData(key, node) {
        node.value = this.data[key];
    }

    // 检查y-model属性
    checkAttribute(node) {
        return node.getAttribute('y-model');
    }
```
在`watcher`中执行`setModelData`方法，`matchElementModule`中执行`bindModelData`方法。   
修改后的`matchElementModule`和`watcher`方法如下
``` javascript
    matchElementModule(key, fragment) {
        const childNodes = fragment || this.fragment.childNodes;
        [].slice.call(childNodes).forEach((node) => {

            // 监听所有带有y-model的结点
            if (node.getAttribute && this.checkAttribute(node)) {
                const tmpAttribute = this.checkAttribute(node);
                if(!this.modelObj[tmpAttribute]) {
                    this.modelObj[tmpAttribute] = [];
                };
                this.modelObj[tmpAttribute].push(node);
                this.setModelData(tmpAttribute, node);
                this.bindModelData(tmpAttribute, node);
            }

            // 保存所有带有{{}}模版的结点
            if (node.nodeType === 3 && this.matchModuleReg.test(node.textContent)) {
                node.defaultContent = node.textContent; // 将初始化的前端内容保存到节点的defaultContent中
                this.changeData(node);
                this.nodeArr.push(node); // 保存带有模板的结点
            }

            // 递归遍历子节点
            if(node.childNodes && node.childNodes.length) {
                this.matchElementModule(key, node.childNodes);
            }
        })
    }
    
    watcher(key) {
        if (this.modelObj[key]) {
            this.modelObj[key].forEach(node => {
                this.setModelData(key, node);
            })
        }
        for(const node of this.nodeArr) {
            this.changeData(node);
        }
    }
```

来看一下是否已经成功绑定了,写一下测试代码：

![](https://user-gold-cdn.xitu.io/2019/11/8/16e4933ccc818462?w=480&h=462&f=jpeg&s=44420)


![](https://user-gold-cdn.xitu.io/2019/11/8/16e49351534dcd59?w=909&h=422&f=gif&s=65716)

成功！！

最终的代码如下:
``` javascript
    class VM {
            constructor(options, elementId) {
                this.data = options.data || {}; // 监听的数据对象
                this.el = document.querySelector(elementId);
                this.fragment = null; // 文档片段
                this.matchModuleReg = new RegExp('\{\{\s*.*?\s*\}\}', 'gi'); // 匹配所有{{}}模版
                this.nodeArr = []; // 所有带有模板的前端结点
                this.modelObj = {}; // 绑定y-model的对象
                this.init(); // 初始化
            }

            // 初始化
            init() {
                this.observer();
                this.createDocumentFragment();
                for (const key of Object.keys(this.data)) {
                    this.matchElementModule(key);
                }
                this.el.appendChild(this.fragment);
            }

            // 监听数据变化方法
            observer() {
                const handler = {
                    get: (target, propkey) => {
                        return target[propkey];
                    },
                    set: (target, propkey, value) => {
                        if(target[propkey] !== value) {
                            target[propkey] = value;
                            this.watcher(propkey);
                        }
                        return true;
                    }
                };
                this.data = new Proxy(this.data, handler);
            }

            /**
             *  创建一个文档片段
             */
             createDocumentFragment() {
                let documentFragment = document.createDocumentFragment();
                let child = this.el.firstChild;
                // 循环向文档片段添加节点
                while (child) {
                    documentFragment.appendChild(child);
                    
                    child = this.el.firstChild;
                }
                this.fragment = documentFragment;
            }

            /**
            *  匹配模板
            *  @param { string } key 触发更新的key
            *  @param { documentElement } fragment 结点
            */
            matchElementModule(key, fragment) {
                const childNodes = fragment || this.fragment.childNodes;
                [].slice.call(childNodes).forEach((node) => {

                    // 监听所有带有y-model的结点
                    if (node.getAttribute && this.checkAttribute(node)) {
                        const tmpAttribute = this.checkAttribute(node);
                        if(!this.modelObj[tmpAttribute]) {
                            this.modelObj[tmpAttribute] = [];
                        };
                        this.modelObj[tmpAttribute].push(node);
                        this.setModelData(tmpAttribute, node);
                        this.bindModelData(tmpAttribute, node);
                    }

                    // 保存所有带有{{}}模版的结点
                    if (node.nodeType === 3 && this.matchModuleReg.test(node.textContent)) {
                        node.defaultContent = node.textContent; // 将初始化的前端内容保存到节点的defaultContent中
                        this.changeData(node);
                        this.nodeArr.push(node); // 保存带有模板的结点
                    }

                    // 递归遍历子节点
                    if(node.childNodes && node.childNodes.length) {
                        this.matchElementModule(key, node.childNodes);
                    }
                })
            }
            
            /**
             * 改变视图数据
             * @param { documentElement } node
             */
            changeData(node) {
                const matchArr = node.defaultContent.match(this.matchModuleReg); // 获取所有需要匹配的模板
                let tmpStr = node.defaultContent;
                for(const key of matchArr) {
                    tmpStr = tmpStr.replace(key, this.data[key.replace(/\{\{|\}\}|\s*/g, '')] || '');
                }
                node.textContent = tmpStr;
            }

            watcher(key) {
                if (this.modelObj[key]) {
                    this.modelObj[key].forEach(node => {
                        this.setModelData(key, node);
                    })
                }
                for(const node of this.nodeArr) {
                    this.changeData(node);
                }
            }

            // 绑定 y-model
            bindModelData(key, node) {
                if (this.data[key]) {
                    node.addEventListener('input', (e) => {
                        this.data[key] = e.target.value;
                    }, false);
                }
            }
            
            // 设置 y-model 值
            setModelData(key, node) {
                node.value = this.data[key];
            }

            // 检查y-model属性
            checkAttribute(node) {
                return node.getAttribute('y-model');
            }
        }
```

## 最后

本节我们使用`Proxy`，从监听器开始，到观察者一步步实现了一个模仿VUE的双向绑定，代码中也许会有很多写的不严谨的地方，如发现错误麻烦大佬们指出～～   
