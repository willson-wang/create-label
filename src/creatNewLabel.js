import { utilGetEleById, utilDialog, utilOpenNewPage } from "./utils";
import { utilPostAjax } from "./utils/ajax";
import base64 from "./utils/base64";
import Base from "./base";

const requestObj = {
    bill_type: "1",
    specs: "1",
    name: "xiaoming",
};

//创建label构造函数
class CreatNewLabel extends Base {
    constructor(options) {
        super(options);
        this.options = options || {};
        this.clientWidth = $(window).width(); //屏幕宽度
        this.clientHieght = $(window).height(); //屏幕高度
        this.currentEle = null; //保存标签中选中的元素
        this.printViewPath = null; //保存成功之后的预览地址
        this.templateId = null;
        this.isSaveCloseFlag = null; //点击保存关闭的flag
        if (!window.location.origin) {
            //ie10下为undefined
            this.baseUrl =
                window.location.protocol + "//" + window.location.host;
        } else {
            this.baseUrl = window.location.origin;
        }

        this.currentBrowser = null;

        this.defaultBarcode = {
            barWidth: 1,
            barHeight: 30,
            showHRI: false,
        };

        this.eventsMap = {
            "click .ui-label-content-title": "menutitleclick", //左侧tab切换
            "click .ui-label-tab-menu": "menuTabclick", //右侧tab切换
            click: "pannelClick", //显示隐藏右侧菜单
            "click .ui-lable-clearInnerHtml": "clearInnerHtml", //清空画布
            "click .ui-lable-printView": "printView", //打印预览
            "click .ui-lable-saveInnerHtml": "saveInnerHtml", //保存模板
            "click .ui-lable-saveAndClose": "saveInnerHtmlAndClose", //保存并关闭模板
            "change .ui-label-tab-content": "changeEleStyle", //左侧此单改变标签内元素样式
            "click .ui-label-tab-copy button:first-of-type": "copyDragEleClick", //右侧菜单复制元素
            "click .ui-label-tab-copy button:last-of-type": "deleDragEleClick", //右侧菜单删除元素
            "click .ui-label-hotkey-panel>a": "closeRightControlPannel", //关闭右侧控制面板及键盘提示面板
            "change #localImg": "previewLocalImg", // 选择本地图片预览
            "keyup .double-bind": "bindTextToDragEle", // 更改自定义文本
            "click #tabs_styles .wms-styles-plus": "plusLineXyWh", // 增加水平线or垂直线的宽高
            "click #tabs_styles .wms-styles-count": "countLineXyWh", // 减少宽or高
            "click #tabs_styles .wms-styles-all": "setLineXyAll", // 恢复百分百
            "keyup #tabs_table_content textarea": "bindTextToTableDragEle", //单向绑定文本
            "click .wms-custom-table-add-del-row": "addOrDelCustomTableRow", //自定义表格删除or添加行
        };

        this.switchCfg = {
            //switch匹配项
            lineX: "line_x",
            lineY: "line_y",
            textCustom: "text_custom",
            localImg: "local_img",
            barcode: "barcode",
            tableHs: "table_hs",
            tableCustom: "table_custom",
            recipientAddress: "recipient_address",
            normalInfo: "normal_info",
            date: "date",
            picture: "picture",
        };
        this.switchCfgTitle = {
            //switch匹配项
            lineX: "水平线",
            lineY: "垂直线",
            textCustom: "自定文本",
            localImg: "本地图片",
            barcode: "条形码编辑",
            tableHs: "报关物品",
            tableCustom: "自定义表格",
            recipientAddress: "收件人地址",
            normalInfo: "标题名称",
            date: "日期",
            picture: "图片",
        };

        this.initializeElements(CreatNewLabel.Eles); //初始化获取所有元素

        this.initialization(); //初始化方法入口
    }

    positionCenter(ele) {
        var eleWidth = ele.width(),
            eleHeight = ele.height();
        ele.css({
            left: (this.clientWidth - eleWidth) / 2 + "px",
            top: (this.clientHieght - eleHeight) / 2 + "px",
        });
    }

    resizeChangeCenter(ele) {
        var timer = null,
            width = null,
            height = null,
            eleWidth = ele.width(),
            eleHeight = ele.height(),
            $window = $(window);
        $window.on("resize", function() {
            clearTimeout(timer);
            timer = setTimeout(function() {
                width = $window.width();
                height = $window.height();
                ele.css({
                    left: (width - eleWidth) / 2 + "px",
                    top: (height - eleHeight) / 2 + "px",
                });
            }, 500);
        });
    }

    leaveCurrentPageTips() {
        $(window).on("beforeunload", function(e) {
            e.preventDefault();
            return "确定离开此页面吗?";
        });
    }

    menutitleclick(e) {
        var $target = $(e.target),
            $i = $target.find("i"),
            $titleIconEle = this.menuTitle.find("i");
        this.menuTitle.removeClass("ui-title-active");
        $titleIconEle.removeClass("fa-chevron-up");
        $titleIconEle.addClass("fa-chevron-down");

        $target.addClass("ui-title-active");

        if ($target.next().hasClass("ui-menu-active")) {
            $i.addClass("fa-chevron-down");
            $i.removeClass("fa-chevron-up");
        } else {
            $i.removeClass("fa-chevron-down");
            $i.addClass("fa-chevron-up");
        }

        $target
            .parent()
            .siblings()
            .find("ul")
            .removeClass("ui-menu-active");
        $target.next().toggleClass("ui-menu-active");
    }

    menuTabclick(e) {
        var target = e.target,
            tabContent;
        if (target.nodeName == "A") {
            tabContent = utilGetEleById($(target).data("tab_id"));
            this.menuTabList.removeClass("active");
            target.parentNode.className = "active";

            this.menuTabContent.removeClass("active-tab");
            $(tabContent).addClass("active-tab");
        }
    }

    pannelClick(e) {
        var target = e.target,
            type =
                $(target).data("ele") ||
                $(target)
                    .parents(".drag-item")
                    .data("ele"); //获取当前点击元素的类型

        if (
            $(target).closest(".ui-label-right-opration").length == 0 &&
            $(target).closest(".drag-item").length == 0
        ) {
            this.opration.removeClass("active-move");
            this._rightMenuContentHidden();
        } else {
            if (type) {
                this.currentEle &&
                    this.currentEle.removeClass("active-drag-ele"); //移除上一个元素的激活状态样式
                this.currentEle = null;
                this.currentEle = $(target).hasClass("drag-item")
                    ? $(target)
                    : $(target).parents(".drag-item");

                this._rightMenuContentHidden(); //比免同时点击可显示元素出现重叠
                this.currentEle.addClass("active-drag-ele");
                this.hotKeyPannel.addClass("active-keybord");
                this._keyMove();
                this._swichRightMenu(type);
                this._showDefalutValue(type); //显示下拉选项及复选框的默认值
                this.opration.addClass("active-move");
            }
        }
    }

    clearInnerHtml() {
        this.contentDiv.empty();
        this._clearForbidSecondDrag();
    }

    printView(e) {
        if (!this.printViewBtn.hasClass("print-active-green")) return;
        if (!this.templateId) {
            utilDialog("保存之后才能预览");
            return;
        }
        e.preventDefault();
        e.returnValue = false;
        window.open(
            this.baseUrl +
                "/express/bill/view_express?template_id=" +
                this.templateId,
            "_blank"
        );
        return false;
    }

    saveInnerHtml(e) {
        if (!this.saveInnerHtmlBtn.hasClass("print-active-green")) return;
        //获取表单元素
        if (!this.contentDiv.find(".drag-item").length) {
            utilDialog("模板内容不能为空");
            return;
        }

        var contentDivWrapMain = this.contentDivWrapMain.clone();
        contentDivWrapMain
            .find(".ui-label-content-pannel")
            .css({ left: 0, top: 0 });
        var $labelhtml = contentDivWrapMain
            .find(".drag-item")
            .removeClass("ui-resizable,ui-draggable")
            .end()
            .find(".ui-resizable-handle")
            .remove()
            .end()
            .html();
        this.inputHtml.val(base64().encode($labelhtml));

        this.saveInnerHtmlBtn.removeClass("print-active-green");
        if (this.templateId) {
            utilPostAjax(
                this.baseUrl + "/express/bill/update",
                this.labelForm.serialize(),
                this.changeInnerHtmlSucc.bind(this)
            );
        } else {
            utilPostAjax(
                this.baseUrl + "/express/bill/create",
                this.labelForm.serialize(),
                this.saveInnerHtmlSucc.bind(this)
            );
        }
        e.preventDefault();
        e.returnValue = false;
        return false;
    }

    saveInnerHtmlAndClose() {
        this.isSaveCloseFlag = true;
        this.saveInnerHtml();
    }

    changeEleStyle(e) {
        var target = e.target,
            currentTarget = e.currentTarget,
            type = $(currentTarget).data("type"),
            styles = $(target).data("style"), //判断设置哪种样式
            text = $(target).attr("data-text"); //判断文本内容类型

        switch (type) {
            case "tabs_content": //
                if (target.nodeName === "SELECT") {
                    this.currentEle.css(styles, target.value);
                    this._isTipsShow(target, styles);
                } else {
                    this.currentEle.find("span").text(target.value);
                }
                break;
            case "tabs_comprehensive": //综合
                this._changeComprehensiveEleStyle(target, styles, text);
                break;
            case "tabs_border": //边框定义
                this._changeBorderEleStyle(target, styles);
                break;
            case "tabs_custom": //自定义文本
                if (target.nodeName === "SELECT") {
                    this.currentEle.css(styles, target.value);
                    this._isTipsShow(target, styles);
                }
                break;
            case "tabs_table": //表格
                this._changeTableHsEleStyle(target, styles);
                break;
            case "tabs_styles": //水平线与垂直线
                this._changeLineXyEleStyle(target, styles);
                break;
            case "tabs_barcode": //条形码设置
                this._changeBarcodeEleStyle(target, styles);
                break;
            case "tabs_font": //地址信息设置
                this._changeFontEleStyle(target, styles);
                break;
            case "tabs_title": //标题信息设置
                this._changeTitleEleStyle(target, styles);
                break;
            case "tabs_date": //日期信息设置
                this._changeDateEleStyle(target, styles);
                break;
            case "tabs_table_content": //表格内容设置
                this._changeTableContentEleStyle(target, styles);
                break;
            case "tabs_table_custom": //自定义表格内容设置
                this._changeTableCustomEleStyle(target, styles, text);
                break;
        }
    }

    _changeBorderEleStyle(target, styles) {
        if (target.nodeName === "SELECT") {
            this.currentEle.css(styles, target.value);
        } else if (target.nodeName === "INPUT") {
            $(target)
                .parents("li")
                .find("select")
                .prop("disabled", !$(target).prop("checked"))
                .val("0px");
            switch (target.className) {
                case "wms-show-boder-top":
                    this.currentEle.css({
                        "border-top": "0 solid #000",
                        "padding-top": "0",
                    });
                    break;
                case "wms-show-boder-bottom":
                    this.currentEle.css({
                        "border-bottom": "0 solid #000",
                        "padding-bottom": "0",
                    });
                    break;
                case "wms-show-boder-left":
                    this.currentEle.css({
                        "border-left": "0 solid #000",
                        "padding-left": "0",
                    });
                    break;
                case "wms-show-boder-right":
                    this.currentEle.css({
                        "border-right": "0 solid #000",
                        "padding-right": "0",
                    });
                    break;
            }
        }
    }

    _changeComprehensiveEleStyle(target, styles, text) {
        if (target.nodeName === "SELECT") {
            this.currentEle.css(styles, target.value);
            this._isTipsShow(target, styles);
        } else if (
            target.nodeName === "INPUT" ||
            target.nodeName === "TEXTAREA"
        ) {
            if (text === "wms-person-country-en") {
                this.currentEle
                    .find("." + text)
                    .html(
                        target.value +
                            "<strong class='wms-person-country-cn'>" +
                            this.currentEle
                                .find(".wms-person-country-cn")
                                .text() +
                            "</strong>" +
                            "    "
                    );
            } else {
                this.currentEle.find("." + text).text(target.value + "    ");
            }
        }
    }

    _changeTableCustomEleStyle(target, styles, text) {
        if (target.nodeName === "SELECT") {
            this.tabsTableCustomPannelTbfEle.attr(
                "data-text",
                "wms-tbody-row" + target.value + "-first"
            );
            this.tabsTableCustomPannelTbfEle.val(
                this.currentEle
                    .find(".wms-tbody-row" + target.value + "-first")
                    .text()
            );
            this.tabsTableCustomPannelTbsEle.attr(
                "data-text",
                "wms-tbody-row" + target.value + "-second"
            );
            this.tabsTableCustomPannelTbsEle.val(
                this.currentEle
                    .find(".wms-tbody-row" + target.value + "-second")
                    .text()
            );
            this.tabsTableCustomPannelTbtEle.attr(
                "data-text",
                "wms-tbody-row" + target.value + "-three"
            );
            this.tabsTableCustomPannelTbtEle.val(
                this.currentEle
                    .find(".wms-tbody-row" + target.value + "-three")
                    .text()
            );
        } else if (target.nodeName === "TEXTAREA") {
            this.currentEle.find("." + text).text(target.value);
        }
    }

    _changeTableContentEleStyle(target) {
        if (target.nodeName === "INPUT") {
            switch (target.className) {
                case "wms-sku-name-cn":
                    if ($(target).prop("checked")) {
                        this.currentEle
                            .find("tbody .wms-sku-name-cn")
                            .css("display", "inline");
                    } else {
                        this.currentEle
                            .find("tbody .wms-sku-name-cn")
                            .css("display", "none");
                    }
                    break;
                case "wms-sku-name-en":
                    if ($(target).prop("checked")) {
                        this.currentEle
                            .find("tbody .wms-sku-name-en")
                            .css("display", "inline");
                    } else {
                        this.currentEle
                            .find("tbody .wms-sku-name-en")
                            .css("display", "none");
                    }
                    break;
                case "wms-sku":
                    if ($(target).prop("checked")) {
                        this.currentEle
                            .find("tbody .wms-sku")
                            .css("display", "inline");
                    } else {
                        this.currentEle
                            .find("tbody .wms-sku")
                            .css("display", "none");
                    }
                    break;
                case "wms-sku-qty":
                    if ($(target).prop("checked")) {
                        this.currentEle
                            .find("tbody .wms-sku-qty")
                            .css("display", "inline");
                    } else {
                        this.currentEle
                            .find("tbody .wms-sku-qty")
                            .css("display", "none");
                    }
                    break;
                case "wms-tfoot":
                    if ($(target).prop("checked")) {
                        this.currentEle
                            .find("tfoot tr:first-of-type")
                            .css("display", "");
                    } else {
                        this.currentEle
                            .find("tfoot tr:first-of-type")
                            .css("display", "none");
                    }
                    $(target)
                        .parents("li")
                        .find("textarea")
                        .prop("disabled", !$(target).prop("checked"));
                    break;
            }
        }
    }

    _changeDateEleStyle(target, styles) {
        var $span = this.currentEle.find("span"),
            time = $span.data("timer"),
            str = null;
        if (target.nodeName === "SELECT") {
            switch (styles) {
                case "date-format":
                    // $span.text($span.text().replace(eval('/' + divide + ' / g '), target.value));
                    str = $span.text().replace(/[^0-9]/gi, "");
                    $span.text(
                        str.substr(0, 4) +
                            target.value +
                            str.substr(4, 2) +
                            target.value +
                            str.substr(-2)
                    );
                    $span.attr("data-divide", target.value);
                    break;
                case "text-align":
                    this.currentEle.css(styles, target.value);
                    break;
                case "font-family":
                case "font-size":
                case "line-height":
                case "font-weight":
                    $span.css(styles, target.value);
                    this._isTipsShow(target, styles);
                    break;
            }
        } else if (target.nodeName === "INPUT") {
            if ($(target).prop("checked")) {
                $span.text(time);
            } else {
                $span.text($span.text().slice(5));
            }
        }
    }

    _changeTitleEleStyle(target, styles) {
        var $strong = this.currentEle.find("strong");
        if (target.nodeName === "SELECT") {
            $strong.css(styles, target.value);
            this._isTipsShow(target, styles);
        } else if (target.nodeName === "INPUT") {
            switch (target.className) {
                case "wms-show-title":
                    if ($(target).prop("checked")) {
                        $strong.css("display", "inline");
                    } else {
                        $strong.css("display", "none");
                    }

                    this.tabsTitlePannelSlEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelFfEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelFsEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelFwEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelLhEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelPbEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelTaEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelTcEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );

                    break;
                case "form-control wms-title-content":
                    $strong.text(target.value);
                    break;
                case "wms-show-line":
                    if ($(target).prop("checked")) {
                        this.tabsTitlePannelWcEle.css("display", "block");
                        $strong.css("display", "block");
                    } else {
                        this.tabsTitlePannelWcEle.css("display", "none");
                        $strong.css("display", "inline");
                    }
                    this.tabsTitlePannelTaEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    this.tabsTitlePannelPbEle.prop(
                        "disabled",
                        !$(target).prop("checked")
                    );
                    break;
            }
        }
    }

    _changeFontEleStyle(target) {
        var $span = null,
            activeClass = target.className,
            self = this;
        if (activeClass === "wms-person-inline-block") {
            $span = this.currentEle.find("span:visible");
            if ($(target).prop("checked")) {
                $span.css("display", "block");
            } else {
                $span.css("display", "inline");
            }
        } else {
            $span = this.currentEle.find("span");
            if ($(target).prop("checked")) {
                $span.each(function(index, item) {
                    if (activeClass === item.className) {
                        if (self.tabsFontPannelPibEle.prop("checked")) {
                            $(item).css("display", "block");
                        } else {
                            $(item).css("display", "inline");
                        }

                        return;
                    }
                });
                if (activeClass === "wms-person-country-en") {
                    this.tabsFontPannelPcnEl.prop(
                        "checked",
                        $(target).prop("checked")
                    );
                    this.currentEle
                        .find(".wms-person-country-cn")
                        .css("display", "inline");
                }
                if (
                    this.tabsFontPannelPceEle.prop("checked") &&
                    activeClass === "wms-person-country-cn"
                ) {
                    this.currentEle
                        .find(".wms-person-country-cn")
                        .css("display", "inline");
                }
            } else {
                $span.each(function(index, item) {
                    if (activeClass === item.className) {
                        $(item).css("display", "none");
                        return;
                    }
                });
                if (activeClass === "wms-person-country-en") {
                    this.tabsFontPannelPcnEl.prop(
                        "checked",
                        $(target).prop("checked")
                    );
                }
                if (
                    this.tabsFontPannelPceEle.prop("checked") &&
                    activeClass === "wms-person-country-cn"
                ) {
                    this.currentEle
                        .find(".wms-person-country-cn")
                        .css("display", "none");
                }
            }
        }
    }

    _changeBarcodeEleStyle(target, styles) {
        var $barcode = this.currentEle.find(".wms-barcode"),
            $barcodeHelp = this.currentEle.find(".wms-barcode-helper"),
            barcodeNum = $barcode.data("barcodenum"),
            activeBarcode = JSON.parse($barcode.attr("data-barcodeopt"));
        if (target.nodeName === "SELECT") {
            //右对齐
            switch (styles) {
                case "text-align":
                case "font-size":
                case "font-weight":
                    $barcodeHelp.css(styles, target.value);
                    break;
                case "width":
                    activeBarcode.barWidth = target.value;
                    $barcode
                        .empty()
                        .barcode(barcodeNum, "code128", activeBarcode);
                    $barcode.attr(
                        "data-barcodeopt",
                        JSON.stringify(activeBarcode)
                    );
                    break;
            }
        } else if (target.nodeName === "INPUT") {
            if (target.type == "checkbox") {
                $barcodeHelp.css(
                    "display",
                    $(target).prop("checked") ? "block" : "none"
                );
                $(target)
                    .parents("ul")
                    .find("select")
                    .prop("disabled", !$(target).prop("checked"));
                $(target)
                    .parents("ul")
                    .find("input[type='text']")
                    .prop("disabled", !$(target).prop("checked"));
            } else {
                $barcodeHelp.text(target.value + activeBarcode.text);
            }
        }

        // this._transformationImg(this.currentEle, "barcode");
    }

    _changeLineXyEleStyle(target, styles) {
        var lineXyType = this.currentEle.data("ele"), //区分水平线or垂直线
            lineXyValue = null; //水平线or垂直线的宽高
        if (target.nodeName === "SELECT") {
            this.currentEle.css(styles, target.value);
        } else if (target.nodeName === "INPUT") {
            lineXyValue = parseInt(this.tabsStylesPannelWhEle.val());

            if (lineXyValue < 20) {
                lineXyValue = 20;
            } else if (lineXyValue < 365) {
                lineXyValue = lineXyValue;
            } else {
                lineXyValue = 365;
            }

            if (lineXyType === this.switchCfg.lineX) {
                this.currentEle.css("width", lineXyValue);
            } else {
                this.currentEle.css("height", lineXyValue);
            }
        }
    }

    _changeTableHsEleStyle(target, styles) {
        if (target.nodeName === "SELECT") {
            if (styles === "font-family") {
                if ($(target).hasClass("wms-thead-font-family")) {
                    this.currentEle.find("thead").css(styles, target.value);
                } else if ($(target).hasClass("wms-tbody-font-family")) {
                    this.currentEle.find("tbody").css(styles, target.value);
                } else {
                    this.currentEle.find("tfoot").css(styles, target.value);
                }
            } else {
                if ($(target).hasClass("wms-thead-font-size")) {
                    this.currentEle.find("thead").css(styles, target.value);
                } else if ($(target).hasClass("wms-tbody-font-size")) {
                    this.currentEle.find("tbody").css(styles, target.value);
                } else {
                    this.currentEle.find("tfoot").css(styles, target.value);
                }
                this._isTipsShow(target, styles);
            }
        } else if (target.nodeName === "INPUT") {
            if (target.className === "wms-table-border") {
                if ($(target).prop("checked")) {
                    this.currentEle
                        .find("th")
                        .css("border", "1px solid #000")
                        .end()
                        .find("td")
                        .css("border", "1px solid #000");
                } else {
                    this.currentEle
                        .find("th")
                        .css("border", 0)
                        .end()
                        .find("td")
                        .css("border", 0);
                }
            } else if (target.className === "wms-table-header") {
                if ($(target).prop("checked")) {
                    this.currentEle.find("thead").css("display", ""); //注意表格元素的display属性，不能使用block
                } else {
                    this.currentEle.find("thead").css("display", "none");
                }
                $(target)
                    .parents("li")
                    .find("select")
                    .prop("disabled", !$(target).prop("checked"));
            } else {
                if ($(target).prop("checked")) {
                    this.currentEle.find("tfoot").css("display", ""); //注意表格元素的display属性，不能使用block
                } else {
                    this.currentEle.find("tfoot").css("display", "none");
                }
                $(target)
                    .parents("li")
                    .find("select")
                    .prop("disabled", !$(target).prop("checked"));
            }
        }
    }

    saveInnerHtmlSucc(data) {
        if (data.status) {
            utilDialog("保存成功");
            this.printViewPath = data.data.template_path;
            this.templateId = data.data.template_id;
            this.printViewBtn.addClass("print-active-green");
            this.inputTplIdEle.val(data.data.template_id);
        } else {
            utilDialog(data.errorMess || "保存失败");
        }
        this.saveInnerHtmlBtn.addClass("print-active-green");

        if (this.isSaveCloseFlag) {
            utilOpenNewPage(this.baseUrl);
        }
    }

    changeInnerHtmlSucc(data) {
        if (data.status) {
            utilDialog("修改成功");
            this.printViewPath = data.data.template_path;
            this.printViewBtn.addClass("print-active-green");
        } else {
            utilDialog(data.errorMess || "修改失败");
        }

        this.saveInnerHtmlBtn.addClass("print-active-green");

        if (this.isSaveCloseFlag) {
            utilOpenNewPage(this.baseUrl);
        }
    }

    copyDragEleClick() {
        if (!this.currentEle) return;
        var currentEle = this.currentEle.hasClass("drag-item")
                ? this.currentEle
                : this.currentEle.parents(".drag-item"),
            copyCurrentEle = currentEle
                .clone()
                .find(".ui-resizable-handle")
                .remove()
                .end(); //注意直接使用romove(".ui-resizable-handle")无法删除子元素
        copyCurrentEle
            .css({
                left: currentEle.position().left + 20,
                top: currentEle.position().top + 20,
            })
            .appendTo(this.contentDiv);
        this._eleDrag(copyCurrentEle);
        this._eleResize(copyCurrentEle);
        this.currentEle = null;
    }

    deleDragEleClick() {
        if (!this.currentEle) return;
        this.currentEle.remove();
        this.opration.removeClass("active-move");
        this.currentEle = null;
        this._rightMenuContentHidden();
        this._clearForbidSecondDrag();
    }

    closeRightControlPannel() {
        this.opration.removeClass("active-move");
        this._rightMenuContentHidden();
    }

    previewLocalImg() {
        if (window.File || window.FileList) {
            var file = this.localImg[0].files[0], //注意需要使用原生的dom来获取files属性
                reg = /image\/\w+/,
                reader = new FileReader(),
                self = this;
            if (file.size > 1024000) {
                //图片不能大于1Mb
                utilDialog("图片容量过大，单张图片容量不能大于1MB！");
                return false;
            }

            //图片文件格式过滤
            if (!reg.test(file.type)) {
                utilDialog("请上传图片格式文件");
                return false;
            }

            //创建预览
            reader.onload = function(e) {
                self.previewImg.attr("src", e.target.result);
                self.currentEle.find("img").attr("src", e.target.result);
            };
            reader.readAsDataURL(file); //将图片存为DataURL字符串
        } else {
            utilDialog("抱歉，你的浏览器不支持FileAPI，请升级浏览器！");
        }
    }

    bindTextToDragEle(e) {
        var target = e.target,
            self = this,
            $span = self.currentEle.find("span");
        clearTimeout(this.timer1);
        this.timer1 = setTimeout(function() {
            $span.text($(target).val());
            if (!$span.text()) {
                $span.text("不能为空");
            }
        }, 500);
    }

    bindTextToTableDragEle(e) {
        var target = e.target,
            self = this,
            $tables = self.currentEle.find("table"),
            $th1 = $tables.find("th:first-of-type span"),
            $th2 = $tables.find("th:nth-of-type(2) span"),
            $th3 = $tables.find("th:last-of-type span"),
            $decs = $tables.find(
                "tfoot tr:first-of-type td:first-of-type span"
            ),
            $totleWeight = $tables.find(
                "tfoot tr:first-of-type td:nth-of-type(2) span"
            ),
            $totlePrice = $tables.find(
                "tfoot tr:first-of-type td:last-of-type span"
            ),
            $contury = $tables.find(
                "tfoot tr:last-of-type td:first-of-type span"
            );

        clearTimeout(this.timer1);
        this.timer1 = setTimeout(function() {
            switch (target.className) {
                case "wms-thead-decs":
                    $th1.text($(target).val());
                    break;
                case "wms-thead-weight":
                    $th2.text($(target).val());
                    break;
                case "wms-thead-price":
                    $th3.text($(target).val());
                    break;
                case "wms-tfoot-decs":
                    $decs.text($(target).val());
                    break;
                case "wms-tfoot-weight":
                    $totleWeight.text($(target).val());
                    break;
                case "wms-tfoot-price":
                    $totlePrice.text($(target).val());
                    break;
                case "wms-tfoot-abbr":
                    $contury.text($(target).val());
                    break;
            }
        }, 500);
    }

    addOrDelCustomTableRow(e) {
        var target = e.target,
            tbody = this.currentEle.find("table tbody")[0],
            type = $(target).data("wms_type"), //判断是删除还是新增
            addValue = parseInt(this.tabsTableCustomPannelTaddEle.val()),
            delValue = parseInt(this.tabsTableCustomPannelTdelEle.val()),
            rowsLength = tbody.rows.length,
            $tbodyTrs = $(tbody).find("tr"),
            $span = null,
            strEle = "";
        if (type === "add") {
            if (!addValue) return this.tabsTableCustomPannelTaddEle.val("");
            if (addValue < 1 || addValue > 10) {
                utilDialog("新增的行数不能为负数or超过10行");
                return;
            }
            for (var i = 0; i < addValue; i++) {
                var oneRow = tbody.insertRow(tbody.rows.length),
                    cell1 = oneRow.insertCell(),
                    cell2 = oneRow.insertCell(),
                    cell3 = oneRow.insertCell();
                cell1.innerHTML =
                    "<span class='wms-tbody-row" +
                    (i + 1 + $tbodyTrs.length) +
                    "-first'>表格自定义第" +
                    (i + 1 + $tbodyTrs.length) +
                    "行单元格1</span>";
                cell2.innerHTML =
                    "<span class='wms-tbody-row" +
                    (i + 1 + $tbodyTrs.length) +
                    "-second'>表格自定义第" +
                    (i + 1 + $tbodyTrs.length) +
                    "行单元格2</span>";
                cell3.innerHTML =
                    "<span class='wms-tbody-row" +
                    (i + 1 + $tbodyTrs.length) +
                    "-three'>表格自定义第" +
                    (i + 1 + $tbodyTrs.length) +
                    "行单元格3</span>";
            }
        } else {
            if (!delValue) return this.tabsTableCustomPannelTdelEle.val("");
            if (delValue < 0 || delValue > rowsLength) {
                utilDialog("不能超过当前表格的行数");
            }
            tbody.deleteRow(delValue - 1);
            $tbodyTrs = $(tbody).find("tr");
            for (var x = 0; x < $tbodyTrs.length; x++) {
                $span = $($tbodyTrs[x]).find("span");
                for (var j = 0; j < $span.length; j++) {
                    $($span[j]).removeClass();
                    if (j === 0) {
                        $($span[j]).addClass(
                            "wms-tbody-row" + (x + 1) + "-first"
                        );
                        $($span[j]).text(
                            "表格自定义第" + (x + 1) + "行单元格1"
                        );
                    } else if (j === 1) {
                        $($span[j]).addClass(
                            "wms-tbody-row" + (x + 1) + "-second"
                        );
                        $($span[j]).text(
                            "表格自定义第" + (x + 1) + "行单元格2"
                        );
                    } else {
                        $($span[j]).addClass(
                            "wms-tbody-row" + (x + 1) + "-three"
                        );
                        $($span[j]).text(
                            "表格自定义第" + (x + 1) + "行单元格3"
                        );
                    }
                }
            }
        }

        this.tabsTableCustomPannelTrowEle.empty();
        $tbodyTrs = $(tbody).find("tr");
        for (var k = 0; k < $tbodyTrs.length; k++) {
            strEle +=
                "<option value=" + (k + 1) + ">第" + (k + 1) + "行</option>";
        }
        this.tabsTableCustomPannelTrowEle
            .html(strEle)
            .end()
            .val("1");
    }

    plusLineXyWh() {
        //获取当前元素是垂直线还是水平线
        var type = this.currentEle.data("ele"),
            value = this.tabsStylesPannelWhEle.val();
        if (type === this.switchCfg.lineX) {
            value++;
            if (value > 365) {
                value = 365;
            }
            this.currentEle.css("width", value);
        } else {
            value++;
            if (value > 365) {
                value = 365;
            }
            this.currentEle.css("height", value);
        }
        this.tabsStylesPannelWhEle.val(value);
    }

    countLineXyWh() {
        //获取当前元素是垂直线还是水平线
        var type = this.currentEle.data("ele"),
            value = this.tabsStylesPannelWhEle.val();
        if (type === this.switchCfg.lineX) {
            value--;
            if (value < 20) {
                value = 20;
            }
            this.currentEle.css("width", value);
        } else {
            value--;
            if (value < 20) {
                value = 20;
            }
            this.currentEle.css("height", value);
        }
        this.tabsStylesPannelWhEle.val(value);
    }

    setLineXyAll() {
        var type = this.currentEle.data("ele");
        if (type === this.switchCfg.lineX) {
            this.currentEle.css("width", "100%");
        } else {
            this.currentEle.css("height", "100%");
        }
        this.tabsStylesPannelWhEle.val("365");
    }

    initDrag() {
        var self = this;
        this.widgetDiv.draggable({
            addClasses: true,
            helper: "clone",
            containment: "document",
            snap: false, //默认值为false，元素是否对齐到其他元素。也可以设置一个选择器
            snapMode: "inner",
            // cursorAt: { left: 5, top: 5 },
            stack: ".label-content",
            zIndex: 3,
            cursor: "move",
            revert: "invalid",
            start: self._dragStart.bind(self),
            drag: self._dragging.bind(self),
            stop: self._dragStop.bind(self),
            classes: {
                //添加新的类名
                "ui-draggable": "active-drag",
            },
        });

        this.contentDivWrap.draggable();
    }

    _eleDrag(ele) {
        ele.draggable({
            addClasses: true,
            containment: "parent",
        });
    }

    initDrap() {
        var self = this;
        this.contentDiv.droppable({
            accept: self.widgetDiv,
            greedy: true,
            hoverClass: "drop-hover",
            drop: self._drapStop.bind(self),
        });
    }

    _eleResize(ele, isResize, type) {
        var oldTh2Width = null,
            oldTh3Width = null,
            $th2 = null,
            $th3 = null,
            isAspectRatio = false;
        if (!isResize) {
            switch (type) {
                case this.switchCfg.picture:
                case this.switchCfg.localImg:
                    isAspectRatio =
                        type === this.switchCfg.picture ? true : false;
                    ele.resizable({
                        alsoResize: false,
                        aspectRatio: isAspectRatio,
                        autoHide: false,
                        containment: "parent",
                        stop: function() {
                            // var widths = $(this).width(),
                            //     heights = $(this).height();
                            // $(this).find("img").css({ "width": "100%", "height": "100%" });
                            $(this).css("lineHeight", $(this).css("height"));
                        },
                    });
                    break;
                case this.switchCfg.recipientAddress:
                    ele.resizable({
                        alsoResize: false,
                        aspectRatio: false,
                        autoHide: true,
                        containment: "parent",
                        stop: function() {
                            $(this)
                                .find(".ui-text-info")
                                .css({
                                    width: $(this).width(),
                                    height: $(this).height(),
                                });
                        },
                    });
                    break;
                case this.switchCfg.tableHs:
                case this.switchCfg.tableCustom:
                    ele.resizable({
                        aspectRatio: false,
                        autoHide: true,
                        minHeight: 103,
                        minWidth: 122,
                        grid: 31,
                        containment: "parent",
                        start: function(event, ui) {
                            $th2 = ui.element.find("th:nth-of-type(2)");
                            $th3 = ui.element.find("th:last-of-type");
                            oldTh2Width = $th2.width();
                            oldTh3Width = $th3.width();
                        },
                        resize: function() {
                            $th2.css("width", oldTh2Width);
                            $th3.css("width", oldTh3Width);
                        },
                        stop: function() {},
                    });
                    break;
                case this.switchCfg.barcode:
                    ele.resizable({
                        aspectRatio: false,
                        autoHide: true,
                        containment: "parent",
                        start: function() {},
                        resize: function() {},
                        stop: function() {
                            ele.find(".wms-barcode").css({
                                width: $(this).width(),
                                height: $(this).height(),
                            });
                        },
                    });
                    break;
                default:
                    ele.resizable({
                        aspectRatio: false,
                        autoHide: true,
                        containment: "parent",
                        create: function() {},
                        stop: function() {},
                    });
            }

            ele.on("resize", function(e) {
                //阻止冒泡
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }
    }

    initEleDragAndResize() {
        var item = this.contentDiv.find(".drag-item"),
            self = this,
            isResize = null,
            type = null,
            specsStr = null;

        if (item.length) {
            this._eleDrag(item);
            item.each(function(index, item) {
                isResize = $(item).data("unresize");
                type = $(item).data("ele");
                self._eleResize($(item), isResize, type);
            });
        }

        //设置表单的值
        this.inputNameEle.val(decodeURIComponent(requestObj.name));
        this.inputSpecsEle.val(requestObj.specs);
        this.inputTplTypeEle.val(requestObj.template_type);
        this.inputBillTypeEle.val(requestObj.bill_type);
        this.inputTplIdEle.val(requestObj.template_id);

        // this.printViewPath = requestObj.template_path || "";
        this.templateId = requestObj.template_id || "";

        if (requestObj.template_id) {
            this.printViewBtn.addClass("print-active-green");
        }
        this.saveInnerHtmlBtn.addClass("print-active-green");

        this.spanBillTypeEle.text(
            requestObj.bill_type === "1" ? "地址单" : "配送单"
        );
        switch (requestObj.specs) {
            case "1":
                specsStr = "10*10";
                break;
            case "2":
                specsStr = "10*5";
                this.contentDivWrap.css("height", "5cm");
                break;
            case "3":
                specsStr = "A4";
                this.contentDivWrap.css({ height: "29.7cm", width: "21cm" });
                break;
        }
        this.spanSpecsEle.text(specsStr);
    }

    _eleClick(ele) {
        var self = this;
        ele.on("click", ".title", function() {
            self._show();
        });
    }

    _switchBack(type, html, ele, left) {
        var $div = null,
            $div1 = null,
            $div2 = null,
            barcodeNum = null,
            strEle = null,
            str = "";
        switch (type) {
            case this.switchCfg.lineX:
                str = "<div></div>";
                ele.css("left", 0);
                break;
            case this.switchCfg.lineY:
                str = "<div></div>";
                ele.css({ top: 0, left: left + 125 });
                break;
            case this.switchCfg.textCustom: //自定义文本
                str = "<span>自定义文本</span>";
                break;
            case this.switchCfg.localImg: //本地图片
                str =
                    "<img src='/front/assets/images/label/photo_default.jpg'></img>";
                ele.css({ left: left + 105 });
                break;
            case this.switchCfg.tableHs: //表格
            case this.switchCfg.tableCustom: //表格
                str = $(html).find("table");
                ele.css({ left: 0 });
                break;
            case this.switchCfg.barcode: //条形码
                // $img = $("<img></img>");
                // // barcodeNum = $(html).text().replace(/[^0-9]/ig, "");
                // console.log($(html).length);
                // barcodeNum = $(html).eq($(html).length - 1).text();
                // this.defaultBarcode.text = barcodeNum;
                // $img.attr({ "data-barcodeNum": barcodeNum, "data-barcodeOpt": JSON.stringify(this.defaultBarcode) });
                // $img.JsBarcode(barcodeNum, this.defaultBarcode);
                // str = $img;
                $div = $("<div></div>");
                $div1 = $("<div class='wms-barcode'></div>");
                barcodeNum = $(html)
                    .eq($(html).length - 1)
                    .text();
                $div2 = $(
                    "<div class='wms-barcode-helper ui-barcode-helper'>" +
                        barcodeNum +
                        "</div>"
                );
                this.defaultBarcode.text = barcodeNum;
                $div1.attr({
                    "data-barcodeNum": barcodeNum,
                    "data-barcodeOpt": JSON.stringify(this.defaultBarcode),
                });
                $($div1).barcode(barcodeNum, "code128", this.defaultBarcode);
                $div1.appendTo($div);
                $div2.appendTo($div);
                str = $div.html();
                break;
            case this.switchCfg.recipientAddress: //地址
                $div = $("<div class='ui-text-info'></div>");
                $(html)
                    .find("span")
                    .appendTo($div);
                str = $div;
                break;
            default:
                //普通信息、日期
                strEle = $(html);
                strEle
                    .eq(0)
                    .find("i")
                    .remove();
                str = strEle;
                this.switchCfgTitle.normalInfo = strEle.eq(0).text(); //获取标题的内容
        }
        return str;
    }

    _swichRightMenu(type) {
        var arr = [];
        switch (type) {
            case this.switchCfg.lineX:
                arr = ["tabs_styles"];
                this.menuTabContentTitle.text(this.switchCfgTitle.lineX);
                break;
            case this.switchCfg.lineY:
                arr = ["tabs_styles"];
                this.menuTabContentTitle.text(this.switchCfgTitle.lineY);
                break;
            case this.switchCfg.textCustom:
                arr = ["tabs_custom", "tabs_border"];
                this.menuTabContentTitle.text(this.switchCfgTitle.textCustom);
                $(".ui-label-custom-textarea").val(
                    this.currentEle.find("span").text()
                );
                break;
            case this.switchCfg.localImg:
                arr = ["tabs_upload", "tabs_border"];
                this.menuTabContentTitle.text(this.switchCfgTitle.localImg);
                this.previewImg.attr(
                    "src",
                    this.currentEle.find("img").attr("src")
                );
                this.showLocalImgSrc.val(
                    this.currentEle.find("img").attr("src")
                );
                break;
            case this.switchCfg.barcode:
                arr = ["tabs_barcode"];
                this.menuTabContentTitle.text(this.switchCfgTitle.barcode);
                break;
            case this.switchCfg.tableHs:
                arr = ["tabs_table", "tabs_table_content"];
                this.menuTabContentTitle.text(this.switchCfgTitle.tableHs);
                break;
            case this.switchCfg.tableCustom:
                arr = ["tabs_table", "tabs_table_custom"];
                this.menuTabContentTitle.text(this.switchCfgTitle.tableHs);
                break;
            case this.switchCfg.recipientAddress:
                arr = ["tabs_comprehensive", "tabs_font", "tabs_border"];
                this.menuTabContentTitle.text(
                    this.switchCfgTitle.recipientAddress
                );
                break;
            case this.switchCfg.date:
                arr = ["tabs_title", "tabs_date", "tabs_border"];
                this.menuTabContentTitle.text(this.switchCfgTitle.date);
                break;
            case this.switchCfg.picture:
                arr = ["tabs_border"];
                this.menuTabContentTitle.text(this.switchCfgTitle.picture);
                break;
            default:
                arr = ["tabs_title", "tabs_content", "tabs_border"];
                this.switchCfgTitle.normalInfo = this.currentEle
                    .find("strong")
                    .text();
                this.menuTabContentTitle.text(this.switchCfgTitle.normalInfo);
                break;
        }
        this._rightMenuContentShow(arr);
    }

    _showDefalutValue(type) {
        switch (type) {
            case this.switchCfg.lineX:
            case this.switchCfg.lineY:
                this._showTabsStylesDefalutValue(type);
                break;
            case this.switchCfg.textCustom:
                this._showTabsCustomDefalutValue();
                this._showTabsBorderDefalutValue();
                break;
            case this.switchCfg.localImg:
                break;
            case this.switchCfg.barcode:
                this._showTabsBarcodeDefalutValue();
                break;
            case this.switchCfg.tableHs:
                this._showTabsTableHsDefalutValue();
                this._showTabsTableHsContentDefalutValue();
                break;
            case this.switchCfg.tableCustom:
                this._showTabsTableHsDefalutValue();
                this._showTabsTableCustomContentDefalutValue();
                break;
            case this.switchCfg.recipientAddress:
                this._showTabsComprehensiveDefalutValue();
                this._showTabsFontDefalutValue();
                this._showTabsBorderDefalutValue();
                break;
            case this.switchCfg.date:
                this._showTabsTitleDefalutValue();
                this._showTabsDateDefalutValue();
                this._showTabsBorderDefalutValue();
                break;
            case this.switchCfg.pictrue:
                this._showTabsBorderDefalutValue();
                break;
            default:
                this._showTabsTitleDefalutValue();
                this._showTabsContentDefalutValue();
                this._showTabsBorderDefalutValue();
                break;
        }
    }

    _showTabsTableCustomContentDefalutValue() {
        var $tables = this.currentEle.find("table"),
            $th1Value = $tables.find("th:first-of-type"),
            $th2Value = $tables.find("th:nth-of-type(2)"),
            $th3Value = $tables.find("th:last-of-type"),
            $tbodyTrs = $tables.find("tbody tr:first-of-type"),
            $tbodyTd1 = $tbodyTrs.find("td:first-of-type"),
            $tbodyTd2 = $tbodyTrs.find("td:nth-of-type(2)"),
            $tbodyTd3 = $tbodyTrs.find("td:last-of-type"),
            $tfootTd1 = $tables.find("tfoot tr:first-of-type td:first-of-type"),
            $tfootTd2 = $tables.find(
                "tfoot tr:first-of-type td:nth-of-type(2)"
            ),
            $tfootTd3 = $tables.find("tfoot tr:first-of-type td:last-of-type"),
            isTheadShow =
                $tables.find("thead").css("display") === "none" ? false : true,
            isTfootShow =
                $tables.find("tfoot").css("display") === "none" ? false : true,
            strEle = "";

        this.tabsTableCustomPannelTbfEle.val($tbodyTd1.text());
        this.tabsTableCustomPannelTbsEle.val($tbodyTd2.text());
        this.tabsTableCustomPannelTbtEle.val($tbodyTd3.text());
        this.tabsTableCustomPannelTffEle.val(
            isTfootShow ? $tfootTd1.text() : ""
        );
        this.tabsTableCustomPannelTfsEle.val(
            isTfootShow ? $tfootTd2.text() : ""
        );
        this.tabsTableCustomPannelTftEle.val(
            isTfootShow ? $tfootTd3.text() : ""
        );
        this.tabsTableCustomPannelThfEle.val(
            isTheadShow ? $th1Value.text() : ""
        );
        this.tabsTableCustomPannelThhEle.val(
            isTheadShow ? $th2Value.text() : ""
        );
        this.tabsTableCustomPannelThsEle.val(
            isTheadShow ? $th3Value.text() : ""
        );

        //创建option行数
        for (var i = 0; i < $tables.find("tbody tr").length; i++) {
            strEle +=
                "<option value=" + (i + 1) + ">第" + (i + 1) + "行</option>";
        }
        this.tabsTableCustomPannelTrowEle.html(strEle);
        this.tabsTableCustomPannelTrowEle.val("1"); //默认tbody中的第一行
    }

    _showTabsTableHsContentDefalutValue() {
        var $tables = this.currentEle.find("table"),
            th1Value = $tables.find("th:first-of-type").text(),
            th2Value = $tables.find("th:nth-of-type(2)").text(),
            th3Value = $tables.find("th:last-of-type").text(),
            decs = $tables
                .find("tfoot tr:first-of-type td:first-of-type")
                .text(),
            totleWeight = $tables
                .find("tfoot tr:first-of-type td:nth-of-type(2)")
                .text(),
            totlePrice = $tables
                .find("tfoot tr:first-of-type td:last-of-type")
                .text(),
            contury = $tables
                .find("tfoot tr:last-of-type td:first-of-type")
                .text(),
            isTfootDisplay =
                $tables.find("tfoot tr:first-of-type").css("display") === "none"
                    ? false
                    : true,
            isSkuDecsCnShow =
                $tables.find("tbody .wms-sku-name-cn").css("display") === "none"
                    ? false
                    : true,
            isSkuDecsEnShow =
                $tables.find("tbody .wms-sku-name-en").css("display") === "none"
                    ? false
                    : true,
            isSkuQtyShow =
                $tables.find("tbody .wms-qty").css("display") === "none"
                    ? false
                    : true,
            isSkuCodeShow =
                $tables.find("tbody .wms-sku").css("display") === "none"
                    ? false
                    : true;

        this.tabsTableContentPannelSEle.prop("checked", isSkuCodeShow);
        this.tabsTableContentPannelSncEle.prop("checked", isSkuDecsCnShow);
        this.tabsTableContentPannelSneEle.prop("checked", isSkuDecsEnShow);
        this.tabsTableContentPannelSqEle.prop("checked", isSkuQtyShow);
        this.tabsTableContentPannelTfaEle.val(contury);
        this.tabsTableContentPannelTfdEle.val(decs);
        this.tabsTableContentPannelTfpEle.val(totlePrice);
        this.tabsTableContentPannelTfwEle.val(totleWeight);
        this.tabsTableContentPannelTfEle.prop("checked", isTfootDisplay);
        this.tabsTableContentPannelThdEle.val(th1Value);
        this.tabsTableContentPannelThnEle.val("single");
        this.tabsTableContentPannelThpEle.val(th3Value);
        this.tabsTableContentPannelThwEle.val(th2Value);
    }

    _showTabsDateDefalutValue() {
        var $span = this.currentEle.find("span"),
            divide = $span.attr("data-divide");
        this.tabsDatePannelSyEle.prop(
            "checked",
            $span.text().length > 5 ? true : false
        );

        this.tabsDatePannelDfEle.val(divide);
        this.tabsDatePannelTaEle.val(this.currentEle.css("text-align"));
        // this.tabsDatePannelFfEle.val("Helvetica");
        this.tabsDatePannelFfEle[0].value = $span.css("font-family");
        this.tabsDatePannelFsEle.val($span.css("font-size"));
        this.tabsDatePannelFwEle.val(
            parseInt($span.css("font-weight")) > 700 ? "900" : "400"
        );
        this.tabsDatePannelLhEle.val(
            parseInt($span.css("line-height")) /
                parseInt($span.css("font-size"))
        );
    }

    _showTabsTitleDefalutValue() {
        var $strong = this.currentEle.find("strong"),
            isShowTitle = $strong.css("display") === "none" ? false : true,
            isShowLineTitle = $strong.css("display") === "block" ? true : false,
            titleContent = $strong.text();

        this.tabsTitlePannelStEle.prop("checked", isShowTitle);
        this.tabsTitlePannelTcEle.val(titleContent);
        this.tabsTitlePannelTcEle.prop("disabled", !isShowTitle);

        this.tabsTitlePannelSlEle.prop("checked", isShowLineTitle);
        this.tabsTitlePannelPbEle.prop("disabled", !isShowLineTitle);
        this.tabsTitlePannelTaEle.prop("disabled", !isShowLineTitle);
        this.tabsTitlePannelSlEle.prop("disabled", !isShowTitle);
        this.tabsTitlePannelFfEle.prop("disabled", !isShowTitle);
        this.tabsTitlePannelFsEle.prop("disabled", !isShowTitle);
        this.tabsTitlePannelFwEle.prop("disabled", !isShowTitle);
        this.tabsTitlePannelLhEle.prop("disabled", !isShowTitle);

        this.tabsTitlePannelWcEle.css(
            "display",
            isShowLineTitle === true ? "block" : "none"
        );
        this.tabsTitlePannelTaEle.val($strong.css("text-align"));
        this.tabsTitlePannelPbEle.val($strong.css("padding-bottom"));
        // this.tabsTitlePannelFfEle.val(fontFamily);
        this.tabsTitlePannelFfEle[0].value = "Tahoma";

        this.tabsTitlePannelFsEle.val($strong.css("font-size"));
        this.tabsTitlePannelLhEle.val(
            parseInt($strong.css("line-height")) /
                parseInt($strong.css("font-size"))
        );
        this.tabsTitlePannelFwEle.val(
            parseInt($strong.css("font-weight")) > 700 ? "900" : "400"
        );
    }

    _showTabsFontDefalutValue() {
        var isBlock =
            this.currentEle.find(".wms-person-country-en").css("display") !==
            "none"
                ? true
                : false;

        this.tabsFontPannelPaEle.prop(
            "checked",
            this.currentEle.find(".wms-person-area").css("display") !== "none"
                ? true
                : false
        );

        this.tabsFontPannelPceEle.prop("checked", isBlock);
        this.tabsFontPannelPeEle.prop(
            "checked",
            this.currentEle.find(".wms-person-email").css("display") !== "none"
                ? true
                : false
        );
        this.tabsFontPannelPnEle.prop(
            "checked",
            this.currentEle.find(".wms-person-name").css("display") !== "none"
                ? true
                : false
        );
        this.tabsFontPannelPpEle.prop(
            "checked",
            this.currentEle.find(".wms-person-postcode").css("display") !==
                "none"
                ? true
                : false
        );
        this.tabsFontPannelPsEle.prop(
            "checked",
            this.currentEle.find(".wms-person-street").css("display") !== "none"
                ? true
                : false
        );
        this.tabsFontPannelPt1Ele.prop(
            "checked",
            this.currentEle.find(".wms-person-tel1").css("display") !== "none"
                ? true
                : false
        );
        this.tabsFontPannelPt2Ele.prop(
            "checked",
            this.currentEle.find(".wms-person-tel2").css("display") !== "none"
                ? true
                : false
        );

        if (isBlock) {
            this.tabsFontPannelPcnEl.prop(
                "checked",
                this.currentEle
                    .find(".wms-person-country-cn")
                    .css("display") !== "none"
                    ? true
                    : false
            );
        } else {
            this.tabsFontPannelPcnEl.prop("checked", false);
        }

        this.tabsFontPannelPibEle.prop(
            "checked",
            this.currentEle
                .find("span")
                .eq(1)
                .css("display") === "block"
                ? true
                : false
        );
    }

    _showTabsComprehensiveDefalutValue() {
        var $area = this.currentEle.find(".wms-person-area"),
            $conturyCn = this.currentEle.find(".wms-person-country-cn"),
            $conturyEn = this.currentEle.find(".wms-person-country-en"),
            $email = this.currentEle.find(".wms-person-email"),
            $name = this.currentEle.find(".wms-person-name"),
            $postcode = this.currentEle.find(".wms-person-postcode"),
            $street = this.currentEle.find(".wms-person-street"),
            $tel1 = this.currentEle.find(".wms-person-tel1"),
            $tel2 = this.currentEle.find(".wms-person-tel"),
            tempText = null;

        this.tabsContentPannelFfEle.val(this.currentEle.css("font-family"));
        this.tabsContentPannelFsEle.val(this.currentEle.css("font-size"));
        this.tabsContentPannelFwEle.val(this.currentEle.css("font-weight"));
        this.tabsContentPannelLhEle.val(
            parseInt(this.currentEle.css("line-height")) /
                parseInt(this.currentEle.css("font-size"))
        );
        this.tabsContentPannelTaEle.val(this.currentEle.css("text-align"));

        this.tabsComprehensivePannelCaEle.val(
            $area.css("display") !== "none" ? $area.text() : ""
        );
        this.tabsComprehensivePannelCccEle.val(
            $conturyCn.css("display") !== "none" ? $conturyCn.text() : ""
        );
        if ($conturyEn.css("display") !== "none") {
            tempText = $conturyEn
                .clone()
                .find("strong")
                .remove()
                .end()
                .text();
        } else {
            tempText = "";
        }
        this.tabsComprehensivePannelCceEle.val(tempText);
        this.tabsComprehensivePannelCeEle.val(
            $email.css("display") !== "none" ? $email.text() : ""
        );
        this.tabsComprehensivePannelCnEle.val(
            $name.css("display") !== "none" ? $name.text() : ""
        );
        this.tabsComprehensivePannelCpEle.val(
            $postcode.css("display") !== "none" ? $postcode.text() : ""
        );
        this.tabsComprehensivePannelCsEle.val(
            $street.css("display") !== "none" ? $street.text() : ""
        );
        this.tabsComprehensivePannelCt1Ele.val(
            $tel1.css("display") !== "none" ? $tel1.text() : ""
        );
        this.tabsComprehensivePannelCt2Ele.val(
            $tel2.css("display") !== "none" ? $tel1.text() : ""
        );
    }

    _showTabsContentDefalutValue() {
        this.tabsContentPannelFfEle.val(this.currentEle.css("font-family"));
        this.tabsContentPannelFsEle.val(this.currentEle.css("font-size"));
        this.tabsContentPannelFwEle.val(this.currentEle.css("font-weight"));
        this.tabsContentPannelLhEle.val(
            parseInt(this.currentEle.css("line-height")) /
                parseInt(this.currentEle.css("font-size"))
        );
        this.tabsContentPannelTaEle.val(this.currentEle.css("text-align"));

        this.tabsContentPannelCtEle.val(
            this.currentEle.find("span") && this.currentEle.find("span").text()
        );
    }

    _showTabsStylesDefalutValue(type) {
        this.tabsStylesPannelBsEle.val(this.currentEle.css("border-style"));
        if (type === this.switchCfg.lineX) {
            this.tabsStylesPannelWhEle.val(
                parseInt(this.currentEle.css("width"))
            );
            this.tabsStylesPannelBwle.val(
                this.currentEle.css("border-bottom-width")
            );
        } else {
            this.tabsStylesPannelWhEle.val(
                parseInt(this.currentEle.css("height"))
            );
            this.tabsStylesPannelBwle.val(
                this.currentEle.css("border-left-width")
            );
        }
    }

    _showTabsCustomDefalutValue() {
        this.tabsCustomPannelDbEle.val(this.currentEle.text());
        this.tabsCustomPannelFfEle.val(this.currentEle.css("font-family"));
        this.tabsCustomPannelFsEle.val(this.currentEle.css("font-size"));
        this.tabsCustomPannelFwEle.val(
            parseInt(this.currentEle.css("font-weight")) > 700 ? "900" : "400"
        ); //注意font-weight只有设置为bold的时候才能获取到bold字符串，其它时候只能获取的数字
        this.tabsCustomPannelLhEle.val(
            parseInt(this.currentEle.css("line-height")) /
                parseInt(this.currentEle.css("font-size"))
        ); //line-height无法获取具体的数字获取到的时px，转化的方式是用行高/字体大小
        this.tabsCustomPannelTaELe.val(this.currentEle.css("text-align")); //如果没设置text-align，那么获取到的时start字符串
    }

    _showTabsBorderDefalutValue() {
        this.tabsBorderPannelBbwEle.val(
            this.currentEle.css("border-bottom-width")
        );
        this.tabsBorderPannelBbwEle.prop(
            "disabled",
            parseInt(this.currentEle.css("border-bottom-width")) === 0
                ? true
                : false
        );
        this.tabsBorderPannelBlwEle.val(
            this.currentEle.css("border-left-width")
        );
        this.tabsBorderPannelBlwEle.prop(
            "disabled",
            parseInt(this.currentEle.css("border-left-width")) === 0
                ? true
                : false
        );
        this.tabsBorderPannelBrwEle.val(
            this.currentEle.css("border-right-width")
        );
        this.tabsBorderPannelBrwEle.prop(
            "disabled",
            parseInt(this.currentEle.css("border-right-width")) === 0
                ? true
                : false
        );
        this.tabsBorderPannelBtwEle.val(
            this.currentEle.css("border-top-width")
        );
        this.tabsBorderPannelBtwEle.prop(
            "disabled",
            parseInt(this.currentEle.css("border-top-width")) === 0
                ? true
                : false
        );
        this.tabsBorderPannelPbELe.val(this.currentEle.css("padding-bottom"));
        this.tabsBorderPannelPbELe.prop(
            "disabled",
            parseInt(this.currentEle.css("padding-bottom")) === 0 ? true : false
        );
        this.tabsBorderPannelPlEle.val(this.currentEle.css("padding-left"));
        this.tabsBorderPannelPlEle.prop(
            "disabled",
            parseInt(this.currentEle.css("padding-left")) === 0 ? true : false
        );
        this.tabsBorderPannelPrELe.val(this.currentEle.css("padding-right"));
        this.tabsBorderPannelPrELe.prop(
            "disabled",
            parseInt(this.currentEle.css("padding-right")) === 0 ? true : false
        );
        this.tabsBorderPannelPtEle.val(this.currentEle.css("padding-top"));
        this.tabsBorderPannelPtEle.prop(
            "disabled",
            parseInt(this.currentEle.css("padding-top")) === 0 ? true : false
        );

        this.tabsBorderPannelSbbEle.prop(
            "checked",
            parseInt(this.currentEle.css("border-bottom-width")) !== 0
                ? true
                : false
        );
        this.tabsBorderPannelSblEle.prop(
            "checked",
            parseInt(this.currentEle.css("border-left-width")) !== 0
                ? true
                : false
        );
        this.tabsBorderPannelSbrEle.prop(
            "checked",
            parseInt(this.currentEle.css("border-right-width")) !== 0
                ? true
                : false
        );
        this.tabsBorderPannelSbtEle.prop(
            "checked",
            parseInt(this.currentEle.css("border-top-width")) !== 0
                ? true
                : false
        );
    }

    _showTabsBarcodeDefalutValue() {
        var barcodeImgData = JSON.parse(
                this.currentEle.find(".wms-barcode").attr("data-barcodeopt")
            ), //注意这里获取的时对象需要使用attr方法而不是data方法，是因为data方法第二次获取的值跟上次一样
            $barcodeHelp = this.currentEle.find(".wms-barcode-helper");
        this.tabsBarcodePannelBcEle.prop(
            "check",
            $barcodeHelp.css("display") === "block" ? true : false
        );
        this.tabsBarcodePannelFsEle.val($barcodeHelp.css("font-size"));
        this.tabsBarcodePannelTaEle.val($barcodeHelp.css("text-align"));
        this.tabsBarcodePannelFwEle.val(
            $barcodeHelp.css("font-weight") > 700 ? "900" : "400"
        );
        this.tabsBarcodePannelWEle.val(barcodeImgData.barWidth);
    }

    _showTabsTableHsDefalutValue() {
        var $tfoot = this.currentEle.find("tfoot"),
            $td0 = this.currentEle.find("td").eq(0),
            $th0 = this.currentEle.find("th").eq(0);
        this.tabsTablePannelBffEle.val($td0.css("font-family"));
        this.tabsTablePannelBfsEle.val($td0.css("font-size"));
        this.tabsTablePannelHffEle.val($th0.css("font-family"));
        this.tabsTablePannelHfsEle.val($th0.css("font-size"));
        this.tabsTablePannelTbEle.prop(
            "checked",
            parseInt($td0.css("border-width")) !== 0 ? true : false
        );
        this.tabsTablePannelThEle.prop(
            "checked",
            this.currentEle.find("th").length !== 0 ? true : false
        );

        this.tabsTablePannelTfEle.prop(
            "checked",
            $tfoot.css("display") === "none" ? false : true
        );
        this.tabsTablePannelTffEle.val($tfoot.css("font-family"));
        this.tabsTablePannelTfsEle.val($tfoot.css("font-size"));
    }

    _keyMove() {
        var self = this,
            currentEle = self.currentEle.hasClass("drag-item")
                ? self.currentEle
                : self.currentEle.parents(".drag-item"),
            eleTop = currentEle.position().top,
            eleLeft = currentEle.position().left,
            eleHeight = currentEle.height(),
            eleWidth = currentEle.width(),
            parentHeight = self.contentDiv.height(),
            parentWidth = self.contentDiv.width();

        key.unbind("down");
        key.unbind("up");
        key.unbind("left");
        key.unbind("right");
        key("up", function() {
            eleTop = currentEle.position().top;
            currentEle.css("top", (eleTop -= 2));
            if (eleTop < 0) {
                currentEle.css("top", 0);
            }
            return false;
        });
        key("down", function() {
            eleTop = currentEle.position().top;
            currentEle.css("top", (eleTop += 2));
            if (eleTop + eleHeight > parentHeight) {
                currentEle.css("top", parentHeight - eleHeight);
            }
            return false;
        });
        key("left", function() {
            eleLeft = currentEle.position().left;
            currentEle.css("left", (currentEle.position().left -= 2));
            if (eleLeft < 2) {
                currentEle.css("left", 0);
            }
            return false;
        });
        key("right", function() {
            eleLeft = currentEle.position().left;
            currentEle.css("left", (currentEle.position().left += 2));
            if (eleLeft + eleWidth + 2 > parentWidth) {
                currentEle.css("left", parentWidth - eleWidth);
            }
            return false;
        });
        key("delete,del", self.deleDragEleClick.bind(self));
    }

    _makeBarcode() {}

    _doubleData() {}

    _dragStart() {
        this.contentDiv.addClass("ui-label-drag-bg");
    }

    _dragging() {}

    _dragStop() {
        this.contentDiv.removeClass("ui-label-drag-bg");
    }

    _drapStop(e, ui) {
        var target = e.target,
            styles = ui.draggable.data("styles") || "ui-label-normal-text", //添加元素样式
            type = ui.draggable.data("ele") || "normal_info", //判断元素类型,没有给定元素类型的都默认为普通类型
            isResize = ui.draggable.data("unresize"), //判断是否需要拉伸
            html = ui.draggable.html(),
            left = ui.position.left - $(target).offset().left,
            top = ui.position.top - $(target).offset().top,
            str = null;
        this.contentDiv.removeClass("ui-label-drag-bg");

        var $dragItem = $("<div class='drag-item ui-bdr'></div>");
        $dragItem
            .css({ position: "absolute", left: left + 25, top: top + 47 })
            .addClass(styles);
        str = this._switchBack(type, html, $dragItem, left);
        // $dragItem.html(ui.draggable.html()).appendTo(target);
        $dragItem.html(str).appendTo(target);
        $dragItem.attr("data-ele", type);
        isResize && $dragItem.attr("data-unresize", isResize);

        this._eleResize($dragItem, isResize, type);
        this._eleDrag($dragItem);
        this._eleClick($dragItem);
        this._setForbidSecondDrag(ui.draggable);
        // this._transformationImg($dragItem, type);
        // this._makeBarcode();
    }

    _transformationImg(ele, type) {
        if (type === "barcode") {
            this.currentBarcode = ele.find("img");
            var imgSrc = this.currentBarcode.attr("src");
            utilPostAjax(
                this.baseUrl + "/express/bill/saveImg",
                { base64: imgSrc },
                this.transformationImgSucc.bind(this)
            );
        }
    }

    transformationImgSucc(data) {
        this.currentBarcode
            .attr("src", "/front/assets/images/label/" + data.result)
            .css({ width: "150px", height: "40px" });
        this.currentBarcode = null;
    }

    _setForbidSecondDrag(currentEle) {
        var type = currentEle.data("ele");
        if (type === "table_hs") {
            currentEle.addClass("ui-lable-drag-complate");
            currentEle.removeClass("ui-label-detail-info");
            this.widgetDiv = $(".ui-label-content-left .ui-label-detail-info");
            this.initDrap(); //重置可接受的div元素
        }
    }

    _clearForbidSecondDrag() {
        var $div = this.leftMenu.find(".ui-label-content-menu li>div");
        $div.each(function(index, item) {
            if (!$(item).hasClass("ui-label-detail-info")) {
                $(item).removeClass("ui-lable-drag-complate");
                $(item).addClass("ui-label-detail-info");
            }
        });
        this.widgetDiv = $(".ui-label-content-left .ui-label-detail-info");
        this.initDrap();
    }

    _rightMenuContentShow(arr) {
        var firstEle = null,
            count = 0;
        this.menuTabList.each(function(index, item) {
            if (
                arr.indexOf(
                    $(item)
                        .find("a")
                        .data("tab_id")
                ) != -1
            ) {
                count++;
                if (count == 1) {
                    firstEle = $(item)
                        .find("a")
                        .data("tab_id");
                    $(item)
                        .css("display", "table-cell")
                        .addClass("active");
                } else {
                    $(item).css("display", "table-cell");
                }
            }
        });

        this.menuTabContent.each(function(index, item) {
            if ($(item).data("type") === firstEle) {
                $(item).addClass("active-tab");
                return;
            }
        });
    }

    _rightMenuContentHidden() {
        this.menuTabList.css("display", "none").removeClass("active");
        this.menuTabContent.removeClass("active-tab");
        this.hotKeyPannel.removeClass("active-keybord");
        this.currentEle && this.currentEle.removeClass("active-drag-ele");
    }

    _isTipsShow(target, style) {
        if (style === "font-size") {
            if (
                parseInt(target.value) < 12 &&
                this.currentBrowser === "Chrome"
            ) {
                this.labelTipsEle.css("display", "block");
            } else {
                this.labelTipsEle.css("display", "none");
            }
        }
    }
}

CreatNewLabel.Eles = {
    //存放元素属性
    leftMenu: ".ui-label-content-left",
    widgetDiv: ".ui-label-content-left .ui-label-detail-info",
    printViewBtn: ".ui-lable-printView",
    saveInnerHtmlBtn: ".ui-lable-saveInnerHtml",
    menuUl: ".ui-label-content-left .ui-label-content-menu",
    contentDiv: ".ui-label-content-main .ui-label-content-area",
    contentDivWrap: ".ui-label-content-main .ui-label-content-pannel",
    contentDivWrapMain: ".ui-label-content-main",
    menuTitle: ".ui-label-content-left .ui-label-content-title",
    menuTabList: ".ui-label-tab-menu li",
    tabs: "#tabs",
    menuTabContent: ".ui-label-tab-item .ui-label-tab-content",
    opration: ".ui-label-right-opration",
    labelTipsEle: ".ui-label-tips",
    labelForm: "form[name='printlabel']",
    inputHtml: "input[name='html_string']",
    inputSpecsEle: "input[name='specs']",
    inputNameEle: "input[name='name']",
    inputTplTypeEle: "input[name='template_type']",
    inputBillTypeEle: "input[name='bill_type']",
    inputTplIdEle: "input[name='template_id']",
    spanBillTypeEle: ".ui-label-header-left .bill-type",
    spanSpecsEle: ".ui-label-header-left .specs",
    menuTabContentTitle: ".ui-label-right-opration>p",
    hotKeyPannel: ".ui-label-hotkey-panel",
    localImg: "#localImg",
    previewImg: "#previewImg",
    showLocalImgSrc: "#showLocalImgSrc",
    tabsContentPannel: "#tabs_content",
    tabsContentPannelCtEle: "#tabs_content .wms-content-text",
    tabsContentPannelTaEle: "#tabs_content .wms-text-align",
    tabsContentPannelFfEle: "#tabs_content .wms-font-family",
    tabsContentPannelFsEle: "#tabs_content .wms-font-size",
    tabsContentPannelLhEle: "#tabs_content .wms-line-height",
    tabsContentPannelFwEle: "#tabs_content .font-weight",
    tabsComprehensivePannel: "#tabs_comprehensive",
    tabsComprehensivePannelCnEle: "#tabs_comprehensive .wms-person-name",
    tabsComprehensivePannelCsEle: "#tabs_comprehensive .wms-person-street",
    tabsComprehensivePannelCaEle: "#tabs_comprehensive .wms-person-area",
    tabsComprehensivePannelCpEle: "#tabs_comprehensive .wms-person-postcode",
    tabsComprehensivePannelCceEle: "#tabs_comprehensive .wms-person-country-en",
    tabsComprehensivePannelCccEle: "#tabs_comprehensive .wms-person-country-cn",
    tabsComprehensivePannelCt1Ele: "#tabs_comprehensive .wms-person-tel1",
    tabsComprehensivePannelCt2Ele: "#tabs_comprehensive .wms-person-tel2",
    tabsComprehensivePannelCeEle: "#tabs_comprehensive .wms-person-email",
    tabsComprehensivePannelTaEle: "#tabs_Comprehensive .wms-text-align",
    tabsComprehensivePannelFfEle: "#tabs_Comprehensive .wms-font-family",
    tabsComprehensivePannelFsEle: "#tabs_Comprehensive .wms-font-size",
    tabsComprehensivePannelLhEle: "#tabs_Comprehensive .wms-line-height",
    tabsComprehensivePannelFwEle: "#tabs_Comprehensive .font-weight",
    tabsFontPannel: "#tabs_font",
    tabsFontPannelPnEle: "#tabs_font .wms-person-name",
    tabsFontPannelPsEle: "#tabs_font .wms-person-street",
    tabsFontPannelPaEle: "#tabs_font .wms-person-area",
    tabsFontPannelPpEle: "#tabs_font .wms-person-postcode",
    tabsFontPannelPceEle: "#tabs_font .wms-person-country-en",
    tabsFontPannelPcnEl: "#tabs_font .wms-person-country-cn",
    tabsFontPannelPt1Ele: "#tabs_font .wms-person-tel1",
    tabsFontPannelPt2Ele: "#tabs_font .wms-person-tel2",
    tabsFontPannelPeEle: "#tabs_font .wms-person-email",
    tabsFontPannelPibEle: "#tabs_font .wms-person-inline-block",
    tabsBorderPannel: "#tabs_border",
    tabsBorderPannelSbtEle: "#tabs_border .wms-show-boder-top",
    tabsBorderPannelSbbEle: "#tabs_border .wms-show-boder-bottom",
    tabsBorderPannelSblEle: "#tabs_border .wms-show-boder-left",
    tabsBorderPannelSbrEle: "#tabs_border .wms-show-boder-right",
    tabsBorderPannelPtEle: "#tabs_border .wms-padding-top",
    tabsBorderPannelPbELe: "#tabs_border .wms-padding-bottom",
    tabsBorderPannelPlEle: "#tabs_border .wms-padding-left",
    tabsBorderPannelPrELe: "#tabs_border .wms-padding-right",
    tabsBorderPannelBtwEle: "#tabs_border .wms-border-top-width",
    tabsBorderPannelBbwEle: "#tabs_border .wms-border-bottom-width",
    tabsBorderPannelBlwEle: "#tabs_border .wms-border-left-width",
    tabsBorderPannelBrwEle: "#tabs_border .wms-border-right-width",
    tabsStylesPannelWhEle: "#tabs_styles .wms-styles-wh",
    tabsStylesPannelPEle: "#tabs_styles .wms-styles-plus",
    tabsStylesPannelCEle: "#tabs_styles .wms-styles-count",
    tabsStylesPannelAEle: "#tabs_styles .wms-styles-all",
    tabsStylesPannelBsEle: "#tabs_styles .wms-border-style",
    tabsStylesPannelBwle: "#tabs_styles .wms-border-width",
    tabsUploadPannel: "#tabs_upload",
    tabsCustomPannel: "#tabs_custom",
    tabsCustomPannelDbEle: "#tabs_custom .double-bind",
    tabsCustomPannelTaELe: "#tabs_custom .wms-text-align",
    tabsCustomPannelFfEle: "#tabs_custom .wms-font-family",
    tabsCustomPannelFsEle: "#tabs_custom .wms-font-size",
    tabsCustomPannelLhEle: "#tabs_custom .wms-line-height",
    tabsCustomPannelFwEle: "#tabs_custom .wms-font-weight",
    tabsTablePannel: "#tabs_table",
    tabsTablePannelTbEle: "#tabs_table .wms-table-border",
    tabsTablePannelThEle: "#tabs_table .wms-table-header",
    tabsTablePannelHffEle: "#tabs_table .wms-thead-font-family",
    tabsTablePannelHfsEle: "#tabs_table .wms-thead-font-size",
    tabsTablePannelBffEle: "#tabs_table .wms-tbody-font-family",
    tabsTablePannelBfsEle: "#tabs_table .wms-tbody-font-size",
    tabsTablePannelTfEle: "#tabs_table .wms-table-footer",
    tabsTablePannelTffEle: "#tabs_table .wms-tfoot-font-family",
    tabsTablePannelTfsEle: "#tabs_table .wms-tfoot-font-size",
    tabsBarcodePannel: "#tabs_barcode",
    tabsBarcodePannelBcEle: "#tabs_barcode .wms-barcode",
    tabsBarcodePannelTaEle: "#tabs_barcode .wms-text-align",
    tabsBarcodePannelFsEle: "#tabs_barcode .wms-font-size",
    tabsBarcodePannelFwEle: "#tabs_barcode .wms-font-weight",
    tabsBarcodePannelWEle: "#tabs_barcode .wms-width",
    tabsTitlePannel: "#tabs_title",
    tabsTitlePannelStEle: "#tabs_title .wms-show-title",
    tabsTitlePannelTcEle: "#tabs_title .wms-title-content",
    tabsTitlePannelSlEle: "#tabs_title .wms-show-line",
    tabsTitlePannelTaEle: "#tabs_title .wms-text-align",
    tabsTitlePannelPbEle: "#tabs_title .wms-padding-bottom",
    tabsTitlePannelFfEle: "#tabs_title .wms-font-family",
    tabsTitlePannelFsEle: "#tabs_title .wms-font-size",
    tabsTitlePannelLhEle: "#tabs_title .wms-line-height",
    tabsTitlePannelFwEle: "#tabs_title .wms-font-weight",
    tabsTitlePannelWcEle: "#tabs_title .wms-wrap-content",
    tabsDatePannel: "#tabs_date",
    tabsDatePannelSyEle: "#tabs_date .wms-show-year",
    tabsDatePannelDfEle: "#tabs_date .wms-date-format",
    tabsDatePannelTaEle: "#tabs_date .wms-text-align",
    tabsDatePannelFfEle: "#tabs_date .wms-font-family",
    tabsDatePannelFsEle: "#tabs_date .wms-font-size",
    tabsDatePannelLhEle: "#tabs_date .wms-line-height",
    tabsDatePannelFwEle: "#tabs_date .wms-font-weight",
    tabsTableContentPannel: "#tabs_table_content",
    tabsTableContentPannelThdEle: "#tabs_table_content .wms-thead-decs",
    tabsTableContentPannelThnEle: "#tabs_table_content .wms-thead-name",
    tabsTableContentPannelSncEle: "#tabs_table_content .wms-sku-name-cn",
    tabsTableContentPannelSneEle: "#tabs_table_content .wms-sku-name-en",
    tabsTableContentPannelSEle: "#tabs_table_content .wms-sku",
    tabsTableContentPannelSqEle: "#tabs_table_content .wms-sku-qty",
    tabsTableContentPannelThwEle: "#tabs_table_content .wms-thead-weight",
    tabsTableContentPannelThpEle: "#tabs_table_content .wms-thead-price",
    tabsTableContentPannelTfEle: "#tabs_table_content .wms-tfoot",
    tabsTableContentPannelTfdEle: "#tabs_table_content .wms-tfoot-decs",
    tabsTableContentPannelTfwEle: "#tabs_table_content .wms-tfoot-weight",
    tabsTableContentPannelTfpEle: "#tabs_table_content .wms-tfoot-price",
    tabsTableContentPannelTfaEle: "#tabs_table_content .wms-tfoot-abbr",
    tabsTableCustomPannel: "#tabs_table_custom",
    tabsTableCustomPannelThfEle: "#tabs_table_custom .wms-thead-first",
    tabsTableCustomPannelThsEle: "#tabs_table_custom .wms-thead-second",
    tabsTableCustomPannelThhEle: "#tabs_table_custom .wms-thead-three",
    tabsTableCustomPannelTbfEle: "#tabs_table_custom .wms-tbody-first",
    tabsTableCustomPannelTbsEle: "#tabs_table_custom .wms-tbody-second",
    tabsTableCustomPannelTbtEle: "#tabs_table_custom .wms-tbody-three",
    tabsTableCustomPannelTffEle: "#tabs_table_custom .wms-tfoot-first",
    tabsTableCustomPannelTfsEle: "#tabs_table_custom .wms-tfoot-second",
    tabsTableCustomPannelTftEle: "#tabs_table_custom .wms-tfoot-three",
    tabsTableCustomPannelTaddEle: "#tabs_table_custom .wms-table-add-row",
    tabsTableCustomPannelTdelEle: "#tabs_table_custom .wms-table-delet-row",
    tabsTableCustomPannelTrowEle: "#tabs_table_custom .wms-tbody-row",
};

export default CreatNewLabel;
