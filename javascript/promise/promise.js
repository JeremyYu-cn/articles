const stateArr = ['pending', 'fulfilled', 'rejected']; // 三种状态
class MyPromise {
    constructor(callback) {
        this.state = stateArr[0]; // 当前状态
        this.value = null; // 完成时的返回值
        this.reason = null; // 失败原因
        this.resolveArr = [];
        this.rejectArr = [];
        
        callback(this.resolve, this.reject); // 调用此function
    }
    
    // callback中执行的resolve方法
    resolve = (value) => {
        // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
                this.state = stateArr[1]; // 更新状态为 fulfilled
                this.value = value; // 写入最终的返回值
               
                this.resolveArr.forEach(fun => fun(value)) // 循环执行then已插入的resolve方法
            }
    }
    
    // callback中执行的reject方法
    reject = (reason) => {
        // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[1]; // 更新状态为 fulfilled
               this.reason = reason; // 写入最终的返回值
               
               this.rejectArr.forEach(fun => fun(reason)) // 循环执行then已插入的reject方法
            }
    }
    
    // then方法
    then = (onFulilled, onRejected) => {
        // 判断onFulilled 和 onRejected是否是一个函数，如果不是函数则忽略它
        onFulilled = typeof onFulilled === 'function' ? onFulilled : (value) => value;
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => reason;

        // 如果状态为pending
        if (this.state === stateArr[0]) {
            return new MyPromise((resolve, reject) => {
                // 插入成功时调用的函数
                this.resolveArr.push((value) => {
                    try {
                        const result = onFulilled(value);
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(err) {
                        reject(err);
                    }
                })
                
                // 插入失败时调用的函数
                this.rejectArr.push((value) => {
                    try {
                        const result = onRejected(value);
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(err) {
                        reject(err)
                    }
                })
            })
            
        }
        
        // 如果状态是fulfilled
        if (this.state === stateArr[1]) {
            // then返回的必须是一个promise
            return new MyPromise((resolve, reject) => {
                try {
                    const result = onFulilled(this.value); // 执行传入的onFulilled方法
                    
                    // 如果onFulilled返回的是一个Promise,则调用then方法
                    if (result instanceof MyPromise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } catch(err) {
                    reject(err);
                }
            })
        }
        
        // 如果状态是rejected
        if (this.state === stateArr[2]) {
            // then返回的必须是一个promise
            return new MyPromise((resolve, reject) => {
                try {
                    const result = onRejected(this.reason); // 执行传入的onRejected方法
                    
                    // 如果onRejected返回的是一个Promise,则调用then方法
                    if (result instanceof MyPromise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } catch(err) {
                    reject(err);
                }
            })
        }
    }

    // 调用then中的reject
    catch = (reject) => {
        this.then(null, reject);
    }
}

MyPromise.resolve = (value) => {
    return new MyPromise((resolve, reject) => { resolve(value) });
}

MyPromise.resolve = (reason) => {
    return new MyPromise((resolve, reject) => { reject(reason) });
}
