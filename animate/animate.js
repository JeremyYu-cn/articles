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
