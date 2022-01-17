const { app } = process.type === 'browser' ? require('electron') : require('@electron/remote')
const fs = require('fs')
const path = require('path')
const filePath = path.join(app.getPath('userData'), 'config.json')
const axios = require('axios')

let launched = null;
let clientID = null;

function server() {
    return readData('server')
}

function baseUrl() {
    return `https://${readData('server')}.dwar.ru`
}

function clientNumber() {
    if (clientID == null) {
        clientID = readData('clientID')
        if (clientID == undefined) {
            clientID = 7;
            writeData('clientID', clientID);
        }
    }
    return clientID
}

function storageUrl() {
    // return `https://c10e6974-270f-4f5f-91c0-2aa95d03fc09.mock.pstmn.io/log`
    return `http://185.180.231.44:8080/log`
}

function loadSettings() {
    return readData('settings')
}

function windowOpenNewTab() {
    let settings = readData('settings')
    if(settings) {
        settings = JSON.parse(settings)
        return settings.windowOpenNewTab
    }
    return false
}

function windowsAboveApp() {
    let settings = readData('settings')
    if(settings) {
        settings = JSON.parse(settings)
        return settings.windowsAboveApp
    }
    return false
}

function userAgent() {
    let settings = readData('settings')
    if(settings) {
        settings = JSON.parse(settings)
        return settings.userAgentText
    }
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
}

function maximizeOnStart() {
    let settings = readData('settings')
    if(settings) {
        settings = JSON.parse(settings)
        return settings.maximizeOnStart
    }
    return false
}

function sets() {
    let contents = parseData(filePath)
    let keys = Object.keys(contents).filter(key => key.startsWith('set_'))
    return keys.map(key => JSON.parse(contents[key]))
}

function beltSets() {
    let contents = parseData(filePath)
    let keys = Object.keys(contents).filter(key => key.startsWith('belt_set_'))
    return keys.map(key => JSON.parse(contents[key]))
}

function writeData(key, value) {
    let contents = parseData(filePath)
    contents[key] = value
    Object.keys(contents).forEach(key => {
        if(contents[key] === null) {
            delete contents[key]
        }
    })
    fs.writeFileSync(filePath, JSON.stringify(contents))
}

function readData(key) {
    let contents = parseData(filePath)
    return contents[key]
}

async function postDataToServer(data) {
    if (launched == null)
        launched = new Date();
    
    let body = JSON.stringify({
        log: data,
        launched: launched,
        client: clientNumber()
    });

    console.log(body);
    
    axios({
        method: "post",
        url: storageUrl(),
        headers: {'Content-Type': 'application/json'}, 
        data: body
    });
}

function parseData(filePath) {
    const defaultData = {}
    try {
        return JSON.parse(fs.readFileSync(filePath))
    } catch (error) {
        return defaultData
    }
}

module.exports = {
    server,
    baseUrl,
    loadSettings,
    windowOpenNewTab,
    windowsAboveApp,
    maximizeOnStart,
    userAgent,
    writeData,
    sets,
    beltSets,
    postDataToServer
}
