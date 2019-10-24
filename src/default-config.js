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

function printSummary(stat, summary, status) {
    const red = '\x1b[31m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const esc = '\x1b[0m'
    const { passed, broken, failed } = summary
    console.log('------------------------------------------')
    console.log(`Loaded:    ${stat.loaded} classes`)
    console.log(`Prepared:  ${stat.prepared} tests`)
    console.log(`Planned:   ${stat.planned} tests`)
    console.log(`Executed:  ${stat.executed} tests`)
    console.log(`${green}Passed:    ${passed} tests${esc}`)
    console.log(`${yellow}Broken:    ${broken} tests${esc}`)
    console.log(`${red}Failed:    ${failed} tests${esc}`)
    console.log('------------------------------------------')
    console.log('Exit code: %s', status)
    console.log('------------------------------------------')
}

module.exports = {
    schedule(tests) {
        return tests
    },
    analyze() {

    },
    stop() {
        return false
    },
    provide() {
        return {}
    },
    exit(results, stat) {
        const summary = resultStat(results)
        const { broken, failed } = summary
        const status = (failed > 0 || broken > 0) ? 1 : 0
        printSummary(stat, summary, status)
        return status
    },
    report() {
        return defaultReporter
    },
    threadCount: 1,
    testPath: 'test'
}