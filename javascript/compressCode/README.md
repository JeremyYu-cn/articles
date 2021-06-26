## 前言

前几天在写一个小工具的时候，需要用到代码压缩工具`uglify-js`，突然就在想：这种代码压缩工具是怎么样去实现的呢？于是去了解了一下它的原理~   


## 抽象语法树(AST)

要了解代码压缩原理，就必须要先了解AST树，它是进行JS代码压缩的基础。

### 抽象语法树概念
AST: Abstract Syntax Tree，译为抽象语法树，它的作用是将源码的`语法结构`变为抽象表示，并且以`树`的形式表示，树的每个节点对应源码中的语法<sup>[\[1\]](https://en.wikipedia.org/wiki/Abstract_syntax_tree)</sup>。它是这样实现的：**将源代码以字符串的形式读取，按照编程语言的语法将其解析为语法树**，比如有这样一句代码
```javascript
    var workTime = 996;
```
这里声明了一个变量`workTime`,并且给他赋值`996`。那么在AST抽象语法树中可以这样表示

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9aa7263009bc4c659f6633e1e162d01f~tplv-k3u1fbpfcp-watermark.image)   

上面图中将`变量名`,`赋值运算符`和`值`分成三部分表示，简单地表达了源码抽象成树来表达。我们继续在深入解析一下这个抽象树在JS中是如何描述的。

```javascript
// var workTime = 996;
{
  "type": "VariableDeclaration", // 声明类型
  "declarations": [
    {
      "type": "VariableDeclarator",
      "id": {
        "type": "Identifier", // 类型是 标识符
        "name": "workTime" // 标识符名
      },
      "init": {
        "type": "Literal", // 类型是 值
        "value": 996, // 具体值
        "raw": "996"
      }
    }
  ],
  "kind": "var", // 声明语法
}
```

源码的语法就被表示成一个`JSON`对象，同理，按照一定规则也可以将语法树还原为源码。

### AST树的用处

那么，将源代码变为AST抽象语法树有什么用处呢？   
它的用处首先就如我们的主题一样，它可以进行`代码压缩`,除此之外，它还可以用作编译器，程序分析等等。

## 代码压缩

### 压缩过程

上面我们已经把程序源码转换成AST树了，那为什么转换成AST树就可以进行代码压缩呢？引用一张babel的转化的流程图

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/52cecaf3b0564c4ea6e9ff2b3146d958~tplv-k3u1fbpfcp-watermark.image)

图中可以看到代码压缩的步骤大概有三步：   
1. 将源代码转换为AST
2. 将AST通过`一定的规则`进行优化，转换成更简洁的AST
3. 通过生成器将优化后的AST转换为代码

了解了压缩代码的基本原理后，接下来就用`uglify-js`尝试一下代码压缩

```javascript
const uglify = require('uglify-js');
const sourceCode = `
    function testFun() {
        var a = 1;
        var b = 2;
        return a + b;
    }
`;
const resultCode = uglify.minify(sourceCode);
console.log(resultCode.code);  // function testFun(){return 3}
```

可以看到，源代码中声明了两个变量并赋值，函数的作用是将这两个函数相加后返回。   
而压缩后的代码，因为变量已经有了明确的值，直接将两个变量声明的代码去掉了，函数直接返回了两个明确的值相加的结果。

### 压缩规则

了解了代码压缩原理后，可以看到压缩过程的第二步：`将AST通过一定的规则进行优化，转换成更简洁的AST`。   
代码压缩是通过AST树优化进行的，而AST优化是按`一定规则`，也就是说，压缩规则是一个影响压缩质量的主要因素。例如uglify-js`的部分压缩选项如下，：
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f6620d7f1ec24fa0b122949834b16524~tplv-k3u1fbpfcp-watermark.image)
要了解更多压缩规则，请点击[这里](https://github.com/mishoo/UglifyJS#readme)

## 小结

本文主要讲的是了JavaScript代码压缩是如何进行的   
介绍了AST树的概念和它是如何抽象的   
介绍了JavaScript代码压缩的原理和UglifyJs的压缩规则。   
希望对大家有所帮助

## 参考

1. [Abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
2. [手把手带你入门 AST 抽象语法树](https://juejin.cn/post/6844904035271573511)
3. [抽象语法树在 JavaScript 中的应用](https://tech.meituan.com/2014/10/08/the-practice-of-abstract-syntax-trees-in-javascript.html)
