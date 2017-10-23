// Ajax获取数据的工厂函数
window.Xhrfactory = function () {
    this.xhr = null;
    this.init();
};
window.Xhrfactory.prototype = {
    // 初始化
    init: function () {
        this.create();
    },
    create: function () {
        // 创建请求对象
        if (window.XMLHttpRequest) {
            this.xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            this.xhr = new ActiveXObject('Msxml2.XMLHTTP');
        } else {
            this.xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        return this.xhr;
    },
    params: function (data) {
        // 处理查询参数
        var queryStr = '';
        if (data && Object.prototype.toString.call(data) === '[object Object]') {
            for (var key in data) {
                queryStr += key + '=' + data[key] + '&';
            }
        }
        return queryStr.substr(0, queryStr.length - 1);
    },
    readyState: function (callback) {
        // 判断请求状态
        this.xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                callback(this.responseText)
            }
        }
    },
    get: function (url, data, callback) {
        // 获取数据
        var newurl = url;
        if (arguments.length > 2) {
            newurl = url + '?' + this.params(data);
        } else {
            callback = data;
        }
        // console.log(newurl)
        this.xhr.open('get', newurl, true);
        this.readyState(callback);
        this.xhr.send(null);
    }
}

// ========================================================

// 本地存储的localStorage构造函数
window.LocalCacheSDK = function() {
    // 是否开启缓存, 默认开始
    this.cacheStatus = 'on';
    // 缓存的版本控制
    this.cacheVersion = 10000;
    // 是否需要手动清空所有缓存, 默认不清除
    this.clearCache = 'no';
}
window.LocalCacheSDK.prototype = {
    init: function(status, newVersion, clearCache) {
        this.cacheStatus = status || this.cacheStatus;
        this.cacheVersion = newVersion || this.cacheVersion;
        this.clearCache = clearCache || this.clearCache;
    },
    // 需要做缓存的文件资源列表
    resourceList: [],
    // 保存的SDK方法
    saveSDK: function(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch(e) {
            // console.log(e.name)
            if (e.name === 'QuotaExceededError') {
                localStorage.clear();
                localStorage.setItem(key, value);
            }
            // alert('QuotaExceededError');
        }
    },
    // 文件缓存到本地
    fileCacheToLocal: function() {
        var dataStr = '', _self = this;

        // 缓存版本号保存到本地
        localStorage.setItem('cacheVersion', this.cacheVersion);
        // var xhrObj = new Xhrfactory();
        if (this.isArray(this.resourceList)) {
            for (var i = 0,len = this.resourceList.length; i < len; i++) {
                /**
                 * 踩了一个小坑。。。
                 * 在URL变更后，会对当前正在执行的ajax进求进行中止操作,中止后该请求的状态码将为canceled;
                 * 所以不能放在外面实例化，要确保是每个对象都是独立的对象来调用.get()方法才行。
                 */
                (function(i){
                    var xhrObj = new Xhrfactory();
                    var file = _self.resourceList[i];
                    xhrObj.get(file.url, function(data) {
                        dataStr = _self.extends(file, {content: data})
                        // console.log(dataStr)
                        // 保存到本地
                        _self.saveSDK(file.url, JSON.stringify(dataStr));
                    })
                })(i)
            }
        } else if (this.isObject(this.resourceList)) {
            var xhrObj = new Xhrfactory();
            xhrObj.get(this.resourceList.url, function(data) {
                dataStr = _self.extends(_self.resourceList, {content: data})
                // 保存到本地
                _self.saveSDK(_self.resourceList.url, JSON.stringify(dataStr));
            })
        }
    },
    // 读取本地缓存的方法
    startUpLocalCache: function() {
        var _self = this;
        if (_self.clearCache !== 'no') {
            // 清空所有缓存
            localStorage.clear();
        }

        // 缓存为开启状态
        if (this.cacheStatus === 'on' && !this.isIEBrowser && window.localStorage) {
            // 封装读取本地缓存的内部函数
            var readLocalCache = function() {
                var cssCacheContent= '', jsCacheContent = '';
                for (var i = 0, len = localStorage.length; i < len; i++) {
                    var key = localStorage.key(i);
                    var fileResource = localStorage.getItem(key);
                    var fileResource = JSON.parse(fileResource);
                    // console.log(fileResource)
                    if (fileResource.type === 'style') {
                        // 如果是css类型的文件
                        cssCacheContent += fileResource.content;
                    } else if(fileResource.type === 'script') {
                        // 如果是js类型的文件
                        jsCacheContent += fileResource.content;
                    }
                }
                // 将css和js文件缓存内容分别插入到页面
                _self.addStyleEmbedded(cssCacheContent);
                _self.addScriptEmbedded(jsCacheContent);
            }

            // 判断是否需要更新缓存数据
            if (this.isNeedUpdate() === false) {
                // 不需要更新缓存
                readLocalCache();
            } else {
                // 需要更新缓存
                // console.log('需要更新缓存');
                // 先获取最新数据保存到本地
                this.fileCacheToLocal();
                readLocalCache();
            }

        } else {
            // 缓存为关闭状态，直接读取网络上的资源
            for (var i = 0, len = this.resourceList.length; i < len; i++){
                var fileResource = this.resourceList[i]
                if (fileResource.type === 'style') {
                    // 如果是css类型的文件
                    this.addStyleByLink(fileResource);
                } else if(fileResource.type === 'script') {
                    // 如果是js类型的文件
                    this.addScriptByLink(fileResource);
                }
            } 

        }
    },
    // 嵌入式方式添加css
    addStyleEmbedded: function(cacheContent) {
        var head = document.getElementsByTagName('head')[0];
        var style = head.getElementsByTagName('style')[0];
        if (style === undefined) {
            style = document.createElement('style');
        }

        // 在原有的基础上添加样式
        style.innerHTML = style.innerHTML + cacheContent;
        head.appendChild(style);
    },
    // 嵌入式方式添加script
    addScriptEmbedded: function(cacheContent) {
        var bodyEle = document.getElementsByTagName('body')[0];
        var scriptEle = document.createElement('script');
        scriptEle.setAttribute('type', 'text/javascript');

        // 把本地缓存的js脚本添加到页面
        scriptEle.innerHTML = cacheContent;
        bodyEle.appendChild(scriptEle);
    },
    // 外链方式添加css
    addStyleByLink: function(fileResource) {
        var head = document.getElementsByTagName('head')[0];

        // 创建链接追加到head标签中
        var linkEle = document.createElement('link');
        linkEle.setAttribute('type', 'text/css');
        linkEle.setAttribute('rel', 'stylesheet');
        linkEle.setAttribute('href', fileResource.url);
        head.appendChild(linkEle);
        // console.log(linkEle)
    },
    // 外链方式添加script
    addScriptByLink: function(fileResource) {
        var bodyEle = document.getElementsByTagName('body')[0];

        // 创建链接追加到head标签中
        var scriptEle = document.createElement('script');
        scriptEle.setAttribute('type', 'text/javascript');
        scriptEle.setAttribute('src', fileResource.url);
        bodyEle.appendChild(scriptEle);
        // console.log(scriptEle)
    },
    // 根据cache版本号判断是否需要更新缓存
    isNeedUpdate: function(){
        return localStorage.getItem('cacheVersion') !== this.cacheVersion.toString();
    },
    // 判断是否是IE浏览器
    isIEBrowser: (function() {
        // 方法一：
        var version = 3;
        var div = document.createElement('div');
        var all = div.getElementsByTagName('i');
        while (div.innerHTML = '<!-- [if gt IE' + (++version) + ']><i></i><![endif] -->', !all[0]) {
            if(version > 11){return false}
        }
        return version > 3 ? version : false;
        // 方法二：IE10及以下才有这个 'MSIE' 的存在
        // if (window.navigator.userAgent.indexOf("MSIE") > 0) {
        //     return true;
        // } else {
        //     return false;
        // } 
    })(),
    isArray: function(target) {
        if (target && Object.prototype.toString.call(target) === '[object Array]') {
            return true;
        }
        return false;
    },
    isObject: function(target) {
        if(target && Object.prototype.toString.call(target) === '[object Object]'){
            return true;
        }
        return false;
    },
    // 合并多个对象
    extends: function() {
        var target = {};
        if (arguments.length === 1 && this.isObject(arguments[0])) {
            target = arguments[0];
        } else if (arguments.length >= 2) {
            for (var i = 0, len = arguments.length; i < len; i++) {
                // // this.extends({name1: 'qq'}, ['a', 'b'], {name2: 'yiyi'}, ['hh', 'yy']);
                // 如果不是Object的跳出本次循环
                if (!this.isObject(arguments[i])) {
                    continue;
                }
                for (var key in arguments[i]) {
                    target[key] = arguments[i][key];
                }
            }
        }
        return target;
    }
}

var localCache = new LocalCacheSDK();
