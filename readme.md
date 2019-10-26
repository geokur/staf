# Simple Test Automation Framework
## Quick start
[All code is stored in repo]: (https://github.com/geokur/staf-examples)
### Install Simple Test Automation Framework
```shell
npm install -g staf
```
### Create first test
Create test class
```javascript
const assert = require('assert').strict

class FirstTest {
    myFirstTest() {
        return () => {
            assert.ok(true)
        }
    }
}

module.exports = FirstTest
```
And configuration file for test runner
```javascript
module.exports = {
    testPath: 'test'
}
```
Project structure should look like this:
```
project
+-- test
    +-- first-test.js
+-- test-config.js
```
Execute the test:
```shell
staf test-config.js
```