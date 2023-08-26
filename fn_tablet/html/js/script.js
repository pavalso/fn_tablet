let container = $(".container");
let appsCache = $("#running-apps");


let runningApps = new Set();

let focusedApp = null;

const SHARED_ATTRIBUTES = {};

$(function() {
    window.addEventListener(tablet.EVENTS.DO_FETCH_ATTRIBUTES, function(event) {
        event.detail.callback(SHARED_ATTRIBUTES);
    });

    tablet.registerEventHandler("doInitiate", function(_, data) {
        tablet.updateCache();
        let apps = {};

        for (const [_, raw] of Object.entries(data.allApps)) {
            let json = {};
            if (raw.config != null) {
                try {
                    json = JSON.parse(raw.config);
                } catch (e) {
                    console.error("Failed to parse app " + raw.id);
                    return;
                }
            }

            json.id = raw.id;
            json.installed = data.configuration.preinstalledApps.includes(raw.id);

            apps[raw.id] = new App(json);
        };

        tablet.apps.all = apps;
        tablet.apps.home = apps[data.configuration.homeApp];
        tablet.apps.home.isHome = true;
        tablet.apps.defaultIcon = data.configuration.defaultAppIcon;
        tablet.state = tablet.STATES.OPEN;

        tablet.apps.open();
    });

            DO_UPDATE: "doUpdate",
    tablet.registerEventHandler(tablet.EVENTS.DO_UPDATE, function(_, data) {
        openApp(data.appId);
    });

    tablet.registerEventHandler(tablet.EVENTS.DO_INSTALL_APP, function(_, data) {
        installApp(data.appId);
    });

    tablet.registerEventHandler(tablet.EVENTS.DO_UNINSTALL_APP, function(_, data) {
        uninstallApp(data.appId);
    });

    tablet.registerEventHandler(tablet.EVENTS.DO_OPEN, function(_) {
        tablet.state = tablet.STATES.OPEN;
        container.attr("id", "open");
    });

    tablet.registerEventHandler(tablet.EVENTS.DO_CLOSE, function(_) {
        tablet.state = tablet.STATES.CLOSED;
        container.attr("id", "closed");
    });
});

$(document).on("click", ".footer_btn", function(_) {
    switch ($(this).attr("id")) {
        case "home_btn":
            tablet.apps.open();
            break;
        case "back_btn":
            if (tablet.triggerEvent(tablet.CONTROL_EVENTS.BACK, {}, focusedApp.id)) {
                tablet.apps.open();
            }
            break;
        case "cache_btn":
            // Open cached apps menu
            break;
        default:
            console.error("Unknown button: " + $(this).attr("id"));
            break;
    }
});

function openApp(appId) {

    function swap(focus, hide) {
        if (hide != null) {
            hide.iframe.css("z-index", hide.isHome ? 0 : -1);
        }
        focus.iframe.css("z-index", 1);
        focusedApp = focus;
        tablet.triggerEvent(tablet.CONTROL_EVENTS.APP_IS_FOCUSED, {}, focus.id);
    }

    let app = tablet.apps.all[appId];

    if (app == null) {
        console.error("App " + appId + " does not exist");
        return;
    }

    if (focusedApp != null && focusedApp.id == app.id) {
        return;
    }

    if (runningApps.has(appId)) {
        swap(app, focusedApp)
        return;
    }

    appsCache.append(
        `<iframe src="${app.appUrl}" id="${appId}" class="running-app" type="text/html"></iframe>`
    );

    let newAppFrame = appsCache.children().last();
    runningApps.add(appId);

    app.iframe = newAppFrame;

    swap(app, focusedApp)
}

function installApp(appId) {
    let app = tablet.apps.all[appId];

    if (app == null) {
        console.error("App " + appId + " does not exist");
        return;
    }

    if (app.installed) {
        console.error("App " + appId + " is already installed");
        return;
    }
    
    app.installed = true;
    tablet.triggerEvent(tablet.CONTROL_EVENTS.APP_LIST_UPDATED);
}

function uninstallApp(appId) {
    let app = tablet.apps.all[appId];

    if (app == null) {
        console.error("App " + appId + " does not exist");
        return;
    }

    if (!app.installed) {
        console.error("App " + appId + " is not installed");
        return;
    }

    app.installed = false;
    tablet.triggerEvent(tablet.CONTROL_EVENTS.APP_LIST_UPDATED);
}
