const compileUtil = {
    /* 1. v-text指令
    2. {{}}语法
    */
    getValue(expr, vm) {
        return expr.split('.').reduce((data, currentVal) => {
            return data[currentVal]
        }, vm._data)
    },
    text(node, expr, vm) {
        let value;
        if (expr.indexOf('{{') !== -1) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
                return this.getValue(args[1],vm)
            })
        } else {
            value = this.getValue(expr, vm)
        }
        this.updater.textUpdater(node, value)
    },

    html(node,expr,vm){
        let value = this.getValue(expr, vm)
        this.updater.htmlUpdater(node,value)
    },

    on(node,expr,vm,attrName){
        let fn = vm.$options.methods && vm.$options.methods[expr];
        node.addEventListener(attrName,fn.bind(vm),false)
    },

    model(node,expr,vm){
        const value = this.getValue(expr,vm);
        this.updater.modelUpdater(node,value)
    },

    bind(node,expr,vm,attrName){
        let value = this.getValue(expr,vm);
        this.updater.attrUpdater(node,value,attrName)
    },

    /* 更新函数 */
    updater: {
        textUpdater(node, value) {
            node.textContent = value
        },
        htmlUpdater(node,value){
            node.innerHTML  = value
        },
        modelUpdater(node,value){
            node.value = value
        },
        attrUpdater(node,value,attrName){
            node.setAttribute(attrName,value)
        }
    }
}

class Mvue {
    constructor(options) {
        this.$el = options.el;
        this._data = options.data;
        this.$options = options;
        //如果这个根元素存在则开始编译模板
        if (this.$el) {
            new Compile(this.$el, this)
        }
    }
}

//vm代表Mvue类自身
class Compile {
    constructor(el, vm) {
        this.el = document.querySelector(el);
        this.vm = vm
        /* 
        通过创建文档片段，将DOM节点放到内存中操作。
        全部操作完毕，再增加到真实DOM上，减少回流与重绘。
         */
        const fragment = this.nodeFragement(this.el)

        //编译模板,解析指令，内部监听器等
        this.complie(fragment)

        //将编译后的虚拟的节点对象添加到真实DOM树上
        this.el.appendChild(fragment)
    }

    nodeFragement(el) {
        const fragment = document.createDocumentFragment()
        /* appendChild方法会将原来的DOM树节点添加到虚拟的节点对象中，
        并且会删除原来的节点
        所以只需判断第一个元素在不在，在的话删除该节点，并添加到虚拟对象中
        */
        while (el.firstChild) {
            fragment.appendChild(el.firstChild);
        }
        return fragment
    }

    complie(fragment) {
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(item => {
            /* 对子节点的类型进行不同的处理 */
            if (this.isElementNode(item)) {
                this.complieElement(item)
            } else if (this.isTextNode(item)) {
                this.complieText(item)
            }
            /* 递归遍历子元素 */
            if (item.childNodes && item.childNodes.length) {
                this.complie(item)
            }
        })
    }

    complieElement(node) {
        /* 获取该节点的所有属性 */
        const attributes = node.attributes;
        [...attributes].forEach(attr => {
            /* attr : v-text='msg'  v-html = 'htmlStr' */
            const { name, value } = attr;
            /* name：v-text v-html v-on:click @click v-bind:src*/
            if (this.isDirective(name)) {
                const [, directive] = name.split('-')
                //v-bind:src v-on:click
                const [dirName, attrName] = directive.split(':')
                /* value自定义属性，this.vm传递data数据 */
                compileUtil[dirName] && compileUtil[dirName](node, value, this.vm, attrName)

            } else if (this.isEventName(name)) {
                const [,attrName] = name.split('@')
                compileUtil['on'](node,value,this.vm,attrName)
            }

            node.removeAttribute(name)

        })
    }

    complieText(node) {
        const content = node.textContent;
        if (/\{\{(.+?)\}\}/.test(content)) {
            //{{}}形式，处理文本节点
            compileUtil['text'](node, content, this.vm)
        }
    }

    //判断是否以v-开头
    isDirective(name) {
        return name.startsWith("v-")
    }

    isEventName(name) {
        return name.startsWith("@")
    }

    isElementNode(node) {
        return node.nodeType === 1
    }

    isTextNode(node) {
        return node.nodeType === 3
    }
}


/* Watcher是连接Observer和Compile的桥梁 */