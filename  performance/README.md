---
    本文主要介绍性能优化的一些建议，包括编码，动画性能，页面启动性能优化
 
## 编码

### 避免全局查找
使用全局变量和函数要比局部的开销更大，可以将全局变量保存在局部的变量中，再去调用.   
**将在一个函数中多次调用的全局对象保存到局部变量总是没错的<sup>[1]</sup>**
```javascript
    // 全局查找 document
    function updateElement() {
        var p = document.getElementsByTagName('p');
        var title = document.getElementById('title');
        
        p.forEach(val => {
            val.innerHTML = document.title;
        })
        title.innerHTML = 'world';
    }
    
    // 局部查找
    function updateElement() {
        var doc = document;
        var p = doc.getElementsByTagName('p');
        var title = doc.getElementById('title');
        p.forEach(val => {
            val.innerHTML = doc.title;
        })
        title.innerHTML = 'world';
    } 
```

### 避免with语句

`with`语句相信大家都听说过。它会创建自己的作用域，因此会增加其中执行代码的作用域链长度，造成`with`语句中执行的代码会比外面执行的代码要慢。

### 避免不必要的属性查找

能减少算法的复杂度要尽量减少，尽可能地多使用局部变量**将属性查找替换为值查找**。
```javascript
    // 代码1
    var a = 1;
    var b = 100 + a;
    console.log(b);
    
    // 代码2
    var arr = [1, 100];
    var b = arr[0] + arr[1];
    console.log(c);
```
上面两端代码执行效率是一样的   
代码1它会进行4次常量查找，分别是：a，数字1，数字100，b，时间复杂度为`O(1)`   
代码2的时间复杂度也是`O(1)`    

若是用对象声明变量查找，他会比在数组上访问变量时间更长，比如
```javascript
    var obj = { a: 1, b: 100 };
    var result = obj.b - obj.a;
    console.log(result);
```
上面代码访问变量的时间复杂度为`O(n)`，对象在查找时必须向**原型链**中搜索该属性，所以对象属性越多，查找时间越长。   

### 简化循环终止条件

将循环终止的条件值放到声明变量中，避免属性查找或其他 O(n)的操作
```javascript 
    // before
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    for (let i = 0; i < arr.length; i ++) {
        ...
    }

    // after
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    for (let i = 0, len = arr.length; i < len; i ++) {
        ...
    }
```

### 避免双重解释

```javascript
    // 避免!!!
    const code = `var a = 0; console.log(a)`;
    eval(code);
    var test = new Function(code);
    setTimeout(code, 1000);
```

### 多个变量声明
代码语句数量也是会影响执行的操作的速度，完成**多个操作的单个语句**要比完成**单个操作的多个语句**快
```javascript
    // before
    var a = 1;
    var b = 'a';
    var c = {};
    var d = [];
    
    // after
    var a = 1,
        b = 'a',
        c = {},
        d = [];
```

### 使用数组和对象字面量

从上面可以了解到**单个操作的多个语句**相对而言会比较快，因此在初始化对象或数组是，也可以这样做
```javascript
  // before
  var arr = [];
  arr[0] = 'aaa';
  arr[1] = 'bbb';
  arr[2] = 'ccc';
  
  var obj = {};
  obj.a = 'aaa';
  obj.b = 111;
  obj.c = () => {};
  
  // after
  var arr = ['aaa', 'bbb', 'ccc'];
  var obj = {
      a: 'aaa',
      b: 111,
      c: () => {},
  }
```

## 优化DOM交互

### 最小化现场更新

浏览器中渲染界面是一个非常消耗性能的事情，所以减少频繁地插入DOM节点显得非常有必要。例如：
```javascript
    var list = document.getElementById('list');
    
    for (let x = 0, max = 10, x < max; x++) {
        var li = document.createElement('li');
        li.innerHTML = x;
        list.appendChild(li);
    }
```
上面的代码会向`list`重复插入10个节点，每次插入节点，浏览器都会重新计算一次页面的位置。消耗非常大的性能。解决的办法就是使用`createDocumentFragment`
```javascript
    var list = document.getElementById('list');
    var fragment = document.createDocumentFragment();
    
    for (let x = 0, max = 10, x < max; x++) {
        var li = document.createElement('li');
        li.innerHTML = x;
        fragment.appendChild(li);
    }
    list.appendChild(fragment);
```
使用文档片段改进后，只有一次插入节点的操作，有效减少节点更新造成的性能消耗。   
除此之外，使用`innerHTML`也可以造成差不多的效果，但是字符串拼接会有一定的性能损失。
```javascript
    var list = document.getElementById('list');
    var html = '';
    for (let x = 0, max = 10, x < max; x++) {
        html += `<li>${ x }</li>`;
    }
    list.innerHTML = html;
```

### 使用事件代理
由[发布-订阅模式](https://juejin.cn/post/6971062635013865486)可以知道，随着监听器的增加，内存也会增加，使得页面性能变差。   
在点击列表事件时，可以利用**事件代理**来减少监听器的声明。
```javascript
    /**
     *    <ul id="ul">
     *       <li id="li_1"></li>
     *       ...
     *       <li id="li_n"></li>
     *   </ul>
     */
    // before
    var list = document.getElementsByTagName('li');
    for(let x = 0, len = list.length; x < len; x++) {
        list[x].onclick = () => {
            ...
        }
    }
    
    // after
    var ul = document.getElementById('#ul');
    ul.addEventListener('click', (e) => {
        let target = e.target;
        switch(target.id) {
            case "li_1": .....
            case "li_2": .....
        }
    });
```

## 优化启动性能

* 使用dns预获取文件
* 在需要异步执行的脚本使用 `defer` 或 `async` 属性加载。这可以让HTML解析器更高效地处理文档。
* 使用 [Web workers](https://juejin.cn/post/6971451348227194894) 运行持续时间长的 JavaScript 代码逻辑
* 所有能并行的数据处理都应该并行化。不要一团接一团地处理数据，如果可能的话，同时处理它们
* 在你启动的HTML文件中，不要包含不会在关键路径下出现的脚本或样式表。只在需要时加载他们<sup>[2]</sup>


## 参考

1. JavaScript高级程序设计
2. [web性能](https://developer.mozilla.org/zh-CN/docs/Web/Performance)
