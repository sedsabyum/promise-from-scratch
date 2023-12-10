import MyPromise from "../src/my-promise.js";
import * as chai from "chai";

const { expect } = chai;

describe("MyPromise", () => {
  it("Should be newable", () => {
    const p = new MyPromise(() => {});
    expect(p).to.be.instanceOf(MyPromise);
  });

  it("Should call then() if the promise was fulfilled", (done) => {
    const p = new MyPromise((res: any) => {
      res("Hello Promise");
    });

    p.then((value) => {
      expect(value).to.equal("Hello Promise");
      done();
    });
  });

  it("Should call then() if the promise was fulfilled later", (done) => {
    const p = new MyPromise((res: any) => {
      setTimeout(() => {
        res("hello world");
      }, 10);
    });

    p.then((val) => {
      expect(val).to.equal("hello world");
      done();
    });
  });

  it("Should support chaining then()", (done) => {
    const p = new MyPromise((res: (val: number) => void) => {
      setTimeout(() => {
        res(1);
      }, 10);
    });

    p.then((val: number) => {
      return val + 2;
    }).then((val) => {
      expect(val).to.equal(3);
      done();
    });
  });

  it("Should handle errors", (done) => {
    const p = new MyPromise((res: any) => {
      setTimeout(() => {
        res("Hello Promise");
      }, 10);
    });

    let check = 1;

    p.then(() => {
      check += 2;
      throw new Error("Error occurred");
    })
      .then(() => {
        check += 4;
      })
      .catch((err: any) => {
        expect(check).to.equal(3);
        expect(err.message).to.equal("Error occurred");
        done();
      });
  });

  it("Should resolve promises from the onResolve() function", (done) => {
    const p = new MyPromise((res: (val: number) => void) => {
      setTimeout(() => {
        res(1);
      }, 10);
    });

    p.then((val: number) => {
      return new MyPromise((res) => {
        res(val + 2);
      });
    }).then((val) => {
      expect(val).to.equal(3);
      done();
    });
  });

  it("Should resolve a promise", (done) => {
    const p = MyPromise.resolve("Resolved Value");
    p.then((val) => {
      expect(val).to.equal("Resolved Value");
      done()
    });
  });

  it("Should reject a promise", (done) => {
    const p = MyPromise.reject("Rejection Reason");
    p.then(() => {
      done()
    }).catch((err: any) => {
      expect(err).to.equal("Rejection Reason");
      done()
    });
  });

  it("Should resolve array of promises", (done) => {
    const promises: MyPromise<any>[] = [
      MyPromise.resolve("Resolved value"),
      MyPromise.resolve(22),
      new MyPromise(() => {}),
      new MyPromise((res) => {
        res("Another resolved value")
      }),
    ];
    const resolvedPromises = MyPromise.all(promises);
    done()
    resolvedPromises.then((promises) => {
      for (const p of promises) {
        expect(p.status).to.equal("FULFILLED");
        done();
      }
    });
  });
});
