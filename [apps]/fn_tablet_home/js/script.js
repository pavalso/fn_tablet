$(function() {
    const APP_LIST = window.$(".downloaded-apps");

    let installed = null;

    updateAppList();

    tablet.app.registerEventHandler(tablet.CONTROL_EVENTS.APP_LIST_UPDATED, _ => updateAppList());

    $(document).on("click", ".app-container", function(_) {
        let anim = $(this)[0].children[0].animate({opacity: 0.4, transform: "scale(0.8)"}, 50);
        anim.onfinish = () => tablet.apps.open(installed[$(this).parent().attr("id")]);
    });

    function updateAppList() {
        installed = tablet.apps.installed;

        APP_LIST.empty();
    
        for (const app of Object.values(installed)) {
            if (app.isHome) {
                continue;
            }

            APP_LIST.append(
                `<div class="app" id="${app.id}">
                    <div class = "app-container">
                        <img src="${app.url}/${app.icon}" alt="" onerror="defaultAppImg(this)">
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
