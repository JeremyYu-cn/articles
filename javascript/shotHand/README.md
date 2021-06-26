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
// 弊端，父类实例化不能传参数，父类如果有引用类型时，所有子类的实例化对象都会共享该变量
function Parent() {
  this.parentA = 1;
}

function Child() {}
Child.prototype = new Parent();
Child.prototype.getParentA = function () {
  return this.parentA;
};

var extendChild = new Child();
console.log(extendChild.getParentA()); // 1
```

### 2.构造函数继承
