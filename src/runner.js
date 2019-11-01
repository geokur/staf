const path = require('path')
const fs = require('fs')

function load(dirPath) {
    const classes = []
    const isClass = (cls) => typeof cls === 'function' && /^class\s/.test(Function.prototype.toString.call(cls))
    const loadFile = (file) => {
        const cls = require(file)
        if (isClass(cls)) {
            classes.push(cls)
        }
    }
    const loadDir = (dir) => {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file)
            if (fs.statSync(filePath).isDirectory()) {
                loadDir(filePath)
            } else {
                loadFile(filePath)
            }
        })
    }
    if (!fs.existsSync(dirPath)) {
        throw new Error(`Test path [${dirPath}] does not exist`)
    }
    loadDir(dirPath)
    return classes
}

function parse(TestClass) {
    const beforeEach = Reflect.has(TestClass.prototype, 'beforeEach')
    const afterEach = Reflect.has(TestClass.prototype, 'afterEach')
    const testNames = Reflect.ownKeys(TestClass.prototype)
                                .filter(key => key !== 'beforeEach' && key !== 'afterEach' && key !== 'constructor')
    return { TestClass, beforeEach, afterEach, testNames }
}

async function safe(fn) {
    let result
    try {
        result = await fn()
    } catch(e) {
        result = e
    }
    return result
}

function createTest(testInstance, testProperties, beforeEach, afterEach) {
    const { testName, testClassName } = testProperties
    const testFunc = testInstance[testName](testProperties)
    if (typeof testFunc !== 'function') {
        throw new TypeError(`Test method [${testClassName}.${testName}] did not return function`)
    }
    const testBody = async (provided) => {
        let beforeEachResult, testResult, afterEachResult
        if (beforeEach) {
            beforeEachResult = await safe(() => testInstance.beforeEach({ testProperties, provided }))
        }
        if (!(beforeEachResult instanceof Error)) {
            testResult = await safe(() => testFunc(provided))
        }
        if (afterEach) {
            afterEachResult = await safe(() => testInstance.afterEach({ testProperties, beforeEachResult, testResult, provided }))
        }
        return { testProperties, beforeEachResult, testResult, afterEachResult }
    }
    return { testProperties, testBody }
}

function wrap(parsedTestClass) {
    const { TestClass, beforeEach, afterEach, testNames } = parsedTestClass
    const testClassName = TestClass.name
    return testNames.map(testName => {
        const testInstanceProperties = { testClassName }
        const testInstance = new TestClass(testInstanceProperties)
        const testProperties = Object.assign({}, { testName }, testInstanceProperties)
        return createTest(testInstance, testProperties, beforeEach, afterEach)
    })
}

function prepare(testClasses) {
    return testClasses.map(parse).flatMap(wrap)
}

function plan(schedule, preparedTests) {
    const planned = schedule(preparedTests)
    if (!(planned instanceof Array)) {
        throw new TypeError(`InvalidConfig: [schedule] method returned [${typeof planned}] but [Array] is expected`)
    }
    return planned
}

async function execute(tests, config) {
    const { report, analyze, stop, provide } = config
    const results = new Map()
    const executeThread = async (threadID) => {
        while (tests.length) {
            const test = tests.shift()
            const { testProperties, testBody } = test
            const testReporter = report(threadID, testProperties)
            const testDependecies = provide(threadID, testProperties)
            testReporter.testStarted(testProperties)
            const result = await testBody(testDependecies)
            results.set(testProperties, result)
            testReporter.testFinished(result)
            if (stop(result)) {
                break
            }
            analyze(test, result, tests)
        }
    }
    const running = []
    let threadCount = config.threadCount
    while (threadCount--) {
        const threadDone = executeThread(threadCount)
        running.push(threadDone)
    }
    await Promise.all(running)
    return results
}

function validateConfig(config) {
    if (typeof config.testPath !== 'string') {
        throw new TypeError(`InvalidConfig: [testPath] is not a string`)
    }
    if (!Number.isInteger(config.threadCount)) {
        throw new TypeError(`InvalidConfig: [threadCount] is not an integer`)
    }
    ['schedule', 'analyze', 'stop', 'provide', 'report', 'exit'].forEach(method => {
        if (typeof config[method] !== 'function') {
            throw new TypeError(`InvalidConfig: [${method}] is not a function`)
        }
    })
    return true
}

async function run(config) {
    if (validateConfig(config)) {
        let stat = {}
        const { testPath, schedule, exit } = config
        const resolvedPath = path.resolve(testPath)
        const classes = load(resolvedPath)
        stat.loaded = classes.length
        const prepared = prepare(classes)
        stat.prepared = prepared.length
        const planned = plan(schedule, prepared)
        stat.planned = planned.length
        const results = await execute(planned, config)
        stat.executed = results.size
        return exit(results, stat)
    }
}

const runner = {
    load, prepare, plan, execute
}

module.exports = { run, runner }