/**
 * Exercise 4 Solution: Safe Sandbox Builder
 */

const vm = require('vm');

class SafeSandboxBuilder {
  constructor() {
    this.sandbox = {};
    this.contextCreated = false;
  }

  allowMath() {
    this.sandbox.Math = Math;
    return this;
  }

  allowDate() {
    this.sandbox.Date = Date;
    return this;
  }

  allowJSON() {
    this.sandbox.JSON = JSON;
    return this;
  }

  addFunction(name, fn) {
    this.sandbox[name] = fn;
    return this;
  }

  build() {
    if (!this.contextCreated) {
      vm.createContext(this.sandbox);
      this.contextCreated = true;
    }
    return this;
  }

  execute(code) {
    if (!this.contextCreated) {
      this.build();
    }
    return vm.runInContext(code, this.sandbox, { timeout: 100 });
  }
}

// Test
const sandbox = new SafeSandboxBuilder();

console.log('Safe Sandbox Builder Solution:\n');

sandbox
  .allowMath()
  .addFunction('double', x => x * 2)
  .addFunction('square', x => x * x)
  .build();

console.log('Math.sqrt(16):', sandbox.execute('Math.sqrt(16)'));
console.log('double(5):', sandbox.execute('double(5)'));
console.log('square(4):', sandbox.execute('square(4)'));
