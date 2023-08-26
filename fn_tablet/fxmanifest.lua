fx_version 'cerulean'
game 'gta5'

description 'Cool Radio, Edited by Benzo & Mycroft'
version '1.0'
lua54 'yes'

author 'Finnllex'

shared_scripts  {
    'config.lua', 
    'utils/utils.lua'
}

server_scripts {
    'utils/server.lua',
    'server/version.lua'
}

client_scripts {
    'client/client.lua'
}

ui_page('html/ui.html')

files {
    'html/**',
    'api/**',
    'default_app_icon.png'
}
