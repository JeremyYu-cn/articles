## 策略模式定义

我们在使用一些导航软件是，如果从A地到B地，导航软件会根据不同的条件使用不同的算法计算A地到B地的路径，但是最终要达到目的的一样的。这就是策略模式的体现。  

    策略模式就是定义一系列算法，把他们一个个封装起来，并且使他们可以相互替换。
举个例子：在使用导航系统的时候，可以根据不同的条件去匹配不同的路径。那么可以这样去实现：
```javascript
    
    // 路径算法类A
    function PathPolicyA() {}
    PathPolicyA.prototype.calculate = function(type) {
        return 'policyA';
    }
    
    // 路径算法类B
    function PathPolicyB() {}
    PathPolicyB.prototype.calculate = function(type) {
        return 'policyB';
    }
    
    // 路径类
    function Path() {
        this.path = null;
        this.policy = null;
    }
    
    Path.prototype.setPolicy = function(policy) {
        this.policy = policy;
    }
    
    // 根据不同类型获取不同的路径
    Path.prototype.getPath = function() {
        return this.policy.calculate();
    }
    
    const p = new Path();
    
    p.setPolicy(new PathPolicyA());
    console.log(p.getPath()); // policyA
    
    p.setPolicy(new PathPolicyB());
    console.log(p.getPath()); // policyB

```
上面代码是一个**传统**面向对象语言的策略模式实现，它通过`setPolicy`设置不同的策略，再通过`getPath`调用对应策略类的`calculate`计算方法，最终返回路径。

## JavaScript的策略模式

   
上面代码虽然实现了策略模式，但是上面代码在JS中实现似乎显得有点笨重。JavaScript创建对象非常简答，而且对象里面可以是一个函数。这样只需定义一个对象就可以解决上面的问题：
```javascript
    var policyObj = {
        A: () => 'policyA',
        B: () => 'policyB',
    }
    function getPath(policyObj, type) {
        if (policyObj[ type ] && typeof policyObj[ type ] === 'function') {
            return policyObj[ type ]();
        }
        return 'policy is not found';
    }
    
    console.log(getPath(policyObj, 'A')); // policyA
    console.log(getPath(policyObj, 'B')); // policyB
```
这段代码与上面的方法作用是一致的，而且这段代码看上去是更为简洁，我们只需定义一个对象装入所有的策略，在根据不同的条件去调用不同的方法。   
上面代码都体现了，策略模式的核心：**定义一系列算法，把他们一个个封装起来，并且使他们可以相互替换**

## 利用策略模式制作表单验证

从定义看来，似乎策略模式是用来封装算法的，其实不然，我们也可以用它来做一些扩展，封装一些业务规则，比如表单验证，下面就用策略模式来实现一个表单验证吧~

```javascript
var policy = {
    // 必填校验
    isEmpty: ({ val }) => !!val,
    // 最大长度校验
    maxLength: ({ maxLen, val }) => val.length < maxLen,
    //纯数字校验
    isNumber: ({ val }) => /^[0-9]*$/.test(val),
}

function varifyForm(formData, formRule) {
    // 循环表单对象
    for(let x in formData) {
        // 字段有定义规则才进行验证
        if (formRule[ x ]) {
            const tmpVal = formData[ x ];
            // 循环验证规则
            for(let rule of formRule[ x ]) {
                // 有定义的策略才验证
                if (policy[ rule.type ]) {
                    const param = {...Object.assign(rule.param || {}, { val: tmpVal })}
                    const isAccept = policy[ rule.type ](param)
                    if (!isAccept) return {
                        accept: false,
                        msg: rule.errMsg || `${ x } varify fail`,
                    }
                }
            }
        }
    }
    return {
        accept: true,
        msg: '',
    }
}

// 定义测试用例
var form1 = {
    a: null,
}
var form2 = {
    a: 213213123,
}
var form3 = {
    a: 'd212',
}
var rules = {
    a: [
        {
            type: 'isEmpty',
            errMsg: 'a is Empty'
        },
        {
            type: 'maxLength',
            errMsg: 'a is too long',
            param: { maxLen: 5 },
        },
        {
            type: 'isNumber',
            errMsg: 'a is not a number',
        },
    ]
}

console.log(varifyForm(form1, rules)); // a is Empty
console.log(varifyForm(form2, rules)); // a is too long
console.log(varifyForm(form3, rules)); // a is not a number
```
上面代码中，`policy`是一个定义策略的对象，`varifyForm`验证表单的主方法，通过传入`表单数据`和`表单字段验证规则`，验证每个字段所定义的规则。最终返回验证结果。

聊聊JavsScript中的策略模式


在JavaScript中，函数作为一等对象，策略模式在这里跟原型模式一样，它已经融入了JavaScript语言本身。虽然它在JavaScript中是一种相对“透明”的模式，但是了解策略模式对我们设计函数，了解JavaScript有一定的帮助。   

使用策略模式也有一定有优点：   

    1. 利用委托，组合等技术，可以有效避免条件选择语句。   
    2. 算法独立封装在一个对象或类中，更容易切换，理解和扩展。
 

## 小结

本文主要介绍了策略模式的概念和优点，在JavaScript中使用策略模式的例子。

策略模式是`定义一系列算法，把他们一个个封装起来，并且使他们可以相互替换`

JavaScript设计模式其他文章   
[1.原型模式](https://github.com/IchliebedichZhu/articles/tree/master/designMode/prototype)   
[2.设计模式之单例模式](https://github.com/IchliebedichZhu/articles/tree/master/designMode/single)   


## 参考

1. JavaScript设计模式与开发实践