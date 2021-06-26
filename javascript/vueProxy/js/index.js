'use strict'

/**
 * proxy实现双向绑定
 */

class MyVue{
    constructor(data, id) {
        this.el = document.querySelector(`#${id}`);
        this.data = data; // 数据项data
        this.fragment = null; // documentFragment
        this.nodeArr = []; // 有模版节点的数组
        this.modelObj = {}; // 绑定model的节点对象
        this.replaceReg = new RegExp(`{{(\s*.*?\s*)}}`, 'gi'); // 匹配模版正则
        this.init();
    }

    // 实例化时初始化数据
    init() {
        this.observer();
        this.createDocumentFragment(this.el);
        for (const key of Object.keys(this.data)) {
            this.matchElementModule(key);
        }
        this.el.appendChild(this.fragment);
    }

    // 监听器
    observer() {
        const _this = this;
        const handler = {
            get(target, propkey) {
                return target[propkey];
            },
            set(target, propkey, value) {
                if(target[propkey] !== value) {
                    target[propkey] = value
                    _this.run(propkey);
                }
                return true;
            },
        };
        this.data = new Proxy(this.data, handler);
    }

    /** 
     *  创建一个documentFragment
     *  @param { documentElement } el 监听的父节点 
     */
    createDocumentFragment(el) {
        let documentFragment = document.createDocumentFragment();
        let child = el.firstChild;
        // 循环向文档片段添加节点
        while (child) {
            if (child.getAttribute && this.checkAttribute(child)) {
                if(!this.modelObj[this.checkAttribute(child)]) {
                    this.modelObj[this.checkAttribute(child)] = [];
                };
                this.modelObj[this.checkAttribute(child)].push(child);
                this.setModelData(this.checkAttribute(child), child);
                this.bindModelData(this.checkAttribute(child), child);
            }
            documentFragment.appendChild(child);
            child = el.firstChild;
        }
        this.fragment = documentFragment;
    }

    /**
     * 将数据更新到Element
     * @param { string } key 
     * @param { documentFragment } fragment 文档片段
     */
    matchElementModule(key, fragment) {
        const childNodes = fragment || this.fragment.childNodes;
        [].slice.call(childNodes).forEach((node) => {
            if (node.nodeType === 3 && this.replaceReg.test(node.textContent)) {
                node.defaultContent = node.textContent;
                this.changeData(node);
                this.nodeArr.push(node);
            }

            // 递归遍历子节点
            if(node.childNodes && node.childNodes.length) {
                this.matchElementModule(key, node.childNodes);
            }
        })
    }

    // 改变数据是触发改变视图数据
    run(key) {
        if (this.modelObj[key]) {
            this.modelObj[key].forEach(node => {
                this.setModelData(key, node);
            })
        }
        for(const node of this.nodeArr) {
            this.changeData(node);
        }
    }

    /**
     * 改变视图数据
     * @param { documentElement } node 
     */
    changeData(node) {
        const matchArr = node.defaultContent.match(this.replaceReg);
        let tmpStr = node.defaultContent;
        for(const key of matchArr) {
            tmpStr = tmpStr.replace(key, this.data[key.replace(/\{\{|\}\}|\s*/g, '')] || '');
        }
        node.textContent = tmpStr;
    }

    // 绑定 y-model
    bindModelData(key, node) {
        if (this.data[key]) {
            node.addEventListener('input', (e) => {
                this.data[key] = e.target.value;
            }, false);
        }
    }

    // 设置 y-model 值
    setModelData(key, node) {
        node.value = this.data[key];
    }

    // 检查y-model属性
    checkAttribute(node) {
        return node.getAttribute('y-model');
    }
}
