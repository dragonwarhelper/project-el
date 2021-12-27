const {
    app,
    ipcMain,
    BrowserWindow,
    BrowserView,
    session
} = require('electron')
const configService = require('./services/ConfigService')
const TabsController = require('./services/TabsController')
const {
    MainWindow
} = require('./components//MainWindow/MainWindow')

let mainWindow

function createWindow() {
    // session.defaultSession.clearStorageData([], (data) => {})
    mainWindow = new MainWindow()
    mainWindow.setup()
    TabsController.setupMain(mainWindow.browserView)
    mainWindow.setContentBounds(TabsController.currentTab())
    mainWindow.start()

    ipcMain.on('load_url', (evt, server) => {
        configService.writeData('server', server)
        TabsController.currentTab().webContents.loadURL(`${configService.baseUrl()}`)
        mainWindow.webContents.send('url', `${configService.baseUrl()}`, TabsController.current_tab_id)
        mainWindow.webContents.setZoomFactor(0.9)
    })

    ipcMain.on('reload', (evt) => {
        TabsController.currentTab().webContents.reload()
    })

    let dressingWindow = null
    ipcMain.on('open_dressing_room', () => {
        const path = require('path')
        dressingWindow = new BrowserWindow({
            parent: mainWindow,
            width: 900,
            height: 700,
            minWidth: 900,
            minHeight: 700,
            useContentSize: true,
            show: true,
            webPreferences: {
                preload: path.join(__dirname, './components/Dressing/preload.js')
            }
        })
        dressingWindow.loadFile(`${path.join(__dirname, './components/Dressing/index.html')}`)
    })

    let beltWindow = null
    ipcMain.on('open_belt_room', () => {
        const path = require('path')
        beltWindow = new BrowserWindow({
            parent: mainWindow,
            width: 900,
            height: 700,
            minWidth: 900,
            minHeight: 700,
            useContentSize: true,
            show: true,
            webPreferences: {
                preload: path.join(__dirname, './components/Belt/preload.js')
            }
        })
        beltWindow.loadFile(`${path.join(__dirname, './components/Belt/index.html')}`)
    })

    let chatLogWindow = null
    ipcMain.on('chat_log', () => {
        const path = require('path')
        chatLogWindow = new BrowserWindow({
            parent: mainWindow,
            width: 900,
            height: 700,
            minWidth: 900,
            minHeight: 700,
            useContentSize: true,
            show: true,
            webPreferences: {
                preload: path.join(__dirname, './components/Chat/preload.js'),
                contextIsolation: false
            }
        })
        chatLogWindow.loadFile(`${path.join(__dirname, './components/Chat/index.html')}`)
    })

    ipcMain.on('new_tab', (evt, id, url) => {
        createNewTab(url, id)
    })

    function createNewTab(url, id) {
        url = url ?? 'https://google.com'
        let browserView = new BrowserView({
            enablePreferredSizeMode: true
        })
        browserView.webContents.on('will-navigate', (evt, url) => {
            mainWindow.webContents.send('url', url, TabsController.current_tab_id)
        })
        TabsController.addTab(id, browserView)
        TabsController.setupCurrent(id)
        mainWindow.setBrowserView(browserView)

        browserView.setBounds(mainWindow.getControlBounds())
        browserView.setAutoResize({
            width: true
        })
        mainWindow.setContentBounds(TabsController.currentTab())
        browserView.webContents.loadURL(url)
        mainWindow.webContents.send('url', url, id)
    }

    ipcMain.on('make_active', (evt, id) => {
        TabsController.setupCurrent(id)
        mainWindow.setBrowserView(TabsController.currentTab())
        mainWindow.webContents.send('url', TabsController.currentTab().webContents.getURL(), id)
    })

    ipcMain.on('remove_view', (evt, id) => {
        TabsController.deleteTab(id)
    })

    ipcMain.on('close_tab', (evt, id) => {
        mainWindow.webContents.send('close_tab', id)
    })

    ipcMain.handle('MakeWebRequest', async (evt, req) => {
        let result = await mainWindow.browserView.webContents.executeJavaScript(req.req)
        return {
            result: result,
            req: req
        }
    })

    ipcMain.on('goUrl', (evt, url) => {
        TabsController.currentTab().webContents.loadURL(url)
    })

    ipcMain.handle('LoadSetItems', async (evt, args) => {
        const SetRequests = {
            allItems: {
                url: `${configService.baseUrl()}/user_iframe.php?group=2`,
                script: 'art_alt'
            },
            wearedItems: {
                url: `${configService.baseUrl()}/user.php`,
                script: 'art_alt'
            },
            allPotions: {
                url: `${configService.baseUrl()}/user_iframe.php?group=1`,
                script: 'art_alt'
            }
        }
        let requests = args.map(arg => fetch(SetRequests[arg]))
        let results = await Promise.all(requests)
        let res = {}
        args.forEach((arg, index) => {
            res[arg] = results[index]
        })
        return res
    })

    async function fetch(request) {
        const bw = new BrowserView()
        await bw.webContents.loadURL(request.url)
        return await bw.webContents.executeJavaScript(request.script)
    }
}

app.on('ready', createWindow)

app.on('window-all-closed', function() {
    if(process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    if(mainWindow === null) {
        createWindow()
    }
})
