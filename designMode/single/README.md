## 前言

从[上一篇文章](https://github.com/IchliebedichZhu/articles/tree/master/designMode/prototype)了解到，什么是设计模式和JavaScript的面向对象是基于原型的，有兴趣就小伙伴们可以去了解一下。   
本文主要介绍的是设计模式中的单例模式在JavaScript中的实现和应用。

## 什么是单例模式
首先来了解一下单例模式的定义

    单例模式也称为单体模式，规定一个类只有一个实例，并且提供可全局访问点
    
单例模式在浏览器中的应用有很多，比如window对象，全局缓存，vuex等等都是单例模式。本文主要介绍几种单例模式的设计，分别是`简单的单例模式`，`透明的单例模式`，`用代理实现单例模式`，`惰性单例`

    

## 简单的单例模式

实现一个单例很简单，只需要在设计的时候关注`一个类一个实例`和`可以提供全局访问点`就行了。   

```javascript
    const SingleModel = function(name) {
        this.name = name;
    }
    
    SingleModel.prototype.getName = function() {
        return this.name;
    }
    
    SingleModel.getInstance = (function() {
        let instance;
        return function(name) {
            if(!instance) {
                instance = new SingleModel(name);
            }
            return instance;
        }
    })()
    
    const a = SingleModel.getInstance('s1');
    const b = SingleModel.getInstance('s2');
    
    console.log(a === b); // true
```
可以看到，上面代码通过`SingleModel.getInstance`方法来获取实例，而且他们拿到的实例是相同的，这符合单例模式的定义，所以上面代码就是一个基础的单例模式。但有一个缺点，我们通常是通过`new`方法去获取对象实例，这里需要使用暴露出来的`getInstance`方法去获取实例，这给使用者带来了一种不透明性，用户必须知道这是一个单例模式，使用`getInstance`创建实例~

## 透明的单例模式

这里的单例透明性，大概就是指用户在使用`new`操作符创建实例时也能创建出一个唯一的实例，而不需要调用`getInstance`去创建实例。   
知道了上面代码的缺陷所在，接下在继续修改一下上面的代码，让实例创建变得“透明”

```javascript
    const SingleModel = (function() {
        let instance;
        function Init(name) {
            if(!instance) {
                this.name = name;
                instance = this;
            }
            return instance;
        }
        Init.prototype.getName = function() {
            return this.name
        }
        return Init
    })()
    
    const a = new SingleModel('s1');
    const b = new SingleModel('s2');
    
    console.log(a === b); // true
```
到这里，我们已经可以通过`new`操作符创建单例，在代码中可以看到，`SingleModel`是一个立即执行函数返回的一个函数，在实例化的时候我们实际调用的是`Init`。   
虽然我们实现了用`new`操作服创建单例模式，但是在创建过程中使用了匿名函数和闭包，类创建起来有点奇怪。如果我们可以创建一个普通的类去实现单例，那就更好了，继续改造一下代码~

## 代理实现单例模式

要使用普通的类实现单例，直接声明肯定是不行的，我们可以借助**代理**的方式去实现，即实现一个普通的类，通过一个`代理函数`去创建单例。代码如下:
```javascript
    const SingleModel = function(name) {
        this.name = name;
    }
    
    SingleModel.prototype.getName = function() {
        return this.name;
    }
    
    const createModelProxy = (function() {
        let instance;
        return function(name) {
            if (!instance) {
                instance = new SingleModel(name);
            }
            return instance;
        }
    })()
    
    const a = new createModelProxy('s1');
    const b = new createModelProxy('s2');
    
    console.log(a === b); // true
```

实现很简单，就是将创建单例的方法抽离出来，放到一个代理方法中执行。这样，创建单例方法与普通类就独立出来了。

## 惰性单例

惰性单例是指：单例在`需要使用`时才会被创建出来，而普通单例则是在加载时被类以及声明等待被调用。   
在JavaScript中，`惰性单例`这种方法经常需要用到。   
例如在设计登陆会弹出一个窗口输入账号密码，在用户点击登录时弹出这个窗口。如果使用惰性单例，则他只会在点击登录窗口时才会触发事件创建弹出窗口并渲染到页面中。   

## 小结

本文主要介绍了单例模式的概念：`一个类只有一个实例，并且提供可全局访问点`   
介绍了单例模式的几种创建方法，同时介绍了惰性单例和普通的单例。   

## 参考

1. JavaScript设计模式与开发实践