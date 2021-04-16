class Observer{
    constructor(data){
        this.observer(data)
    }
    observer(data){
        /* 先监听对象,暂不处理数组 */
        if(typeof data === 'object' && data !== 'null'){
            Object.keys(data).forEach(key=>{
                this.defineReactive(data,key,data[key])
            })
        }
    }

    defineReactive(obj,key,value){
        /* 递归遍历对象中所有属性 */
        this.observer(value)
        const dep = new Dep()
        Object.defineProperty(obj,key,{
            get(){
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set:(newVal)=>{
                if(newVal !== value){
                    /* 如果外界直接修改对象，则对新修改的值重新监测 */
                    this.observer(newVal);
                    value = newVal
                    dep.notify()
                }
            }
        })
    }
}

class Dep{
    constructor(){
        this.subs=[]
    }

    addSub(Watcher){
        this.subs.push(Watcher)
    }

    notify(){
        console.log(this.subs)
        this.subs.forEach(w=>{
            w.update()
        })
    }
}

class Watcher{
    constructor(vm,expr,cb){
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        /* 存储旧值 */
        this.oldVal= this.getOldVal()
    }
    getOldVal(){
        /* 将自身添加到dep类的target静态属性上 */
        Dep.target = this;
        /* 初始化时，取旧值 */
        const oldVal = compileUtil.getValue(this.expr, this.vm);
       
        Dep.target = null;
        return oldVal
    }
    update(){
        /* 用相同的字段取更新后的值 */
        const newVal = compileUtil.getValue(this.expr, this.vm)
        if(newVal !== this.oldVal){
            this.cb(newVal);
        }
    }
}