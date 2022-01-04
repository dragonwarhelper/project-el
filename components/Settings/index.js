let loadedSettings = null
const userAgents = {
    default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    win10Firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0',
    win10Opera: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33',
    macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
    macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0'
}

document.addEventListener('DOMContentLoaded', () => {

    loadedSettings = window.myAPI.loadSettings()

    setupView()
    setupListeners()
})

function setupListeners() {

    document.getElementById('userAgents').addEventListener('change', () => {
        let selectedUserAgent = document.getElementById('userAgents').value
        loadedSettings.userAgentType = selectedUserAgent
        setupUserAgent()
    })

    document.getElementById('save').addEventListener('click', () => {
        const userAgentText = document.getElementById('userAgentText').value
        if(userAgentText.length == 0) {
            alert('User-Agent не может быть пустым!')
            return
        }
        const userAgentType = document.getElementById('userAgents').value
        const windowOpenNewTab = document.getElementById('windowOpenNewTab').checked
        const windowsAboveApp = document.getElementById('windowsAboveApp').checked
        const maximizeOnStart = document.getElementById('maximizeOnStart').checked

        const settings = {
            userAgentType,
            windowOpenNewTab,
            windowsAboveApp,
            userAgentText,
            maximizeOnStart
        }
        window.myAPI.saveSettings(settings)
        if(confirm('Для того что бы настройки вступили в силу, необходимо перезапустить клиент!')) {
            window.myAPI.restart()
        } else {
            console.log("AFTER")
        }
    })
}

function setupView() {
    setupCheckboxes()
    setupUserAgent()
}

function setupCheckboxes() {
    document.getElementById('windowsAboveApp').checked = loadedSettings?.windowsAboveApp
    document.getElementById('windowOpenNewTab').checked = loadedSettings?.windowOpenNewTab
    document.getElementById('maximizeOnStart').checked = loadedSettings?.maximizeOnStart
}

function setupUserAgent() {
    let selectedUserAgent = loadedSettings?.userAgentType ?? 'default'
    document.getElementById('userAgents').value = selectedUserAgent
    document.getElementById('userAgentText').value = selectedUserAgent == 'own' ? loadedSettings?.userAgentText : userAgents[selectedUserAgent]
    document.getElementById('userAgentText').disabled = selectedUserAgent != 'own'
}
