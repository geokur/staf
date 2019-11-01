function printLine(smb = '=', n = 45) {
    console.log(smb.repeat(n))
}

module.exports.printLine = printLine

module.exports.printHeader = function(version) {
    printLine()
    console.log(`|  Simple Test Automation Framework v${version}  |`)
    printLine()
}

module.exports.printFooter = function(status) {
    printLine('-')
    console.log('Exit code: %s', status)
    printLine('-')
}

module.exports.cutStack = function(error) {
    const stack = error.stack.split('\n')
    const isRunner = row => row.includes('runner.js')
    const runnerRow = stack.findIndex(isRunner)
    return stack.slice(0, runnerRow).join('\n')
}