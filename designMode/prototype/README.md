# JS设计模式之原型模式

## 什么是设计模式

在了解原型模式之前，首先来了解一下什么是设计模式   
设计模式其实可以理解为：   
1. 从**面向对象**的角度出发，通过对`封装`，`继承`，`多态`，`组合`等技术的反复使用，提炼出一些**可重用**的面向对象设计技巧。<sup>[1]</sup>    
2. 设计模式某种程度上是用来弥补面向对象编程的缺陷的。<sup>[1]</sup>   
但是JavaScript中没有传统的面向对象语言的继承，也没有抽象类和接口支持，以这篇文章作为JavsScript设计模式的开头，聊聊JavaScript中的设计模式。

## 什么是原型模式
  相信大家都了解过，JavaScript是一门**基于原型**的面向对象语言，它的**对象系统**是使用**原型模式**来搭建的。那么什么是原型模式呢？  
  原型模式是用于**创建对象**的一种模式，我们不需要知道这个对象的具体类型，而是直接找到一个对象，通过**克隆**来创建一个一模一样的对象<sup>[1]</sup>。在Javascript中，可以使用```Object.create```方法来实现克隆。  
  
  举个例子，假如我们在一个游戏的兵工厂里面批量生产战争机器人🤖，每个机器人都有默认的血量100和等级1。  
  现在我们的间谍在敌方工厂中窃取到一些核心技术并且运用到我方机器人中，每个默认的参数变为血量200和等级2。
  
  那么在js中可以这样写
```javascript
    var Machine = function(){
        this.blood = 100;
        this.level = 1;
    }
    
    var machine = new Machine();
    machine.blood = 200;
    machine.level = 2;
    
    var cloneMachine = Object.create(machine);
    
    console.log(cloneMachine);
```

  输出
 
![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3b690679fa514e43aac080fdb9479ba1~tplv-k3u1fbpfcp-zoom-1.image)   
  这样，我们每次调用 ``` Object.create(machine) ``` 就相当于生产出一个战争机器人，并且生产出来的机器人都是升级后的机器人🤖️  
  我们也可以看到，通过调用```Object.create```方法，就可以快捷地创建一个新的对象，**他是通过克隆的方式创建对象的**。

### 原型编程范型 
  当然JavaScript是一种弱类型的语言，它创建对象非常容易，也不存在类型耦合的问题，而且它的对象系统就是基于原型模式来搭建的。   
  前面提到：**设计模式某种程度上是用来弥补面向对象编程的缺陷的**，所以在JavaScript中原型模式似乎意义不大，因为它的对象系统就是基于原型模式搭建的。原型模式在JavaScript中称为[原型编程范型](https://blog.csdn.net/weixin_44547635/article/details/89218168)应该更为合适。
  
## 原型编程范型的基本规则

> 1. 所有数据都是对象  
> 2. 要得到一个对象，不是通过实例化类，而是找到一个对象作为原型并克隆它。  
> 3. 对象会记住它的原型。  
> 4. 如果对象无法响应某个请求，它会把这个请求委托给它自己的原型。  

JavaScript是基于原型编程的，所以它遵守这些基本规则。下面来解读一下JavaScript是如何遵照这种几本规则的  

* **所有数据都是对象**  
    JavaScript引入了两套机制：基本类型和对象类型，因为基本类型的存在，所以在JS中只是**绝大部分**数据是对象。  
当然有些基本类型也可以转成对象类型，例如：
```javascript 
    new String('test');
    new Number(666);
    new Boolean(true);
```

* **要得到一个对象，不是通过实例化类，而是找到一个对象作为原型并克隆它**    

    来看一段代码
```javascript
    function CreateObject(){
        var obj = new Object(),                     //从Object.prototype克隆一个新对象
            Constructor = [].shift.call(arguments); //取出传入的第一个参数
        obj.__proto__ = Constructor.prototype;      //将新对象原型指向外部传入的构造器原型
        
        var result = Constructor.apply(obj,arguments); //给新对象设置属性
        
        return typeof result === 'object' ? result : obj; //确保返回的是一个对象
    }
    
    function Person(name){
        this.name = name;
    }
    
    Person.prototype.getName = function(){
        return this.name;
    }
    
    var x = CreateObject(Person,'shirley');
    
    console.log(x.name); // shirley
    console.log(x.getName()); // shirley
    console.log(Object.getPrototypeOf(x) === Person.prototype); // true
```
上面代码其实中`var x = CreateObject(Person,'shirley')`与`var x = new Person('shirley')`是一样的。   
Person在这里并**不是一个类**，JavaScript中是没有类的概念的。他是一个`函数构造器`，它既可以作为普通函数调用，也可以作为构造器被调用，当使用`new` 运算符来调用时，此时函数就是一个构造器。      

代码中可以看到`var result = Constructor.apply(obj,arguments)`，这句代码作用为：Person作为对象原型，给新建的obj设置属性，最后返回。从这里可以看出：**要得到一个对象，不是通过实例化类，而是找到一个对象作为原型并克隆它**


* **对象会记住它的原型**  
    从上面代码也可以看到:当我们调用`CreateObject`时，**Person会作为对象作为原型**，并且返回一个新的对象，而新的对象的`__proto__`则指向**构造器的原型**。

* **如果对象无法响应某个请求，它会把这个请求委托给它自己的原型。**  
    从 JavaScript[原型链](https://github.com/mqyqingfeng/Blog/issues/2)中可以知道，实例对象会有一个__proto__方法，这个方法会指向构造器的原型，当需要取实例对象中一个属性时，而且这个实例对象中又没有这个属性，往原型链中查找，直到查找到原型链存在此属性，或者查找到原型链顶端时停止。
    ```javascript
        function Animal () {}
        Animal.prototype.dog = '汪汪';
        Animal.peototype.cat = '喵喵';
        
        var a = new Animal();
        console.log(a.dog); // 汪汪
        console.log(a.lion); // undefined
    ```
    a实例本来不存在dog这个属性，但是因为第三点`对象会记住它的原型`，a实例中`__proto__`记住了它的构造器`Animal`的原型，所以当dog属性在a实例中不存在时，他可以向原型查找，直到原型顶端为止。利用这种方法可以实现JavaScript一种简单的继承：**原型继承**
    ```javascript
        var obj = { name: 'test' };
        
        var ext = function() {};
        ext.prototype = obj;
        
        var a = new ext();
        console.log(a.name); // test
    ```
---------------------

### 写在最后

1. 本文简单介绍了什么是设计模式，他能用来干什么，
2. 介绍了原型模式是什么以及JavaScript中的原型模式（**原型编程范型**）
3. 介绍了原型编程范型的规则   
    * 所有数据都是对象
    * 如果对象无法响应某个请求，它会把这个请求委托给它自己的原型。
    * 对象会记住它的原型
    * 如果对象无法响应某个请求，它会把这个请求委托给它自己的原型。

若您觉得文章对你有帮助，可以点一个赞鼓励一下作者，若想了解更多JavaScript或者node知识可以点击[这里](https://github.com/IchliebedichZhu/articles)。    
若文章中有不严谨或出错的地方请在评论区域指出。


---------------------

### 参考
1. 《JavaScript设计模式与开发实践》   
2. [JavaScript深入之从原型到原型链](https://github.com/mqyqingfeng/Blog/issues/2)
3. [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain) 

