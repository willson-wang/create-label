export function utilGetEleById(id) {
    return document.getElementById(id);
}

export function utilDialog(msg) {
    $("#dialog").length > 0 ? $("#dialog").remove() : void 0;
    var str = msg || "服务异常";
    var $div = $("<div id='dialog'></div>");
    $div.text(str);
    $div.dialog({
        autoOpen: true, //初次加载的时候是否显示，默认为true
        buttons: [
            {
                //添加按钮
                text: "确认",
                click: function() {
                    $(this).dialog("close");
                },
            },
            {
                text: "关闭",
                click: function() {
                    $(this).dialog("close");
                },
            },
        ],
        closeOnEscape: false,
        closeText: "hide", //设置关闭按钮的文本
        draggable: false, //是否可拖动   默认为true
        height: 200, //设置对话框的高度  默认为auto
        modal: true,
        hide: { effect: "fadeOut", duration: 300 }, //定义消失动画
        resizable: false, //是否可拖动默认为true
        show: { effect: "fadeIn", duration: 300 }, //出厂动画
        title: "系统提示", //定义标题内容
        beforeClose: function() {},
        close: function() {},
        open: function() {},
    });
}

export function utilOpenNewPage(url) {
    var a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("style", "display:none");
    a.setAttribute("target", "_self");
    document.body.appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
}

export function utilBrowserType() {
    const currentBrowser = (function() {
        var userAgent = navigator.userAgent;
        var isChrome =
                userAgent.indexOf("Chrome") > -1 &&
                userAgent.indexOf("Safari") > -1,
            isIE =
                userAgent.indexOf("compatible") > -1 &&
                userAgent.indexOf("MSIE") > -1 &&
                !isOpera,
            isEdge =
                userAgent.indexOf("Windows NT 6.1; Trident/7.0;") > -1 &&
                !isIE,
            isFF = userAgent.indexOf("Firefox") > -1,
            isOpera = userAgent.indexOf("Opera") > -1,
            isSafari =
                userAgent.indexOf("Safari") > -1 &&
                userAgent.indexOf("Chrome") == -1;
        if (isIE) {
            var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
            reIE.test(userAgent);
            var fIEVersion = parseFloat(RegExp["$1"]);
            if (fIEVersion == 7) {
                return "IE7";
            } else if (fIEVersion == 8) {
                return "IE8";
            } else if (fIEVersion == 9) {
                return "IE9";
            } else if (fIEVersion == 10) {
                return "IE10";
            } else if (fIEVersion == 11) {
                return "IE11";
            } else {
                return "0";
            } //IE版本过低
        }

        if (isFF) {
            return "FF";
        }
        if (isOpera) {
            return "Opera";
        }
        if (isSafari) {
            return "Safari";
        }
        if (isChrome) {
            return "Chrome";
        }
        if (isEdge) {
            return "Edge";
        }
    })();
    return currentBrowser;
}