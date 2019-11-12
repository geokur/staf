const { AssertionError } = require('assert')

const Reporter = require('./reporter')
const defaultReporter = new Reporter()

function resultStat(results) {
    const outcome = {
        passed: 0,
        broken: 0,
        failed:0
    }
    const isFailed = ({ beforeEachResult, testResult, afterEachResult }) => beforeEachResult instanceof Error ||
                            testResult instanceof Error || afterEachResult instanceof Error
    const isFailedAssert = ({ testResult }) => testResult instanceof AssertionError
    results.forEach(result => isFailed(result) ? (isFailedAssert(result) ? outcome.failed++ : outcome.broken++) : outcome.passed++)
    return outcome
}

/**
 * @typedef {Object} TestProperties
 * @property {string} testClassName - name of the class where the test is defined
 * @property {string} testName - name of the test
 */

/**
 * @typedef {Object} TestResult
 * @property {*} beforeEachResult
 * @property {*} testResult
 * @property {*} afterEachResult
 * @property {TestProperties} testProperties
 */

/**
 * @typedef {Object} Test
 * @property {TestProperties} testProperties
 * @property {Function} testBody
 */

/**
 * @typedef {Object} Summary
 * @property {number} passed
 * @property {number} broken
 * @property {number} failed
 */

/**
 * @typedef {Object} Outcome
 * @property {Summary} stat
 * @property {number} status
 */

module.exports = {
    /**
     * Schedule tests for execution.
     * @param {Array} tests - tests loaded from test classes
     * @returns {Array} tests to be executed
     */
    schedule(tests) {
        return tests
    },
    /**
     * This function called after each test. If test needs retry it can be pushed back to array
     * @param {Test} test - current test
     * @param {TestResult} result - result of current test
     * @param {Array} tests - array of executed tests
     */
    analyze() {

    },
    /**
     * @param {TestResult} result - result of current test
     * @returns {Boolean} if this function returns true then execution of all tests stops
     */
    stop() {
        return false
    },
    /**
     * This function executed before each test.
     * @param {number} threadID - id of execution thread
     * @param {TestProperties} testProperties - properties of executed test
     * @returns {Object} Object which is injected into test body as the parameter
     */
    provide() {
        return {}
    },
    /**
     * This function executed after all tests finished.
     * @param {Array} results - array of test results
     * @param {Object} stat - Statistics
     * @returns {Outcome} Outcomet of tests execution
     */
    exit(results) {
        const summary = resultStat(results)
        const { broken, failed } = summary
        const status = (failed > 0 || broken > 0) ? 1 : 0
        return { status, summary }
    },
    /**
     * This function executed before each test.
     * @param {number} threadID - id of execution thread
     * @param {TestProperties} testProperties - properties of executed test
     * @returns {Reporter} Reporter for current test
     */
    report() {
        return defaultReporter
    },
    /**
     * Number of threads to use for test execution.
     */
    threadCount: 1,
    /**
     * Path to folder containing tests. Tests are loaded recursively.
     */
    testPath: 'test'
}