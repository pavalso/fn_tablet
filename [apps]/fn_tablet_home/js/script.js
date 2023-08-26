let downloadedAppList = window.$(".downloaded-apps");


$(function() {
    tablet.updateCache();

    let installed = tablet.apps.installed;

    updateAppList();

    tablet.registerEventHandler(tablet.CONTROL_EVENTS.APP_LIST_UPDATED, _ => updateAppList());

    $(document).on("click", ".app-container", function(_) {
        tablet.apps.open(installed[$(this).parent().attr("id")]);
    });

    function updateAppList() {
        installed = tablet.apps.installed;

        downloadedAppList.empty();
    
        for (const [_, app] of Object.entries(installed)) {
            if (app.isHome) {
                continue;
            }
    
            downloadedAppList.append(
                `<div class="app" id="${app.id}">
                    <div class = "app-container">
                        <img src="https://cfx-nui-${app.id}/${app.icon}" alt="" onerror="defaultAppImg(this)">
                        <p>${app.name}</p>
                    </div>
                </div>`);
        }
    }
});

function defaultAppImg(image) {
    image.onerror = "";
    image.src = tablet.apps.defaultIcon;
}