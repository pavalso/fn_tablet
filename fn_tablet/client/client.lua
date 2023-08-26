local isClosed = true
local isFirstTime = true

local allApps = {}


RegisterCommand("tablet", function(source)
    if isClosed then
        openTablet()
    else
        closeTablet()
    end
    isClosed = not isClosed
end)

RegisterCommand("installApp", function(source, args)
    SendNUIMessage({type = "doInstallApp", appId = args[1]})
end)

RegisterCommand("uninstallApp", function(source, args)
    SendNUIMessage({type = "doUninstallApp", appId = args[1]})
end)

function openTablet()
    if isFirstTime then
        isFirstTime = false
        SendNUIMessage({type = "doInitiate", configuration = Tablet, allApps = allApps})
    end
    SetNuiFocus(true, true)
    SendNUIMessage({type = "doOpen"})
end

function closeTablet()
    SetNuiFocus(false, false)
    SendNUIMessage({type = "doClose"})
end

RegisterNUICallback("openApp", function(data, cb)
    SendNUIMessage({type = "doUpdate", appId = data.appId})
    cb()
end)

-- What is the 288 key? It's F1. You can find a list of all the controls here:
-- https://docs.fivem.net/game-references/controls/

Citizen.CreateThread(function()
    local resourcesApps = getAppsInResources()
    allApps = loadConfigurationFromResources(resourcesApps)

    while true do
        Citizen.Wait(0)
        if IsControlJustPressed(0, 288) then
            if isClosed then
                openTablet()
            else
                closeTablet()
            end
            isClosed = not isClosed
        end
    end
end)

function getAppsInResources()
    local apps = {}
    local i = 1

    for index=0, GetNumResources() - 1 do
        local resource = GetResourceByFindIndex(index)
        if GetNumResourceMetadata(resource, "fn_app") == 1 then
            apps[i] = resource
            i = i + 1
        end
    end

    return apps
end

function loadConfigurationFromResources(resources)
    local appsConfiguration = {}
    local i = 1

    for _, appId in pairs(resources) do
        appState = GetResourceState(appId)
        if not (appState == "missing") then
            local appConfig = LoadResourceFile(appId, "config.json")
            local appMeta = {
                id = appId,
                config = appConfig
            }
            appsConfiguration[i] = appMeta
            i = i + 1
        else
            print("App " .. appId .. " is missing")
        end
    end

    return appsConfiguration
end