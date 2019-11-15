# Simple Test Automation Framework
![npm downloads](https://img.shields.io/npm/dm/staf.svg?style=flat-square)

## Background
The idea behind creation of another test runner is to enable:
- Assigning any properties to test
- Controling of which tests to execute and in which order based on their
properties
- Analyzing result of test and decide if it needs retry
- Stopping test execution on fulfilling some condition
- Providing test dependencies into test
## Quick start
All quickstart code is stored in repo: https://github.com/geokur/staf-examples
### Install Simple Test Automation Framework
```shell
npm install -g staf
```
### Simple test
Create test class, save into 'first-test.js' in 'test' folder
```javascript
const assert = require('assert').strict

class SimpleTest {
    mySimpleTest() {
        return () => {
            assert.ok(true)
        }
    }
}

module.exports = SimpleTest
```
And configuration file for test runner in file 'test-config.js'
```javascript
module.exports = {
    testPath: 'test'
}
```
Project structure should look like this:
```
project
+-- test
    +-- simple-test.js
+-- test-config.js
```
Execute the test:
```shell
staf test-config.js
```
### Test with pre and post conditions
```javascript
const assert = require('assert').strict

class ConditionTest {
    beforeEach() {
        this.db = new Map()
        this.db.set('value1', 1)
    }
    hasEntryTest() {
        return () => {
            const hasEntry = this.db.has('value1')
            assert.ok(hasEntry)
        }
    }
    hasNoEntryTest() {
        return () => {
            const hasEntry = this.db.has('value1')
            assert.strictEqual(hasEntry, false)
        }
    }
    afterEach({ testResult }) {
        if (testResult instanceof Error) {
            this.db.clear()
        }
    }
}

module.exports = ConditionTest
```
Execute the test:
```shell
staf test-config.js
```
### Test with properties
Create test with properties
```javascript
const assert = require('assert').strict

class PropertyTest {
    myPositiveTest(testProperties) {
        testProperties.type = 'positive'
        return () => {
            assert.ok(true)
        }
    }
    myNegativeTest(testProperties) {
        testProperties.type = 'negative'
        return () => {
            assert.ok(false)
        }
    }
}

module.exports = PropertyTest
```
And configuration file for test runner in file 'positive-test-config.js'. Notice method 'schedule'. It is used to filter only 'positive' tests.
```javascript
module.exports = {
    testPath: 'test',
    schedule(tests) {
        const onlyPositive = tests.filter(test => test.testProperties.type === 'positive')
        return onlyPositive
    }
}
```
Execute the test:
```shell
staf positive-test-config.js
```
### Test with retry
Create test with retry property
```javascript
const assert = require('assert').strict

class RetryTest {
    zeroRetryTest(testProperties) {
        testProperties.retry = 0
        return () => {
            assert.ok(true)
        }
    }
    oneRetryTest(testProperties) {
        testProperties.retry = 1
        return () => {
            assert.ok(false)
        }
    }
}

module.exports = RetryTest
```
And configuration file for test runner in file 'retry-test-config.js'. Notice method 'analyze' which is called after execution of each test. It is called with 3 params:
- test - test which has just been executed
- result - result of this test
- tests - array with all tests planned for execution

For 'test' to be retried it should just be pushed back to 'tests' array.
```javascript
const retryCount = new Map()

module.exports = {
    testPath: 'test',
    schedule(tests) {
        const onlyRetryable = tests.filter(test => 'retry' in test.testProperties)
        return onlyRetryable
    },
    analyze(test, result, tests) {
        if (result.testResult instanceof Error) {
            const { testProperties } = test
            let retried = retryCount.has(testProperties) ? retryCount.get(testProperties) : 0
            if (retried < testProperties.retry) {
                retryCount.set(testProperties, ++retried)
                tests.push(test)
            }
        }
    }
}
```
Execute the test:
```shell
staf retry-test-config.js
```