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

function getTestFunc(testInstance, testProperties) {
    const { testName, testClassName } = testProperties
    const red = '\x1b[31m'
    const esc = '\x1b[0m'
    try {
        const testBody = testInstance[testName](testProperties)
        if (typeof testBody === 'function') {
            return testBody
        }
        console.log(`${red}Test method [${testClassName}.${testName}] did not return body of test${esc}`)
    } catch(e) {
        console.log(`${red}Error executing method [${testClassName}.${testName}]`)
        console.log(e.message, esc)
    }
    return undefined
}

function createTest(testInstance, testProperties, beforeEach, afterEach) {
    let testFunc = getTestFunc(testInstance, testProperties)
    if (testFunc === undefined) {
        return undefined
    }
    const testBody = async (provider) => {
        let beforeEachResult, testResult, afterEachResult
        if (beforeEach) {
            beforeEachResult = await safe(() => testInstance.beforeEach(provider))
        }
        if (!(beforeEachResult instanceof Error)) {
            testResult = await safe(() => testFunc(provider))
        }
        if (afterEach) {
            afterEachResult = await safe(() => testInstance.afterEach({ beforeEachResult, testResult }, provider))
        }
        return { testProperties,  beforeEachResult, testResult, afterEachResult }
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
    }).filter(Boolean)
}

function prepare(testClasses) {
    return testClasses.map(parse).flatMap(wrap)
}

function plan(schedule, preparedTests) {
    return schedule(preparedTests)
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

async function run(config) {
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

const runner = {
    load, prepare, plan, execute
}

module.exports = { run, runner }