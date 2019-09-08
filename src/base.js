import { utilBrowserType } from "./utils";

class Base {
    constructor() {}

    _delegate(name, selector, func) {
        $(document).on(name, selector, func);
    }

    _undelegate(name, selector, func) {
        $(document).on(name, selector, func);
    }

    _scanEventsMap(maps, isOn) {
        var delegateEventSplitter = /^(\S+)\s*(.*)$/;
        var bind = isOn ? this._delegate : this._undelegate;
        for (var keys in maps) {
            if (Object.prototype.hasOwnProperty.call(maps, keys)) {
                var matchs = keys.match(delegateEventSplitter);
                maps[keys] = this[maps[keys]].bind(this);
                bind(matchs[1], matchs[2], maps[keys]);
            }
        }
    }

    initializeOrdinaryEvents(maps) {
        this._scanEventsMap(maps, true);
    }

    uninitializeOrdinaryEvents(maps) {
        this._scanEventsMap(maps);
    }

    bindEvent(maps) {
        this.initDrag();
        this.initDrap();
        this.initEleDragAndResize();
        this.positionCenter(this.contentDivWrap);
        this.resizeChangeCenter(this.contentDivWrap);
        this.leaveCurrentPageTips();
        this.currentBrowser = utilBrowserType();
        this.initializeOrdinaryEvents(maps);
    }

    unbindEvent(maps) {
        this.uninitDrag();
        this.uninitDrap();
        this.uninitializeOrdinaryEvents(maps);
    }

    destroy(maps) {
        this.unbindEvent(maps);
    }

    initialization() {
        this.bindEvent(this.eventsMap);
    }

    initializeElements(eles) {
        for (var name in eles) {
            if (Object.prototype.hasOwnProperty.call(eles, name)) {
                this[name] = $(eles[name]);
            }
        }
    }
}

export default Base;
