const electron = require('electron')

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const BrowserView = electron.BrowserView
const path = require('path')
const ipcMain = electron.ipcMain

const configService = require('./services/ConfigService')
const TabsController = require('./services/TabsController')
const { MainWindow } = require('./components/MainWindow')

let mainWindow
let current_server = null

function createMainBrowserView() {
    let browserView = new BrowserView({
        enablePreferredSizeMode: true
    })
    browserView.setBounds(mainWindow.getControlBounds())
    browserView.setAutoResize({
        width: true
    });
    return browserView
}

function createWindow() {
    mainWindow = new MainWindow()
    let browserView = createMainBrowserView()
    mainWindow.setup(browserView)
    TabsController.setupMain(browserView)
    mainWindow.setContentBounds(TabsController.currentTab())
    mainWindow.start()

    ipcMain.on("load_url", (evt, server) => {
        current_server = server
        TabsController.currentTab().webContents.loadURL(`http://${current_server}.dwar.ru`)
        mainWindow.webContents.send('url', `http://${current_server}.dwar.ru`, TabsController.current_tab_id)
        configService.writeData('server', server)
    });

    ipcMain.on('reload', (evt) => {
        TabsController.currentTab().webContents.reload()
    })

    ipcMain.on('open_dressing_room', (evt) => {
        let child = new BrowserWindow({
            parent: mainWindow,
            width: 700,
            height: 700,
            useContentSize: true,
            show: false
        });
        let dressing_browser_view = new BrowserView({
            enablePreferredSizeMode: true
        })
        child.addBrowserView(dressing_browser_view)

        dressing_browser_view.setBounds({ x: 0, y: 0, height: 0, width: 0 })
        dressing_browser_view.setAutoResize({
            width: true, height: true
        });
        child.loadFile(`${path.join(app.getAppPath(), './Dressing/index.html')}`);
        dressing_browser_view.webContents.loadURL(`http://${current_server}.dwar.ru/user_iframe.php?group=2`)
        child.show();

        dressing_browser_view.webContents.executeJavaScript('art_alt').then(res => {
            console.log(res)
        })
    })

    ipcMain.on('new_tab', (evt, id) => {
        let browserView = new BrowserView({
            enablePreferredSizeMode: true
        })
        TabsController.addTab(id, browserView)
        TabsController.setupCurrent(id)
        mainWindow.setBrowserView(browserView)

        browserView.setBounds(mainWindow.getControlBounds())
        browserView.setAutoResize({
            width: true
        });
        mainWindow.setContentBounds(TabsController.currentTab())
        browserView.webContents.loadURL('https://google.com')
        mainWindow.webContents.send('url', 'https://google.com', id)
    })

    ipcMain.on('make_active', (evt, id) => {
        TabsController.setupCurrent(id)
        mainWindow.setBrowserView(TabsController.currentTab())
        mainWindow.webContents.send('url', TabsController.currentTab().webContents.getURL(), id)
    })

    ipcMain.on('remove_view', (evt, id) => {
        TabsController.deleteTab(id)
    })
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
