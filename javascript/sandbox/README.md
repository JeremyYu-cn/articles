

## 1.什么是沙箱

沙箱，即sandbox，顾名思义，就是让你的程序跑在一个隔离的环境下，不对外界的其他程序造成影响，通过创建类似沙盒的独立作业环境，在其内部运行的程序并不能对硬盘产生永久性的影响。<sup>[\[1\]](https://juejin.cn/post/6844903954074058760)</sup>   
例如，我们在leetcode提交算法题代码时，会用到沙箱创建一个独立的运行环境运行这段代码，保证机器的安全性；在服务区中使用docker创建一个独立的应用容器；与我们最相近的就是我们的浏览器窗口，每个浏览器窗口其实也是一个沙箱。

## 2.JS沙箱能做什么

前面我们了解到，沙箱时让程序跑在一个隔离的环境下，不对外界造成影响的一个环境。因此，沙箱可以作为一个相对安全的环境去运行某一些程序或代码。例如:    
1. **`实现JS在线编辑器`**：可以把用户输入的代码放到沙箱中运行，以免用户输入的信息影响页面的运行。   

2. **`服务端渲染`**：例如在vue服务端渲染时，服务端会利用node中的`vm`创建一个沙箱，将前端的bundle代码放入沙箱中运行，以免影响node服务的正常运行。   

3. **`vue模板中表达式计算`**：vue模板中表达式的计算被放在沙盒中，只能访问全局变量的一个白名单，如 Math 和 Date 。你不能够在模板表达式中试图访问用户定义的全局变量。

沙箱的应用还有很多，这里也不一一列举了，总之，沙箱的作用就是**创建一个相对独立的环境用来运行不可信的代码或程序**

## 3.如何实现沙箱
以前我在看jquery源码时会看到作者创建了一个`立即执行函数`以防内部的变量污染全局并对外暴露`$`，这其实就是一个简易的沙箱，但它不安全，仅仅只是一个作用域沙箱，并不是一个**独立的运行环境**，他依然能够访问外部的全局变量。

```javascript
    (function(window) {
        window.$ = ....
    })(window)
```
下面介绍两种可以沙箱的实现方法

### 3.1利用iframe实现沙箱

[iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)实际上就是一个封闭的沙箱环境，用户可以在页面中使用iframe内嵌页面
    ```html
        <iframe src="..."  />
    ```
    下图是iframe中的一些权限控制
    ![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/eb883815180047bba8ecfc2c79946af8~tplv-k3u1fbpfcp-watermark.image)
    虽然iframe使用方便，功能强大，但是也存在一些缺点:   
        1. url 不同步。浏览器刷新 iframe url 状态丢失、后退前进按钮无法使用。   
        2. UI 不同步，DOM 结构不共享。想象一下屏幕右下角 1/4 的 iframe 里来一个带遮罩层的弹框，同时我们要求这个弹框要浏览器居中显示，还要浏览器 resize 时自动居中..   
        3. 全局上下文完全隔离，内存变量不共享。iframe 内外系统的通信、数据同步等需求，主应用的 cookie 要透传到根域名都不同的子应用中实现免登效果。   
        4. 慢。每次子应用进入都是一次浏览器上下文重建、资源重新加载的过程。<sup>[\[2\]](https://juejin.cn/post/6844903954074058760)</sup>


### **3.2利用with + new Function + proxy 实现JS沙箱**  
首先了解一下 with 的用法`（不推荐单独使用）`
```javascript
    var a = {
        b: 1
    }
    with(a) {
        console.log(b); // 返回1 相当于 a.b
    }
```   
new Function使用方法
``` 
    const fun = new Function('a', 'console.log(a)'); // 返回一个函数
    fun('hello'); // hello
```
简单了解`with`和`new Function`用法后，将两者结合一下
```javascript
    function sandBox(code) {
        const withStr = `with(obj) { ${ code } }`;
        return new Function('obj', withStr);
    }
    const tmpObj = { a: 'hello' }
    sandBox('console.log(a)')(tmpObj); // hello;
```
虽然上面是实现了查找obj.a的方法，但是由于with的特性：**在obj中搜索不到时，会向上以及原型查找，直到原型链为空**。所以如果在全局声明一个a变量，obj中不声明变量，`console.log(a)`会向上查找a变量，这不满足沙箱的封闭条件。
```javascript
    // 在外部声明a变量，且传入的对象没有队友的key时，会向上查找a变量
    function sandBox(code) {
        const withStr = `with(obj) { ${ code } }`;
        return new Function('obj', withStr);
    }
    var tmpObj = { };
    var a = 'world';
    sandBox('console.log(a)')(tmpObj); // world;
```

解决这个问题的办法就是使用[proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
```javascript
    function sandBox(code) {
        const withStr = `with(obj) { ${ code } }`;
        const fun = new Function('obj', withStr);
        return function(obj) {
            const proxy = new Proxy(obj, { has: handle });
            return fun(proxy);
        }
    }
    
    function handle(target, key) {
        if (['console'].indexOf(key) >= 0) {
            return target[key];
        } 
        if (target.hasOwnProperty(key)) {
            return target[key];
        }
        else {
            throw `${ key } is not defined`
        }
    }
    
    var obj = { a: 'hello world' };
    var b = 'test';
    sandBox(`console.log(a)`)(obj); // hello world;
    sandBox(`console.log(b)`)(obj); // error
```
## node中的沙箱环境

node中原生实现了一个[vm模块](https://nodejs.org/dist/latest-v14.x/docs/api/vm.html)，利用他`vm`中的`createContext`和`runInContext`可以创建一个执行的上下文:
```javascript
    const vm = require('vm');
    const code = `var c = a + ' ' + b;`;
    const context = { a: 'hello', b: 'world', }
    vm.createContext(context);
    vm.runInContext(code, context);
    console.log(context.c); // hello world
```

## 总结

总的来说，沙箱的作用就是创建一个**独立的运行环境，用于运行一些不稳定或不可信的程序或代码，以防这些程序污染到全局**。


## 后记

前两天看了一下蚂蚁金服的微前端框架[qiankun](https://qiankun.umijs.org/)的源码，发现其中原生实现了一个sandbox，于是了解了一下沙箱~   

* 文中如有错误，欢迎在评论区指正。

### 参考文章

[1.说说JS中的沙箱](https://juejin.cn/post/6844903954074058760)   
[2.why not iframe](https://www.yuque.com/kuitos/gky7yw/gesexv)