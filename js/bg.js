let isTinkoffPage=false;

chrome.browserAction.onClicked.addListener(function (tab) {
    console.log(isTinkoffPage)
    if(isTinkoffPage){
        chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            let tabId=tabs[0].id
            console.log(tabId)
            chrome.tabs.executeScript(tabId,{code:"toggleBlock();"}) ;
        });
    }
});


function randomTitle(){
    let titles=[
        'Первое правило Лосефермы: никому не рассказывать о Лосеферме!',
        'Второе правило Лосефермы: НИКОМУ не рассказывать о Лосеферме!',
        'Ave Loseferma!',
        "Follow Sarepta's owner.",
        'Купил дешево, продал дорого - разве так сложно?',
        'Никогда никогда не вернется в TSLA по $50.',
        'Папа не шорти.',
        'Не забывайте донатить.',
        'Зафиксировал убыток, зарезал прибыль.',
        'Жмём обе педали и врываемся в ОС!',
        'Взял KVAS в лонг. Позже докуплю.'
    ]

    let title=titles[Math.floor(Math.random()*titles.length)];
    chrome.browserAction.setTitle({title :title});
}
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    enDisIcon(tab.url,tabId);
    randomTitle()
})
chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        let url = tabs[0].url;
        enDisIcon(url,activeInfo.tabId);
        randomTitle()
    });
})

function enDisIcon(url,tabId) {
    if(url=='') {
       hideIcon(tabId)
    } else {
        url = new URL(url)
        if (url.host === 'www.tinkoff.ru' && url.pathname === '/terminal/') {
           showIcon(tabId)
        } else {
            hideIcon(tabId)
        }
    }
}

function hideIcon(tabId){
    chrome.browserAction.disable(tabId);
    isTinkoffPage = false;
}

function showIcon(tabId){
    chrome.browserAction.enable(tabId);
    isTinkoffPage = true;
}