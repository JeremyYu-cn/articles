---
title: 万字长文，带你了解Javascript设计模式（持续更新）。
date: 2021-05-15 20:00:00
updated: 2021-05-17 20:00:00
photos: 
  - https://img.yzmblog.top/blog/communication.jpg
tags:
  - 前端
  - Javascript
  - 设计模式
categories:
  - Javascript
excerpt: 原型模式是一种设计模式，也是一种编程泛型，它构成了JavaScript这门语言的根本。
原型模式是用于创建对象的一种模式，他是通过克隆对象来创建对象的，而克隆的作用就是**提供一种手段去创建某个类型的对象** 
---

# 什么是设计模式


# 设计模式能干嘛


# 原型模式

原型模式是一种设计模式，也是一种编程泛型，它构成了JavaScript这门语言的根本。
原型模式是用于创建对象的一种模式，他是通过克隆对象来创建对象的，而克隆的作用就是**提供一种手段去创建某个类型的对象**，看下面代码：
```javascript
  const Tank = function() {
    this.blood = 100;
    this.level = 1;

    this.levelUp = function() {
      this.level++;
      this.blood += 100;
    }
  }

  const tank = new Tank();
  tank.levelUp();

  const cloneTank = Object.create(tank);
  console.log(cloneTank.blood); // 200;
  console.log(cloneTank.level); // 2;
```
很简单的一个创建对象代码，作用如下：
1. 创建了一个Tank的方法
2. 声明一个Tank的实例化对象`tank`
3. 调用Object.create去复制这个实例化对象`tank`

其中`Object.create`作用就是创建一个新对象，其相当于下面代码：
```javascript
  function creteObj(obj) {
    var Fun = function() {};
    Fun.prototype = obj;
    return new Fun();
  }
```
这其实就是JavaScript的原型模式，就如上文所说，它是**用于创建对象的一种模式**。它有一个重要特性，就是**当对象无法响应某个请求时，他会把该请求委托给它自己的原型**。

# 参考文献

1. [javascript设计模式与开发实践，中国工信出版社，曾探](https://item.jd.com/11686375.html)

