## JS 手写代码题目总结

## 1. 模拟一个`new`操作符

```javascript
// 实现 new 操作符主要步骤
// 1. 创建一个新的对象
// 2. 将传入的第一个参数(需要实例化的函数)取出来
// 3. 将新创建的对象的原型指向构造函数的原型
// 4. 用 apply 方法执行构造函数
// 5. 若执行的结果返回的是一个对象，则return出去，如果不是对象，则返回新创建的对象
function MyNew() {
  let obj = new Object();
  let fun = Array.prototype.shift.call(arguments);
  obj.__proto__ = fun.prototype;
  const result = fun.apply(obj, arguments);
  return typeof result === "object" ? result : obj;
}

function Test(a, b) {
  this.a = a;
  this.b = b;
}

Test.prototype.getA = function () {
  return this.a;
};
Test.prototype.getB = function () {
  return this.b;
};

var test = MyNew(Test, 1, 2);
console.log(test.getA()); // 1
console.log(test.getB()); // 2
```

## 继承

### 1.原型链继承

```javascript
// 子类的原型指向的是实例化的父类
// 弊端，父类实例化不能传参数；父类如果有引用类型时，所有子类的实例化对象都会共享该变量
function Parent() {
  this.parentA = [];
}
Parent.prototype.getParentA = function () {
  return this.parentA;
};
Parent.prototype.setParentA = function (val) {
  this.parentA.push(val);
};

function Child() {}
Child.prototype = new Parent();

var extendChildA = new Child();
var extendChildB = new Child();

extendChildA.setParentA("AA");

console.log(extendChildA.getParentA()); // ['AA']
console.log(extendChildB.getParentA()); // ['AA'] 共享父组件引用类型变量
```

### 2.经典继承

```javascript
// 优：
// 可以在子类向实例化的父类传参
// 每个实例化的子类继承的引用类型都是独立的
// 缺：
// 但是每次实例化子类时，都会调用一遍父类方法
// 不能访问到父类原型上的属性
function Parent() {
  this.parentA = [];
}

function Child() {
  Parent.call(this);
}
Child.prototype.setParentA = function (val) {
  this.parentA.push(val);
};

Child.prototype.getParentA = function () {
  return this.parentA;
};

var childA = new Child();
var childB = new Child();

childA.setParentA("AA");
console.log(childA.getParentA()); // ['AA']
console.log(childB.getParentA()); // []
```

### 3.组合继承

组合继承就是原型链继承和经典继承的`组合`

```javascript
// 结合了原型链继承和经典继承的优点
// 但是仍然不能解决每次实例化的时候都会调用一次父类方法的问题
function Parent() {
  this.arr = [];
}
Parent.prototype.setArr = function (val) {
  this.arr.push(val);
};

Parent.prototype.getArr = function () {
  return this.arr;
};

function Child() {
  Parent.call(this);
}
Child.prototype = new Parent();
Child.prototype.constructor = Child; // 将原型的构造器指会子类

var childA = new Child();
var childB = new Child();

childA.setArr("hello");

console.log(childA.getArr()); // ['hello']
console.log(childB.getArr()); // []
```

### 4.原型式继承

```javascript
// 模拟 Object.create 实现
// 与原型链继承相同，父类引用类型会属性会被共享
function createObj(obj) {
  var Fun = function () {};
  fun.prototype = obj;
  return new Fun();
}
```

### 5.寄生继承

```javascript
// 与经典继承一样，每次调用都会创建一遍对象
function extendObj(obj) {
  var data = Object.create(obj);
  data.getArr = function () {
    return this.Arr;
  };
  return data;
}

var child = new extendObj({ Arr: ["AA"] });
console.log(child.getArr()); // ['AA']
```

### 6.寄生组合继承

```javascript
function tmpObj(obj) {
  var Fun = function () {};
  Fun.prototype = obj;
  return new Fun();
}

function Ext(child, parent) {
  var prototype = tmpObj(parent.prototype);
  prototype.constructor = child;
  child.prototype = prototype;
}

function Parent() {}
Parent.prototype.getData = function () {
  return this.data;
};
function Child() {
  this.data = "AA";
}
Ext(Child, Parent);
var child = new Child();
console.log(child.getData()); // 'AA'
```

## call，bind，apply

### 1.bind

```javscript

```
