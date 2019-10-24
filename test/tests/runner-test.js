const assert = require('assert').strict
const path = require('path')

const { runner } =require('../../src/runner')
const LoadedClass = require('../loaded/loaded-class')

class RunnerTest {
    testLoad() {
        return () => {
            const dirPath = path.resolve(__dirname + '/../loaded')
            const loaded = runner.load(dirPath)
            assert.strictEqual(loaded.length, 1)
            assert.strictEqual(loaded[0], LoadedClass)
        }
    }
    testPrepare() {
        return () => {
            const dirPath = path.resolve(__dirname + '/../loaded')
            const loaded = runner.load(dirPath)
            const prepared = runner.prepare(loaded)
            assert.strictEqual(prepared.length, 1)
            const { testProperties, testBody } = prepared[0]
            assert.strictEqual(testProperties.testClassName, 'LoadedClass')
            assert.strictEqual(testProperties.testName, 'loadedTest')
            assert.strictEqual(typeof testBody, 'function')
        }
    }
}

module.exports = RunnerTest