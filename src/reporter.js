const { AssertionError } = require('assert')

const red = '\x1b[31m'
const green = '\x1b[32m'
const yellow = '\x1b[33m'
const esc = '\x1b[0m'

class Reporter {
    testStarted() {
    }
    testFinished(result) {
        const { testProperties } = result
        const isFailed = ({ beforeEachResult, testResult, afterEachResult }) => {
            if (beforeEachResult instanceof Error) {
                return beforeEachResult
            } else if (testResult instanceof Error) {
                return testResult
            } else if (afterEachResult instanceof Error) {
                return afterEachResult
            }
            return false
        }
        const isFailedAssert = ({ testResult }) => testResult instanceof AssertionError
        let status, error = ''
        const failedResult = isFailed(result)
        if (failedResult) {
            if (isFailedAssert(result)) {
                status = `${red}failed`
                error = `\n${result.testResult.stack}${esc}`
            } else {
                status = `${yellow}broken`
                error = `\n${failedResult.message}\n${failedResult.stack}${esc}`
            }
        } else {
            status = `${green}passed${esc}`
        }
        console.log('%s.%s : %s%s', testProperties.testClassName, testProperties.testName, status, error)
    }
}

module.exports = Reporter