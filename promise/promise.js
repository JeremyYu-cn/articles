'use strict';

const stateArr = ['pending', 'fulfilled', 'rejected']; // 三种状态

class MyPromise {
    constructor(callback) {
        this.state = stateArr[0]; // 当前状态
        this.value = null; // 完成时的返回值
        this.reason = null; // 失败原因
        this.resolveArr = []; // 成功
        this.rejectArr = []; // 失败

        try {
            callback(this.resolve, this.reject);
        } catch(err) {
            this.reject(err);
        }
    }

    resolve = (value) => {
        if(this.state === stateArr[0]) {
            this.state = stateArr[1];
            this.value = value;
            this.resolveArr.forEach(callback => callback(value));
        }
    }

    reject = (reason) => {
        if(this.state === stateArr[0]) {
            this.state = stateArr[2];
            this.reason = reason;
            this.rejectArr.forEach(callback => callback(reason));
        }
    }

    then = (onResolve, onRejected) => {
        // resolve reject 不是函数，则忽略他们
        onResolve = typeof onResolve === 'function' ? onResolve : (value) => value;
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => reason;

        // pending
        if (this.state === stateArr[0]) {
            return new MyPromise((resolve, reject) => {
                this.resolveArr.push((value) => {
                    try {
                        const result = onResolve(value);
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(err) {
                        reject(err)
                    }
                })

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

        // fulfilled
        if (this.state === stateArr[1]) {
            return new MyPromise((resolve, reject) => {
                try {
                    const result = onResolve(this.value);
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

        // rejected
        if (this.state === stateArr[2]) {
            return new MyPromise((resolve, reject) => {
                try {
                    const result = onRejected(this.value);
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

    catch = (reject) => {
        return this.then(null, reject);
    }

}

MyPromise.resolve = (value) => {
    return new MyPromise((resolve, reject) => { resolve(value) });
}

MyPromise.resolve = (reason) => {
    return new MyPromise((resolve, reject) => { reject(reason) });
}
