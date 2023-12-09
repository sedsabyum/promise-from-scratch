type Status = "PENDING" | "FULFILLED" | "REJECTED";

interface IMyPromise {
  then(
    onResolved: (value: any) => void,
    onRejected?: (reason: any) => void,
  ): MyPromise;
  catch(onRejected: (reason: any) => void): MyPromise;
}

class MyPromise implements IMyPromise {
  private value: any;
  private status: Status;
  private readonly callbacks: any[][];

  constructor(
    executor: (
      fulfill: (value: any) => void,
      reject: (reason: any) => void,
    ) => void,
  ) {
    this.status = "PENDING";
    this.value = undefined;
    this.callbacks = [];

    executor(this._fulfill.bind(this), this._reject.bind(this));
  }

  then(
    onResolved: ((value: any) => void) | undefined,
    onRejected?: (value: any) => void,
  ): MyPromise {
    const subPromise = new MyPromise(() => {});

    if (this.status === "PENDING") {
      this.callbacks.push([onResolved, onRejected, subPromise]);
    } else {
      setTimeout(() => {
        this._handleCallback(onResolved, onRejected, subPromise);
      }, 0);
    }

    return subPromise;
  }

  catch(onRejected: (reason: any) => void): MyPromise {
    return this.then(undefined, onRejected);
  }

  private _fulfill(value: any) {
    if (this.status !== "PENDING") {
      throw new Error("Promise was already resolved");
    }

    this.status = "FULFILLED";
    this.value = value;
    this._callAllCallbacks();
  }

  private _reject(reason: any) {
    if (this.status !== "PENDING") {
      throw new Error("Promise was already resolved");
    }

    this.status = "REJECTED";
    this.value = reason;
    this._callAllCallbacks();
  }

  private _callAllCallbacks() {
    for (const cb of this.callbacks) {
      if (cb.length === 3) {
        const [onResolved, onRejected, subPromise] = cb;
        this._handleCallback(onResolved, onRejected, subPromise);
      }
    }
  }

  private _handleCallback(
    onResolved: ((value: any) => void) | undefined,
    onRejected: ((reason: any) => void) | undefined,
    subPromise: MyPromise,
  ) {
    try {
      let newValue;
      if (this.status === "FULFILLED") {
        if (onResolved !== undefined) {
          newValue = onResolved(this.value);
        } else {
          newValue = this.value;
        }
      } else if (this.status === "REJECTED") {
        if (onRejected !== undefined) {
          newValue = onRejected(this.value);
        } else {
          throw this.value;
        }
      }

      if (newValue.then !== undefined) {
        newValue.then(
          (value: any) => {
            subPromise._fulfill(value);
          },
          (reason: any) => {
            subPromise._reject(reason);
          },
        );
      } else {
        subPromise._fulfill(newValue);
      }
    } catch (err) {
      subPromise._reject(err);
    }
  }

  static resolve(value: any) {
    return new MyPromise((res: (value: any) => void) => res(value));
  }

  static reject(reason: any) {
    return new MyPromise(
      (_: (value: any) => void, reject: (reason: any) => void) =>
        reject(reason),
    );
  }

  static all(promises: Array<MyPromise>) {
    const result: any = [];
    let resultCount = 0;
    return new MyPromise(
      (resolve: (value: any) => void, reject: (reason: any) => void) => {
        for (const [index, promise] of promises.entries()) {
          promise
            .then((value: any) => {
              resultCount++;
              result[index] = value;
              if (resultCount === promises.length) {
                resolve(result);
              }
            })
            .catch((err) => {
              reject(err);
            });
        }
      },
    );
  }
}

export default MyPromise;
