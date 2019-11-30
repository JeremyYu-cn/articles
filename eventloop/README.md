## 前言
[上一篇文章](https://juejin.im/post/5db3e5e8f265da4d4c201c0b)我们说了如何实现一个`Promise`，这次我们就通过一个**JS动画**了解一下什么是**EventLoop**。

## 一个JS动画
* 我们需要实现的动画是一个通过JS向前端页面添加文本和样式的动画。最终的效果如下图：
![](https://user-gold-cdn.xitu.io/2019/11/29/16eb5fe6df7a8ce2?w=1026&h=616&f=gif&s=1741823)

* 调用代码
![](https://user-gold-cdn.xitu.io/2019/11/29/16eb65cce25feee2?w=1013&h=666&f=png&s=196726)

* 根据实现结果和调用代码，可以想到的实现思路是：   
    * 通过**链式调用**将数据的向前端一行一行地输出。
    * 主要通过`text`和`style`两个方法向前端输出
    * 输出的每一行都可以有时间控制
    * 通过`setTimeout`向前端输出文字
   
基本思路已经有了，下面就开始码吧~~

## 1.创建Animate类

* 首先需要创建一个Animate的方法，在调用时**初始化**信息
* 实例化的时候需要传两个参数，`head`的element标签和`body`的element标签
* 初始化信息包括创建三个HTML标签，分别是`输出的信息的box`，`输出style的box`和`更新样式的style标签`

``` javascript
    class Animate {
        constructor(headElement, bodyElement) {
            this.element = {
                headElement,
                bodyElement,
                contentElement: null, // 输出内容的box
                styleElement: null, // 更新样式的style标签
                styleContent: null, // 输出style的box
            }
            
            this.init(); // 实例化时初始化
        }
        
        init = () => {
            const styleElement = createElement('style');
            const contentElement = createElement('div', {class: 'text_content'});
            const styleContent = createElement('div', {class : 'style_content'});
            
            // 向前端插入节点
            this.element.headElement.appendChild(styleElement);
            this.element.bodyElement.appendChild(contentElement);
            this.element.bodyElement.appendChild(styleContent);
    
            this.element.contentElement = contentElement;
            this.element.styleElement = styleElement;
            this.element.styleContent = styleContent;
        }
    }
    
    // 封装创建Element方法
    function createElement(elementName, elementObj = {}, styleObj = {}) {
        const element = document.createElement(elementName);
        
        for (const option of Object.keys(elementObj)) {
            element.setAttribute(option, elementObj[option]);
        }
        
        for (const styleName of Object.keys(styleObj)) {
            element.style[styleName] = styleObj[styleName];
        }
        
        return element;
    }
    
    // 调用
    const head = document.querySelector('head');
    const body = document.querySelector('body');
    const animate = new Animate(head, body);
```

调用后我们需要用来展示和改变样式的节点都已经创建完成了，接下来需要实现往`text_content`中添加信息
![](https://user-gold-cdn.xitu.io/2019/11/29/16eb67aeeba710be?w=396&h=211&f=png&s=25372)

## 2.往text中添加信息
* 上面已经说了，我们需要用`setInterval`往内容盒子中添加信息，并且将**总输出**时间为用户输出的时间，那就需要计算输出每一个字的间隔时间，公式也很简单`输出字体间隔时间 = 输出总时间 / 文字总长度`。

在`Animate`类中添加`text`方法，输出文字的**公共方法**，还有一个**输出字体间隔时间**的方法
``` javascript
    /**
     *  添加text
     *  @param {Element} appendNode 插入文本的节点
     *  @param {string} elName 标签名
     *  @param {Object} elOption 标签设置
     *  @param {Object} styleObj 内联样式
     *  @param {Object} text 输出的文字
     *  @param {number} during 输出文字的总时间
     */
    text = (elName, elOption, styleObj, text, during) => {
        const element = createElement(elName, elOption, styleObj);
        this.element.contentElement.appendChild(element);
        this.printText(element, text, during); // 输出文字
    }
    
    /**
     * 输出文字公共方法
     * @param {Element} element 输出文字的标签
     * @param {string} text 输出的文字
     * @param {number} during 输出文字的总时间
     */
    printText = (element, text, during) => {
        const len = text.length; // 文字总长度
        const time = this.getTextDuring(len, during); // 每个字输出时间
        let index = 0;
        let timer = null;
        timer = setInterval(() => {
            if (index < len) {
                element.innerHTML += text[index];
                index++;
            } else {
                clearInterval(timer);
                resolve();
            }
        }, time);
    }
    
    /**
     * 获取输出每个字的时间间隔
     * @param {string} textLen 
     * @param {number} during 
     */
    getTextDuring(textLen, during) {
        return (during / textLen).toFixed(4);
    }
    
    // 测试
    const head = document.querySelector('head');
    const body = document.querySelector('body');
    const animate = new Animate(head, body);
    animate.text('p', {}, {color: 'red'}, 'Hello World', 2000);
```
调用`animate.text`后可以看到他已经可以输出啦：
![](https://user-gold-cdn.xitu.io/2019/11/29/16eb690679622342?w=596&h=234&f=gif&s=79327)

## 3.EventLoop（事件循环机制）
我们的`Animate`写到这里，它的最基础的输出文字功能已经实现啦。接下来需要实现的是**让每一段文字按顺序输出**，要实现按顺序地输出必须要让每一个输出方法按顺序地执行。但是JavaScript它不会让我们实现的方法轻易地得逞~   
测试一下：
``` javascript
    // 测试
    const head = document.querySelector('head');
    const body = document.querySelector('body');
    const animate = new Animate(head, body);
    animate.text('p', {}, {color: 'red'}, 'Hello World1', 2000);
    animate.text('p', {}, {color: 'red'}, 'Hello World2', 2000);
    animate.text('p', {}, {color: 'red'}, 'Hello World3', 2000);
```
输出：
![](https://user-gold-cdn.xitu.io/2019/11/29/16eb6ad2bd6c6162?w=596&h=234&f=gif&s=122658)
我们理想的状态应该是每一个`text`都按顺序执行，而不是同时执行。这时因为Javascript是**单线程**的，所以JS在执行的时候会有一个**执行队列（先进先出）**，它将所有要**执行任务**放到执行队列中按序执行，但执行任务又是什么？   
JS中执行任务分为两种：**宏任务（macrotask）**和**微任务（microtask）**，他们在JS中的执行顺序是：**先执行宏任务后执行微任务**。
* 宏任务有：script，setInterval，setTimeout，I/O，requestAnimationFrame，setImmediate（Node.js）
* 微任务有：Promise.then，MutationObserver，process.nextTick(Node.js)

了解完执行队列，再来看一下刚刚写的测试例子。当调用`animate.text`时，因输出文字方法中有`setInterval`，`setInterval`不会先执行，而是插入到`任务队列`中，如下图

![](https://user-gold-cdn.xitu.io/2019/11/30/16eba0495a2f3dcc?w=1306&h=1340&f=png&s=159711)

当三个`animate.text`执行完后，任务队列添加了三个`setInterval`宏任务，当script的方法执行完后，第一插入的`setInterval`开始执行并输出`H`，然后在指定的时间往任务队列最后面添加插入宏任务(因为`setInterval`一个循环执行的方法，每隔一段时间会执行，直到计时器被清除）

了解完JS的执行队列，回到动画代码中，我们需要怎样才能实现一个一个`text`方法按顺序执行。   
[上一篇文章](https://juejin.im/post/5db3e5e8f265da4d4c201c0b)在实现Promise的时候，使用了两个运行队列（resolveArr，rejectArr）来装等待状态改变时执行的方法。这里同样也可以这样做，在类的构造器中添加一个函数数组，将所有执行时的方法在`script`宏任务执行时就添加到数组中，`script`中的代码执行完后**再新建一个宏任务**去一个一个执行数组中的方法。   
接下来要：
* 往构造器中添加一个函数数组
* 添加一个执行函数数组的`run`方法
* 添加一个宏任务去执行`run`
* 将`text`方法中执行的代码放到函数数组中，每次执行完后都调用`run`方法去执行函数数组中的下一个方法
* 修改`printText`方法为Promise方法
``` javascript
    constructor() {
        this.runArr = []; // 函数数组
        
        
![](https://user-gold-cdn.xitu.io/2019/11/30/16eb9e73100327d0?w=368&h=240&f=gif&s=364207)
    }
    
    // 执行函数的方法
    run = () => {
        this.runArr.length ? this.runArr.splice(0,1)[0]() : 0;
    }
    
    /**
     *  添加text
     *  @param {Element} appendNode 插入文本的节点
     *  @param {string} elName 标签名
     *  @param {Object} elOption 标签设置
     *  @param {Object} styleObj 内联样式
     *  @param {Object} text 输出的文字
     *  @param {number} during 输出文字的总时间
     */
    text = (elName, elOption, styleObj, text, during) => {
        this.runArr.push(async () => {
            const element = createElement(elName, elOption, styleObj);
            this.element.contentElement.appendChild(element);
            await this.printText(element, text, during);
            this.run();
        })
    }
    
    /**
     * 
     * @param {Element} element 输出文字的标签
     * @param {string} text 输出的文字
     * @param {number} during 输出文字的总时间
     */
    printText = (element, text, during) => {
        return new Promise(resolve => {
            const len = text.length;
            const time = this.getTextDuring(len, during);
            let index = 0;
            let timer = null;
            timer = setInterval(() => {
                if (index < len) {
                    element.innerHTML += text[index];
                    index++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, time);
        })
    }
```
修改完后我们再来调用刚刚的测试例子
``` javascript
    // 测试
    const head = document.querySelector('head');
    const body = document.querySelector('body');
    const animate = new Animate(head, body);
    animate.text('p', {}, {color: 'red'}, 'Hello World1', 2000);
    animate.text('p', {}, {color: 'red'}, 'Hello World2', 2000);
    animate.text('p', {}, {color: 'red'}, 'Hello World3', 2000);
```

![](https://user-gold-cdn.xitu.io/2019/11/30/16eb9e76ac39789d?w=368&h=240&f=gif&s=364207)

成功了！现在再来看一下它的执行队列图：

![](https://user-gold-cdn.xitu.io/2019/11/30/16eba03009e6d31a?w=1452&h=1118&f=png&s=188603)

## 4.最后添加style和链式调用

到这里我们的方法已经可以实现按顺序向界面输出文字了，最后需要做的是添加`style`和`链式调用`，添加`style`的实现方法和添加文字大致是相同的，链式调用其实就是在**每个方法执行后return这个对象本身**就可以了，这里就不多做解释啦，最终的代码：
``` javascript
    'use strict';

class Animate {
    constructor(headElement, bodyElement) {
        this.element = {
            headElement,
            bodyElement,
            styleElement: null,
            contentElement: null,
            styleContent: null,
        };
        this.runArr = []; // 执行函数的组合
        this.init();

        setTimeout(() => { console.log(this.runArr); this.run(); }, 0);
    }

    // 创建文本界面
    init = () => {
        const styleElement = createElement('style');
        const contentElement = createElement('div', {class: 'text_content'});
        const styleContent = createElement('div', {class : 'style_content'});

        this.element.headElement.appendChild(styleElement);
        this.element.bodyElement.appendChild(contentElement);
        this.element.bodyElement.appendChild(styleContent);

        this.element.contentElement = contentElement;
        this.element.styleElement = styleElement;
        this.element.styleContent = styleContent;
    }

    run = () => {
        this.runArr.length ? this.runArr.splice(0,1)[0]() : 0;
    }

    /**
     *  添加text
     *  @param {Element} appendNode 插入文本的节点
     *  @param {string} elName 标签名
     *  @param {Object} elOption 标签设置
     *  @param {Object} styleObj 内联样式
     *  @param {Object} text 输出的文字
     *  @param {number} during 输出文字的总时间
     */
    text = (elName, elOption, styleObj, text, during) => {
        this.runArr.push(async () => {
            const element = createElement(elName, elOption, styleObj);
            this.element.contentElement.appendChild(element);
            await this.printText(element, text, during);
            this.run();
        })
        return this;
    }

    /**
     * 添加style文件
     * @param {string} selector 选择器名称
     * @param {*} styleObject 
     * @param {*} during 
     */
    style = (selector, styleObject, during) => {
        this.runArr.push(async () => {
            const parentElement = createElement('ul', {class: 'style_row'});
            this.element.styleContent.appendChild(parentElement);
            await this.printStyle(parentElement, selector, styleObject, during);
            this.run();
        })
        return this;
    }

    /**
     * 
     * @param {Element} element 输出文字的标签
     * @param {string} text 输出的文字
     * @param {number} during 输出文字的总时间
     */
    printText = (element, text, during) => {
        return new Promise(resolve => {
            const len = text.length;
            const time = this.getTextDuring(len, during);
            let index = 0;
            let timer = null;
            timer = setInterval(() => {
                if (index < len) {
                    element.innerHTML += text[index];
                    index++;
                } else {
                    clearInterval(timer);
                    resolve();
                }
            }, time);
        })
    }
    

    /**
     * 输出style
     * @param {Element} parentElement 样式的父Element
     * @param {string} selectorName 选择器的文字
     * @param {Object} styleObject 样式对象
     * @param {number} during 输出总时间
     */
    printStyle = (parentElement, selectorName, styleObject, during) => {
        return new Promise(async resolve => {
            const styleStr = JSON.stringify(styleObject).length ; 
            const textLen = selectorName.length + styleStr + 2; // 加 2 是加上左右括号
            const time = this.getTextDuring(textLen, during);

            const list = createElement('li', {class: 'selector'}); // <li></li> 列表
            const selector = createElement('span', {class: 'selector'}); // <span></span> css选择器
            const bracketsLeft = createElement('span', {class: 'style_brackets'}); // <span>{</span> 左大括号
            const bracketsRight = createElement('span', {class: 'style_brackets'}); // <span>{</span> 右大括号
            list.appendChild(selector);
            list.appendChild(bracketsLeft);
            parentElement.appendChild(list);
            
            await this.printText(selector, selectorName, time * selectorName.length);
            await this.printText(bracketsLeft, ' { ', time * 3);
            this.element.styleElement.innerHTML += `${selectorName} {\n`;
            for (const style of Object.keys(styleObject)) {
                const el = this.createStyleElement(list);
                await this.printText(el.styleName, style, time * style.length);
                await this.printText(el.colon, ': ', time * 2);
                await this.printText(el.style, `${styleObject[style]};\n`, time * styleObject[style].length);
                this.element.styleElement.innerHTML += `${style} : ${styleObject[style]}; \n`;
            }
            list.appendChild(bracketsRight);
            await this.printText(bracketsRight, '}', time);
            this.element.styleElement.innerHTML += `} \n`;
            resolve();
        })
    }

    /**
     * 创建样式element
     */
    createStyleElement = (list) => {
        const p = createElement('p', {class: 'style_row'});
        const style = createElement('span', {class: 'style'}); // <span></span> 样式
        const styleName = createElement('span', {class: 'style_name'}); // <span><span> 样式名
        const colon = createElement('span', {class: 'style_colon'}); // <span>:</span> 冒号
        p.appendChild(styleName);
        p.appendChild(colon);
        p.appendChild(style);
        list.appendChild(p);
        return {
            style,
            styleName,
            colon,
        }
    }

    /**
     * 获取输出每个字的时间间隔
     * @param {string} textLen 
     * @param {number} during 
     */
    getTextDuring(textLen, during) {
        return (during / textLen).toFixed(4);
    }
}

// 创建Element
function createElement(elementName, elementObj = {}, styleObj = {}) {
    const element = document.createElement(elementName);

    for (const option of Object.keys(elementObj)) {
        element.setAttribute(option, elementObj[option]);
    }

    for (const styleName of Object.keys(styleObj)) {
        element.style[styleName] = styleObj[styleName];
    }
    
    return element;
}
```
测试：
``` javascript
    'use strict';

    const head = document.querySelector('head');
    const body = document.querySelector('body');
    const animate = new Animate(head, body);
    
    animate
    .text('p', {class: 'text'}, {}, 'hello!', 200)
    .text('p', {class: 'text_yellow'}, {}, '我想被变黄', 500)
    .style('.text_yellow', {'color': 'yellow'}, 1000)
    .text('p', {class: 'text'}, {}, '成功啦!', 1000)
```

![](https://user-gold-cdn.xitu.io/2019/11/30/16eba108545ed6e1?w=368&h=240&f=gif&s=36080)

## 小结

* 我们通过一个动画的例子来了解了JS**事件循环**的执行机制，代码在浏览器/node中是如何执行的。   
* 宏任务：script，setInterval，setTimeout，I/O，requestAnimationFrame，setImmediate（Node.js）
* 微任务：Promise.then，MutationObserver，process.nextTick(Node.js)
* 先执行宏任务，后执行微任务
* 最后，通过这一个小动画例子我们可以利用代码给自己做一个好玩的东西，例如：自动展示的简历😄
