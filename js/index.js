function getCoords(el) {   // кроме IE8-
    var box = el.getBoundingClientRect();
    return {
        top: box.top + pageYOffset,
        left: box.left + pageXOffset
    };
}

function removeStyleClass(el) {
    el.classList.remove('arb-show-ok', 'arb-show-error');
}

function showError(el, text) {
    el.innerHTML = text || '';
    el.classList.add('arb-show-error');
    console.log(text)
}

function renderASBlock() {
    if (hidden) {
        return
    }
    const activeGroupsColor = [];
    const orderbookWidgets = Array.from(document.querySelectorAll('[data-widget-type="ORDERBOOK_WIDGET"]'));
    const tsWidgets = Array.from(document.querySelectorAll('[data-widget-type="SUBSCRIPTIONS_WIDGET"][data-jpt-type="TS"]'));
    const l2Widgets = Array.from(document.querySelectorAll('[data-widget-type="SUBSCRIPTIONS_WIDGET"][data-jpt-type="L2"]'));
    const dividendWidget = document.querySelector('div[data-widget-type="DIVIDENDS_WIDGET"]');

    if (tsWidgets.length === 0 || l2Widgets.length === 0) {
        hide();
        return;
    }
    Array.from(orderbookWidgets).forEach((orderbookWidget) => {
        let groupEl=orderbookWidget.querySelector('div[class^=packages-core-lib-components-GroupMenu-GroupMenu-icon]')
        const groupColor = groupEl.style.color;
        const realColor = getComputedStyle(groupEl).color;
        activeGroupsColor.push(groupColor);
        const divTiker = getArbDiv(groupColor);
        removeStyleClass(divTiker);
        try {
            const ticker = orderbookWidget.dataset.symbolId;
            const tsWidget = tsWidgets.find(el => el.querySelector(`div[class^=packages-core-lib-components-GroupMenu-GroupMenu-icon][style*="color: ${groupColor};"]`));
            console.log(`div[class^=packages-core-lib-components-GroupMenu-GroupMenu-icon][style*="color: ${groupColor};"]`)
            const l2Widget = l2Widgets.find(el => el.querySelector(`div[class^=packages-core-lib-components-GroupMenu-GroupMenu-icon][style*="color: ${groupColor};"]`));
            const order_container = orderbookWidget.querySelector('tbody');

            if (!order_container) {
                showError(divTiker, `Недоступен стакан ${ticker}`);
                return false;
            }
            if (!l2Widget) {
                showError(divTiker, `Недоступен US стакан ${ticker}`);
                return false;
            }
            const bid = l2Widget.querySelector('td.jpt-l2-bid');
            const ask = l2Widget.querySelector('td.jpt-l2-ask');

            if (!tsWidget) {
                showError(divTiker, `Недоступна US лента принтов ${ticker}`);
                return false;
            }

            const div_container = dividendWidget && dividendWidget.querySelector(`tr[data-symbol-id="${ticker}"]`);
            let spb_price = order_container.length === 2 ? orderbookWidget.querySelector('tbody tr:last-child').dataset.value :
                orderbookWidget.querySelectorAll('td')[1].innerText.split("\n").last().replace(",", ".");
            if (!bid || !ask) {
                showError(divTiker, `Недоступен us bid/ask ${ticker}`);
                return false;
            }
            let us_price_bid = +parseFloat(bid.dataset.jptPrice).toFixed(2);
            let us_price_ask = +parseFloat(ask.dataset.jptPrice).toFixed(2);
            let us_price_avg = null;
            let close_price = tsWidget.querySelector('.jpt-ts-print-close td');
            let div_block = null;
            if (div_container) {
                let div_td = div_container.querySelectorAll('td');
                let div_perc = div_td[1].textContent.replace(" ", '').replace(",", '.')
                let div_date = div_td[4].textContent.split(" ").slice(0, 2).join(' ')
                div_block = `${div_perc}/${div_date}`
            }

            if (close_price) {
                close_price = close_price.textContent;
            } else {
                showError(divTiker, `Не найден принт оф.закрытия в виджете. ${ticker}`)
                return false;
            }
            spb_price = +parseFloat(spb_price).toFixed(2);
            us_price_avg = +parseFloat((us_price_ask + us_price_bid) / 2).toFixed(2);
            close_price = +parseFloat(close_price).toFixed(2);

            let us_perc = (us_price_bid / spb_price * 100 - 100).toFixed(2)
            let us_avg_perc = (us_price_avg / spb_price * 100 - 100).toFixed(2)
            let close_perc = ((close_price / spb_price) * 100 - 100).toFixed(2)

            let us_perc_obj = document.createElement('span')
            us_perc_obj.textContent = `${us_perc}%`
            if (us_price_bid > spb_price) {
                us_perc_obj.style.color = 'green';
            } else if (us_price_bid < spb_price) {
                us_perc_obj.style.color = 'red';
            }

            let us_perc_avg_obj = document.createElement('span')
            us_perc_avg_obj.textContent = `${us_avg_perc}%`
            if (us_price_avg > spb_price) {
                us_perc_avg_obj.style.color = 'green';
            } else if (us_price_avg < spb_price) {
                us_perc_avg_obj.style.color = 'red';
            }

            let close_perc_obj = document.createElement('span')
            close_perc_obj.textContent = `${close_perc}%`
            if (close_price > spb_price) {
                close_perc_obj.style.color = 'green';
            } else if (close_price < spb_price) {
                close_perc_obj.style.color = 'red';
            }

            divTiker.innerHTML = genHTML({
                ticker,
                spb_price,
                us_price_bid,
                us_perc_obj: us_perc_obj.outerHTML,
                us_price_avg,
                us_perc_avg_obj: us_perc_avg_obj.outerHTML,
                close_price,
                close_perc_obj: close_perc_obj.outerHTML,
                div_block,
                realColor
            })

            if (spb_price < close_price && (spb_price < us_price_bid || spb_price < us_price_avg)) {
                divTiker.classList.add('arb-show-ok');
            }
        } catch (e) {
            console.error(e)
            showError(divTiker, e);
        }
    })
    document.querySelectorAll('.arb-show').forEach(el => {
        if (!activeGroupsColor.includes(el.dataset.colorGroup)) {
            el.parentElement.removeChild(el);
        }
    })
}

function genHTML({
                     ticker,
                     spb_price,
                     us_price_bid,
                     us_perc_obj,
                     us_price_avg,
                     us_perc_avg_obj,
                     close_price,
                     close_perc_obj,
                     div_block,
                     realColor
                 }) {
    return `
<div id="as-ticker-block" style="background-color: ${realColor}"><span>${ticker}</span></div>
<div id="as-prices-block">
<table>
<tr>
<td>SPB</td><td>${spb_price}</td><td></td>
</tr>
<tr>
<td>US</td><td>${us_price_bid}</td><td>${us_perc_obj}</td>
</tr>
<tr>
<td style="text-decoration: overline">US</td><td>${us_price_avg}</td><td>${us_perc_avg_obj}</td>
</tr>
<tr>
<td>CLS</td><td>${close_price}</td><td>${close_perc_obj}</td>
</tr>${div_block ? `<tr><td>DIV</td><td colspan="2">${div_block}</td></tr>` : ''}
</table>
</div>`;
}

let hidden = JSON.parse(localStorage.getItem("arb-show-hidden"));
let positions = JSON.parse(localStorage.getItem("arb-show-positions"));

if (hidden === null) {
    localStorage.setItem("arb-show-hidden", false);
}

if (positions === null) {
    positions = {};
    localStorage.setItem("arb-show-positions", JSON.stringify(positions));
}

const arbDivs = [];

function toggleBlock() {
    hidden = !hidden;
    localStorage.setItem("arb-show-hidden", hidden);
    if (hidden) {
        hide();
    }
}

function getArbPos(colorGroup) {
    return positions[colorGroup] || {x: 0, y: 100};
}

function saveArbPos(colorGroup, coords) {
    positions[colorGroup] = coords;
    localStorage.setItem("arb-show-positions", JSON.stringify(positions));
}

function hide(){
    arbDivs.forEach(el => el.parentElement && el.parentElement.removeChild(el))
}

function getArbDiv(colorGroup) {
    let arbDiv = arbDivs.find(el => el.dataset.colorGroup === colorGroup);
    if (!arbDiv) {
        const pos = getArbPos(colorGroup)
        arbDiv = document.createElement('div')
        arbDiv.dataset.colorGroup = colorGroup;
        arbDiv.classList.add('arb-show');
        arbDiv.onmousedown = function (e) {
            const coords = getCoords(arbDiv);
            const shiftX = e.pageX - coords.left;
            const shiftY = e.pageY - coords.top;

            arbDiv.style.position = 'absolute';
            document.body.appendChild(arbDiv);
            moveAt(e);

            arbDiv.style.zIndex = 1000; // над другими элементами

            function moveAt(e) {
                arbDiv.style.left = e.pageX - shiftX + 'px';
                arbDiv.style.top = e.pageY - shiftY + 'px';
            }

            document.onmousemove = function (e) {
                moveAt(e);
            };

            arbDiv.onmouseup = function () {
                const {left: x, top: y} = getCoords(arbDiv);
                saveArbPos(colorGroup, {x, y})
                document.onmousemove = null;
                arbDiv.onmouseup = null;
            };
        }
        if (pos) {
            arbDiv.style.left = `${pos.x > window.innerWidth || pos.x < 0 ? 0 : pos.x}px`;
            arbDiv.style.top = `${pos.y > window.innerHeight || pos.y < 0 ? 100 : pos.y}px`;
        }
        arbDiv.ondragstart = function () {
            return false;
        };

        arbDivs.push(arbDiv)
    }
    if (!document.body.contains(arbDiv)) {
        document.body.append(arbDiv);
    }
    return arbDiv;
}

// Конфигурация observer (за какими изменениями наблюдать)
const configAS = {
    attributes: false,
    childList: true,
    subtree: true
};

if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
}

// Колбэк-функция при срабатывании мутации
let observeTimerAS;
const callbackAS = function (mutationsList, observer) {
    clearTimeout(observeTimerAS)
    observeTimerAS = setTimeout(function () {
        renderASBlock();
    }, 50)
};


// Создаём экземпляр наблюдателя с указанной функцией колбэка
const observerAS = new MutationObserver(callbackAS);
// Начинаем наблюдение за настроенными изменениями целевого элемента
observerAS.observe(document.querySelector('div#root'), configAS);
