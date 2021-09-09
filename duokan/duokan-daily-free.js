const DUOKAN_COOKIE_KEY = 'duokan_cookie'
const DUOKAN_DEVICE_ID_KEY = 'duokan_device_id'
const API_HOST = 'https://www.duokan.com'
const TASK_NAME = '多看阅读每日限免'
const $util = init()

dailyFreeBook()

function dailyFreeBook() {
    let cookieVal = $util.getdata(DUOKAN_COOKIE_KEY)
    let deviceId = $util.getdata(DUOKAN_DEVICE_ID_KEY)
    if (!cookieVal || !deviceId) {
        $util.msg(TASK_NAME, '⚠️ 请先获取 Cookie')
        $util.done({})
        return
    }
    message = ''
    getDailyFreeBookId(cookieVal, deviceId)
        .then(result => getDailyFreeBook(result, cookieVal, deviceId))
        .then(() => {
            $util.msg(TASK_NAME, `✅ 获取每日限免图书成功`, message)
            $util.done({})
        })
        .catch(() => {
            $util.msg(TASK_NAME, `⚠️ 获取每日限免图书失败, 详情请查看日志`, message)
            $util.done({})
        })
}

function getDailyFreeBookId(cookieVal, deviceId) {
    return new Promise((resolve, reject) => {
        let body = `features=%7B%22vip%22%3A1%7D&${signature(deviceId)}&withid=1`
        let options = {
            url: `${API_HOST}/hs/v4/channel/query/2027`,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
                Cookie: cookieVal
            },
            body: body
        }
        $util.post(options, (error, response, data) => {
            if (error) {
                $util.log(`获取限免图书信息失败，error：${error}`)
                reject(Error('获取每日限免图书信息失败'))
                return
            }
            let result = JSON.parse(data)
            if (result && result.result === 0 && result.items.length > 0) {
                let freeBook = result.items[0].data
                $util.log(`获取每日限免图书信息成功，response: ${JSON.stringify(freeBook)}`)
                message += `✅ 获取每日限免图书信息成功`
                resolve(freeBook)
            } else {
                $util.log(`获取限免图书信息失败，response: ${data}`)
                message += `⚠️ 获取每日限免图书信息失败`
                reject(Error('获取每日限免图书信息失败'))
            }
        })
    })
}

function getDailyFreeBook(freeBook, cookieVal, deviceId) {
    return new Promise((resolve, reject) => {
        let body = `payment_name=DC&&book_id=${freeBook.book_id}&price=0&allow_discount=1&${signature(deviceId)}&withid=1`
        let options = {
            url: `${API_HOST}/store/v0/payment/book/create`,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
                Cookie: cookieVal
            },
            body: body
        }
        $util.post(options, (error, response, data) => {
            if (error) {
                $util.log(`购买每日限免图书失败，error：${error}`)
                reject(Error('购买每日限免图书失败'))
                return
            }
            let result = JSON.parse(data)
            if (result && result.result === 0) {
                let freeBook = result.book
                $util.log(`购买每日限免图书成功，response: ${JSON.stringify(freeBook)}`)
                message += '\n✅ 购买每日限免图书成功'
                message += `\n书名：${freeBook.title}\n作者：${freeBook.authors}`
                resolve(freeBook)
            } else {
                $util.log(`购买每日限免图书失败，response: ${data}`)
                message += `\n⚠️ 购买每日限免图书失败，${result.msg}`
                reject(Error('购买每日限免图书失败'))
            }
        })
    })
}

function signature(deviceId) {
    let t = parseInt(new Date().getTime() / 1000)
    let c = 0
    for (char of `${deviceId}&${t}`) {
        c = (c * 131 + char.charCodeAt(0)) % 65536
    }
    return `_t=${t}&_c=${c}`
}

function init() {
    isSurge = () => {
        return undefined === this.$httpClient ? false : true
    }
    isQuanX = () => {
        return undefined === this.$task ? false : true
    }
    getdata = (key) => {
        if (isSurge()) return $persistentStore.read(key)
        if (isQuanX()) return $prefs.valueForKey(key)
    }
    setdata = (key, val) => {
        if (isSurge()) return $persistentStore.write(key, val)
        if (isQuanX()) return $prefs.setValueForKey(key, val)
    }
    msg = (title, subtitle, body) => {
        if (isSurge()) $notification.post(title, subtitle, body)
        if (isQuanX()) $notify(title, subtitle, body)
    }
    log = (message) => console.log(message)
    get = (url, cb) => {
        if (isSurge()) {
            $httpClient.get(url, cb)
        }
        if (isQuanX()) {
            url.method = 'GET'
            $task.fetch(url).then((resp) => cb(null, {}, resp.body))
        }
    }
    post = (url, cb) => {
        if (isSurge()) {
            $httpClient.post(url, cb)
        }
        if (isQuanX()) {
            url.method = 'POST'
            $task.fetch(url).then((resp) => cb(null, {}, resp.body))
        }
    }
    done = (value = {}) => {
        $done(value)
    }
    return {isSurge, isQuanX, msg, log, getdata, setdata, get, post, done}
}