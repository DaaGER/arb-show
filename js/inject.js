function injectScript(name){
    let s = document.createElement('script');
    s.src = chrome.runtime.getURL(name);
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

injectScript("js/index.js")