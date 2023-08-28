let tablet = null;

class App {
    constructor(id, name = null, icon = null, installed = false) {
        this.id = id;
        this.name = name || this.id;
        this.icon = icon || tablet.apps.defaultIcon;
        this.installed = installed;
        this.url = "https://cfx-nui-" + this.id;
        this.iframe = null;
    }

    get isHome() {
        return this == tablet.apps.home;
    }

    static from(json){
        return new App(json.id, json.name, json.icon, json.installed);
    }
}

$(function() {
    const WINDOW = top.document.getElementsByName("fn_tablet")[0].contentWindow;

/*    
    const PROXY_HANDLER = {
        get: (target, prop) => {
            let ret = target[prop];
        
            if (ret == null) {
                return ret;
            }

            switch (typeof ret) {
                case "object":
                    return new Proxy(ret, PROXY_HANDLER);
                case "function":
                    return (...args) => {
                        return ret.apply(target, args);
                    }
            };
            return ret;
        }
    };
*/

    if (WINDOW == window) {
        const HANDLERS = {};

        let _tablet = {
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
                DO_CLOSE: "doClose"
            },

            state: null,

            config: {

            },

            apps: {
                home: null,
                all: {},
                defaultIcon: null,

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
                    if (app.installed) {
                        console.error("App " + app.id + " is already installed");
                        return;
                    }
                
                    app.installed = true;
                    tablet.app.triggerEvent(tablet.CONTROL_EVENTS.APP_LIST_UPDATED);
                },

                uninstall: function(app) {
                    if (!app.installed) {
                        console.error("App " + app.id + " is not installed");
                        return;
                    }
                
                    app.installed = false;
                    tablet.app.triggerEvent(tablet.CONTROL_EVENTS.APP_LIST_UPDATED);
                },

                open: function(app = null) {
                    openApp(app || tablet.apps.home);
                }
            },

            open: function() {
                /*
                if (!auth.isRoot(this)) {
                    console.error("Permission denied");
                    return;
                }
                */

                tablet.state = tablet.STATES.OPEN;
                container.attr("id", "open");
            },

            close: function(_) {        
                tablet.state = tablet.STATES.CLOSED;
                container.attr("id", "closed");
            },   
        };

        WINDOW.addEventListener("getSharedObject", function(event) {
            event.detail.callback(_tablet, HANDLERS);
        });

        WINDOW.addEventListener("message", event => {
            event.data = event.data == null ? event.detail : event.data;

            let handlers = HANDLERS[event.data.type] || {};

            if (handlers.length == 0) {
                return;
            }

            let whitelistedApps = event.data.whitelistedApps;

            let customEvent = new CustomEvent(event.data.type, {cancelable: true});

            for (const [appId, handler] of Object.entries(handlers)) {
                if (whitelistedApps != null && !whitelistedApps.includes(appId)) {
                    continue;
                }

                handler(customEvent, event.data);
                if (customEvent.defaultPrevented) {
                    event.preventDefault();
                    break;
                }
            }
        });
    }

    WINDOW.dispatchEvent(new CustomEvent("getSharedObject", {
        detail: {
            callback: (_tablet, handlers) => {
                const _func = {
                    id: origin.slice(16),
                    self: _tablet.apps.all[this.id],
            
                    registerEventHandler: function(event, func) {
                        if (typeof func != "function") {
                            console.error("Event handler must be a function");
                            return;
                        }
            
                        (handlers[event] || (handlers[event] = {}))[this.id] = func;
            
                        return {
                            remove: () => tablet.removeEventHandler(event)
                        }
                    },
            
                    removeEventHandler: function(event) {
                        if (handlers[event] == null) {
                            return;
                        }
            
                        delete handlers[event][this.id];
                    },
            
                    triggerEvent: function(type, data = null, whitelistedApps = null) {
                        return WINDOW.dispatchEvent(new CustomEvent("message", {
                            detail: {
                                type: type,
                                whitelistedApps: whitelistedApps,
                                sender: this.id,
                                ...(data || {})
                            },
                            cancelable: true
                        }));
                    }
                };

                tablet = new Proxy(_tablet, {
                    get: (target, prop) => {
                        switch(prop) {
                            case "app":
                                return _func;
                            default:
                                return target[prop];
                        }
                    }
                });
            }
            /*
            callback: value => {
                tablet = new Proxy(value, PROXY_HANDLER);
                PERM.tablet = tablet;
            }
            */
        }
    }));
});
