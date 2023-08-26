//const CONFIG = $(top.document.getElementsByName("fn_tablet")[0].contentDocument.getElementById("config"));


let tablet = null;

class App {
    constructor(json) {
        this.id = json.id;
        this.name = json.name || this.id;
        this.icon = json.icon || tablet.apps.defaultIcon;
        this.installed = json.installed || false;
        this.appUrl = "https://cfx-nui-" + this.id + "/ui.html";
        this.isHome = false;
        this.iframe = null;
    }
}

$(function() {
    const WINDOW = top.document.getElementsByName("fn_tablet")[0].contentWindow;

    let cache = {
        handlers: {}
    };

    tablet = {
        STATES: {
            CLOSED: "closed",
            OPEN: "open",
            DISABLED: "disabled",
            UNINITIALIZED: "uninitialized"
        },

        CONTROL_EVENTS: {
            BACK: "onBackBtnPressed",
            APP_LIST_UPDATED: "onAppListUpdated",
            APP_IS_FOCUSED: "onAppIsFocused"
        },

        EVENTS: {
            DO_UPDATE: "doUpdate",
            DO_INSTALL_APP: "doInstallApp",
            DO_UNINSTALL_APP: "doUninstallApp",
            DO_OPEN: "doOpen",
            DO_CLOSE: "doClose",
            DO_FETCH_ATTRIBUTES: "doFetchAttributes"
        },

        ATTRIBUTES: {
            STATE: "tablet_state",
            APPS_HOME: "apps_home",
            ALL_APPS: "apps_all",
            DEFAULT_APP_ICON: "apps_defaultIcon"
        },

        get state() {
            return cache[tablet.ATTRIBUTES.STATE];
        },
        set state(value) {
            cache[tablet.ATTRIBUTES.STATE] = value;
        },

        config: {

        },

        apps: {
            get home() {
                return cache[tablet.ATTRIBUTES.APPS_HOME];
            },
            set home(value) {
                cache[tablet.ATTRIBUTES.APPS_HOME] = value;
            },
            get all() {
                return cache[tablet.ATTRIBUTES.ALL_APPS];
            },
            set all(value) {
                cache[tablet.ATTRIBUTES.ALL_APPS] = value;
            },
            get defaultIcon() {
                return cache[tablet.ATTRIBUTES.DEFAULT_APP_ICON];
            },
            set defaultIcon(value) {
                cache[tablet.ATTRIBUTES.DEFAULT_APP_ICON] = value;
            },
            get installed() {
                let all = tablet.apps.all;
                return Object.keys(all).reduce(function (filtered, key) {
                    if (all[key].installed) filtered[key] = all[key];
                    return filtered;
                }, {});
            },
            get uninstalled() {
                let all = tablet.apps.all;
                return Object.keys(all).reduce(function (filtered, key) {
                    if (!all[key].installed) filtered[key] = all[key];
                    return filtered;
                }, {});
            },

            install: function(app) {
                tablet.triggerEvent(tablet.EVENTS.DO_INSTALL_APP, {
                    appId: app.id
                });
            },
    
            uninstall: function(app) {
                tablet.triggerEvent(tablet.EVENTS.DO_UNINSTALL_APP, {
                    appId: app.id
                });
            },
    
            open: function(app = null) {
                id = app && app.id || tablet.apps.home.id;
                tablet.triggerEvent(tablet.EVENTS.DO_UPDATE, {
                    appId: id
                });
            }
        },

        close: function() {
            tablet.triggerEvent(tablet.EVENTS.DO_CLOSE);
        },   

        registerEventHandler: function(event, func) {
            if (typeof func != "function") {
                console.error("Event handler must be a function");
                return;
            }

            let id = origin.slice(16);

            if (cache.handlers[event] == null) {
                cache.handlers[event] = {};
            }

            if (cache.handlers[event][id] == null) {
                cache.handlers[event][id] = [];
            }

            cache.handlers[event][id].push(func);
        },

        removeEventHandler: function(event, func) {
            if (cache.handlers[event] == null) {
                return;
            }

            cache.handlers[event].remove(func);
        },

        updateCache: function() {
            let handlers = cache.handlers || {};
            WINDOW.dispatchEvent(new CustomEvent(tablet.EVENTS.DO_FETCH_ATTRIBUTES, {
                detail: {
                    callback: (value) => {
                        cache = value
                        cache.handlers = Object.assign({}, cache.handlers || {}, handlers);;
                    }
                }
            }));
        },

        triggerEvent: function(type, data = null, whitelistedApps = null) {
            return WINDOW.dispatchEvent(new CustomEvent("message", {
                detail: {
                    type: type,
                    whitelistedApps: whitelistedApps,
                    ...(data || {})
                },
                cancelable: true
            }));
        }
    };

    if (WINDOW == window) {
        window.addEventListener("message", event => {
            event.data = event.data == null ? event.detail : event.data;

            let handlers = cache.handlers[event.data.type] || [];

            if (handlers.length == 0) {
                return;
            }

            let whitelistedApps = event.data.whitelistedApps;

            let customEvent = new CustomEvent(event.data.type, {cancelable: true});

            for (const [appId, appHanlders] of Object.entries(handlers)) {
                if (whitelistedApps != null && !whitelistedApps.includes(appId)) {
                    continue;
                }

                if (customEvent.defaultPrevented) {
                    break;
                }

                for (const handler of appHanlders) {
                    handler(customEvent, event.data);
                    if (customEvent.defaultPrevented) {
                        event.preventDefault();
                        break;
                    }
                }
            }
        });
    }
});
