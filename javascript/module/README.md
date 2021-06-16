## 前言

我们都知道代码模块化带来的好处有很多很多，但是在ES6以前的JavaScript中时没有代码`import`的概念的，那么他们又是怎么组合起来的呢？

## 立即执行函数

看过`JQuery`源码的小伙伴都知道，`JQuery`是用一个**立即执行函数**包裹住代码，对外暴露部分变量供其他模块调用的，举个例子:
```javascript
    (function(window) {
        const Jq = function (target) {
            this.element = document.querySelector(target);
        }
        
        Jq.prototype.setBackground = function(color) {
            this.element.style.background = color;
            return this;
        }
        
        // 对外抛出 $ 方法
        window.$ = (target) => new Jq(target)
        
    })(window)
    
    $('body').setBackground('red');
```
上面代码的意思是声明了一个函数并**立即调用**，通过传入的`window`对象向外部暴露我们想要暴露的变量或方法。这就是一个简单的模块化的体现。   
这样的好处就是可以将一些变量和方法私有化。但它的坏处也很明显：不提供依**赖管理机制**；对外暴露方法只能通过全局对象实现。   
这样的简单模块化工具显然不能满足我们复杂的系统设计的需求。

## 显式模块声明

从上面立即执行函数对外暴露的方法可以看出，对外暴露方法只能通过传入的全局对象才能向外部暴露方法或变量。如果我们可以将想要暴露的数据**集合起来统一返回**，那就最好了。而且这样的实现貌似也不难，继续来写一个简单的方法：
```javascript
    const module = function() {
        function sum(a, b) { return a + b };
        function multiply(a, b) { return a * b };
        
        return {
            sum,
            multiply,
        }
    }()
    
    module.sum(1, 2); // 3
    module.sum(2, 3); // 6
```
我们用一个变量来装函数的返回值。这样我们就可以访问这个声明的变量去调用返回的方法。达到**代码复用**和**代码封装**的功能。   
但是与立即执行函数一样，它也不提供**模块管理机制**。

## 什么是模块管理机制

上面有两次都提到了**模块管理机制**，现在来简单了解一下。   
在以前写JavaScript的时候，如果需要引用其他JS文件，是需要在HTML文件中添加`<script src="..."></script>`标签引入的，在JS文件没有找到很好的办法去引入。当我们需要用到很多的模块文件时，那么管理模块时也必然会乱。   
所以需要引入一种**约定**，在JS文件中也能实现**模块的引用**，就比如说`import`和`export`提供引入和输出，`require`和`module.export`也是一样，这就是`模块管理机制`。   

## 异步模块定义(AMD)

了解完模块管理机制的概念，下面来看一种引入了模块管理机制的模块化方案。   
`异步模块定义(Asynchronous Module Definition)`，从名字可以看到，它是用异步去加载模块的。而且他是基于[RequireJS](https://requirejs.org/)的，来看下面的代码：

```javascript
    // moduleA.js
    define(function() {
        return {
            TEST: 'test moduleA'
        }
    })
    
    // main.js
    require.config({
      baseUrl: 'js',
      paths: {
        "testModule": "./moduleA",
      }
    })
    require(['testModule'], function(moduleA) {
        const test = moduleA();
        console.log(test.TEST); // test moduleA
    })
```
上面代码声明了两个js文件，`moduleA.js`是定义的模块文件，使用`define`方法定义模块。   
**main.js**中使用`require`方法引入定义的模块。`require.config`定义引入的配置。   
`require`方法接收两个参数：`模块数组`和`引入成功后的回调函数`，当定义的模块加载完成后，调用回调函数。   
从上面例子可以看到，它提供一种`模块管理机制`，允许我们在js文件中**引入其他的js文件**，而不再是从HTML的`<script>`标签引入。除此之外，AMD还有如下优点：

* 采用异步方式加载模块，模块的加载不影响它后面语句的运行。
* 所有依赖这个模块的语句，都定义在一个回调函数中，等到加载完成之后，这个回调函数才会运行。

AMD虽然可以做到异步加载，但是它也是会有缺点的：   
* 它**不能做到按需加载**，而是必须提前加载所有的依赖。

## 共同模块定义(CMD)

`共同模块定义(Common Module Definition)`也是一种异步模块定义规范。   
CMD定义模块的方法是`define(factory)`，如果 factory 是一个函数，回调函数中会指定三个参数 **require**，**exports**，**module**   
`require`是一个函数，这个函数接收一个模块标识符（模块 id），返回的是导出模块的API。
`exports`提供在模块执行时添加模块 API 的对象。
`module`是一个对象，提供`exports`，`dependencies`，`uri`方法，具体了解可以点击[这里](https://www.cnblogs.com/mybilibili/p/10411159.html#31-%E6%A8%A1%E5%9D%97%E5%AE%9A%E4%B9%89)。   
下面是使用cmd定义模块的伪代码：
```javascript
    define(function(require, export, module) {
        const md = require('modulePath');
        const result = md[ moduleFunction ].get();
        module.exports = {
            result
        }
    })
```

CMD是[SeaJS](https://seajs.github.io/seajs/docs/)在推广过程中对模块定义的规范化产出，具体例子可以看到SeaJs的[使用文档](https://seajs.github.io/seajs/docs/#quick-start)。

### 与AMD的区别

AMD与CMD都是异步模块定义规范，但是他们也会存在一些区别：
* 对于模块的依赖，AMD是提前执行，CMD是延时执行。
* AMD推崇**依赖前置**，CMD推崇**就近依赖**。
**依赖前置**：在定义模块的时候要先声明其依赖的模块，就像这样：
```javascript
    require(['module'], () => {...})
```
**就近依赖**：可以在在使用时引入依赖的模块
```javascript
    define(function(require, export, module) {
        ...
        const md = require('modulePath');
        ...
    })
```

## CommonJs

[CommonJs](http://wiki.commonjs.org/wiki/Modules/1.1)也是一种模块定义规范，node的模块系统就是基于`CommonJs`的。   
* 在`CommonJs`中每一个文件就是一个模块，拥**有自己独立的作用域，变量，以及方法**等，对其他的模块都不可见。   
* `CommonJS`规范规定，每个模块内部，`module`变量代表当前模块。这个变量是一个对象，它的`module.exports`属性是对外的接口。   
```javascript
    // module.js
    module.exports = {
        ...
        ...
    }
    
    // main.js
    const md = require('./module.js');
    ...
```
* 加载某个模块，其实是加载该模块的`module.exports`属性。`require`方法用于加载模块。
需要注意的是，CommonJs是**同步加载**，而上面提到的`AMD`,`UMD`是异步加载。

## 通用模块定义(UMD)

`通用模块定义(Universal Module Definition)`把前端和后端的模块加载融合在一起了，他提供了一个前后端统一的解决方案。支持**AMD**和**CommonJS**模式。UMD的实现其实很简单，前面我们已经了解了`AMD`还是`CommonJs`，那么UMD就是提供了一个方法判断是前端加载还是后端加载，主要的判断步骤是:   
* 先判断是否支持Node.js模块格式（exports是否存在），存在则使用Node.js模块格式。
* 再判断是否支持AMD（define是否存在），存在则使用AMD方式加载模块。
* 前两个都不存在，则将模块公开到全局（window或global）。

## ES6中的模块

ES6中使用了`import`，`export`来实现模块的引入和导出代码，模块加载分为**静态加载**和**动态加载**。   
静态加载时，ES6规定`import`**必须放在代码顶层**，因为import命令会被 JavaScript 引擎静态分析，先于模块内的其他模块执行。
```javascript
    import {} from 'modulePath';
    ...
```

上面的import语法显然是不能实现动态加载的动态加载，如果在某一些场景需要用到动态加载(例如动态路由)，那么应该怎么做呢？   
ES6提供一个`import()`函数，它可以在代码**运行时动态引入模块**，加载完成后会返回一个`Promise`。   
```javascript
    import('modulePath').then(module => {
        ...
    })
```

## 小结

本文主要介绍了JavaScript是如何实现模块化的。   
前端使用模块化的定义有：`立即执行函数`，`显式模块声明`，`AMD`，`CMD`，`UMD`   
node使用**CommonJs**进行模块化   


## 参考

1. 了不起的JavaScript工程师
2. JavaScript高级程序设计
3. [RequireJS](https://requirejs.org/)
4. [SeaJS](https://seajs.github.io/seajs/docs/#quick-start)
