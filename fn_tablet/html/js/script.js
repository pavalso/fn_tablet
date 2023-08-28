let container = $(".container");
let appsCache = $("#running-apps");


let runningApps = new Set();

let focusedApp = null;

$(function() {
    tablet.app.registerEventHandler("doInitiate", function(_, data) {
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

            apps[raw.id] = App.from(json);
        };

        tablet.apps.all = apps;
        tablet.apps.home = apps[data.configuration.homeApp];
        tablet.apps.defaultIcon = data.configuration.defaultAppIcon;
        tablet.apps.open();
    });

    tablet.app.registerEventHandler(tablet.EVENTS.DO_OPEN, function(_) {
        tablet.open();
    });

    tablet.app.registerEventHandler(tablet.EVENTS.DO_CLOSE, function(_) {
        tablet.close();
    });

    tablet.app.registerEventHandler(tablet.EVENTS.DO_INSTALL_APP, function(_, data) {
        tablet.apps.install(tablet.apps.all[data.id]);
    });

    tablet.app.registerEventHandler(tablet.EVENTS.DO_UNINSTALL_APP, function(_, data) {
        tablet.apps.uninstall(tablet.apps.all[data.id]);
    });
});

$(document).on("click", ".footer_btn", function(_) {
    switch ($(this).attr("id")) {
        case "home_btn":
            tablet.apps.open();
            break;
        case "back_btn":
            if (tablet.app.triggerEvent(tablet.CONTROL_EVENTS.BACK, {}, focusedApp.id)) {
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

function openApp(app) {
    function swap(focus, hide) {
        if (hide != null) {
            hide.iframe[0].style.zIndex = hide.isHome ? 0 : -1;
        }
        focus.iframe[0].style.zIndex = 1;
        focusedApp = focus;
        focus.iframe[0].animate([{opacity: 0.5},{opacity: 1}], {fill: "forwards", duration: 300});
        tablet.app.triggerEvent(tablet.CONTROL_EVENTS.APP_IS_FOCUSED, {}, focus.id);
    }

    if (focusedApp != null && focusedApp.id == app.id) {
        return;
    }

    if (runningApps.has(app.id)) {
        swap(app, focusedApp)
        return;
    }

    appsCache.append(
        `<iframe src="${app.url}/ui.html" id="${app.id}" class="running-app" type="text/html"></iframe>`
    );

    let newAppFrame = appsCache.children().last();
    runningApps.add(app.id);

    app.iframe = newAppFrame;

    swap(app, focusedApp)
}
