function printLine(smb = '=', n = 45) {
    console.log(smb.repeat(n))
}

module.exports.printLine = printLine

module.exports.printHeader = function(version) {
    printLine()
    console.log(`|  Simple Test Automation Framework v${version}  |`)
    printLine()
}

module.exports.printFooter = function(stat) {
    const red = '\x1b[31m'
    const green = '\x1b[32m'
    const yellow = '\x1b[33m'
    const esc = '\x1b[0m'
    const { status, summary } = stat.outcome
    const { passed, broken, failed } = summary
    printLine('-')
    console.log(`Loaded:    ${stat.loaded} classes`)
    console.log(`Prepared:  ${stat.prepared} tests`)
    console.log(`Planned:   ${stat.planned} tests`)
    console.log(`Executed:  ${stat.executed} tests`)
    console.log(`${green}Passed:    ${passed} tests${esc}`)
    console.log(`${yellow}Broken:    ${broken} tests${esc}`)
    console.log(`${red}Failed:    ${failed} tests${esc}`)
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