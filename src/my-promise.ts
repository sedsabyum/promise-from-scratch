type Status = "PENDING" | "FULFILLED" | "REJECTED";
type UnpackPromise<T> = T extends MyPromise<infer U> ? U : never;

interface IMyPromise<T> {
  then<TResult1 = T, TResult2 = never>(
    onResolved?:
      | ((value: T) => PromiseLike<TResult1> | TResult1)
      | undefined
      | null,
    onRejected?:
      | ((reason?: any) => PromiseLike<TResult2> | TResult2)
      | undefined
      | null,
  ): MyPromise<TResult1 | TResult2>;
  catch(
    onRejected: (reason: any) => (PromiseLike<void> | void) | null | undefined,
  ): MyPromise<void | T>;
}

class MyPromise<T> implements IMyPromise<T> {
  private value: T | undefined;
  private status: Status;
  private readonly callbacks: any[][];

  constructor(
    executor: (
      fulfill: (value: T) => void,
      reject: (reason?: any) => void,
    ) => void,
  ) {
    this.status = "PENDING";
    this.value = {} as T;
    this.callbacks = [];

    executor(this._fulfill.bind(this), this._reject.bind(this));
  }

  then<TResult1, TResult2>(
    onResolved?:
      | ((value: T) => PromiseLike<TResult1> | TResult1)
      | undefined
      | null,
    onRejected?:
      | ((reason: any) => PromiseLike<TResult2> | TResult2)
      | undefined
      | null,
  ): MyPromise<TResult1 | TResult2> {
    const subPromise = new MyPromise<TResult1 | TResult2>(() => {});

    if (this.status === "PENDING") {
      this.callbacks.push([onResolved, onRejected, subPromise]);
    } else {
      setTimeout(() => {
        this._handleCallback(onResolved, onRejected, subPromise);
      }, 0);
    }

    return subPromise;
  }

  catch(onRejected: any): MyPromise<never> {
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

  private _handleCallback(onResolved: any, onRejected: any, subPromise: any) {
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

      if (newValue instanceof MyPromise && newValue.then !== undefined) {
        newValue.then(
          (value: any) => {
            subPromise._fulfill(value);
          },
          (reason?: any) => {
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

  static resolve<S>(value: S): MyPromise<S> {
    return new MyPromise<S>((resolve) => resolve(value));
  }

  static reject(reason?: any): MyPromise<never> {
    return new MyPromise<never>((_, reject) => reject(reason as never));
  }

  static all<S extends MyPromise<any>[]>(
    promises: [...S],
  ): MyPromise<{ [K in keyof S]: UnpackPromise<S[K]> }> {
    const result: any = [];
    let resultCount = 0;

    return new MyPromise((resolve, reject) => {
      if (promises.length === 0) {
        resolve(result);
        return;
      }

      for (const [index, promise] of promises.entries()) {
        promise
          .then((value) => {
            resultCount++;
            result[index] = value;

            if (resultCount === promises.length) {
              resolve(result);
            }
          })
          .catch((err: any) => {
            reject(err);
          });
      }
    });
  }
}

export default MyPromise;
