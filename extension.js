const Lang = imports.lang;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;

const RadioSubMenu = new Lang.Class({
    Name: 'RadioSubMenu',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init: function() {
        this.parent('None', true);

        // kill all active streams
        this._killStream();

        this.actor.show();

        this.menu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
            if (isOpen)
                this._updateStreamList();
        }));

        let item = new PopupMenu.PopupMenuItem('None');
        this.menu.addMenuItem(item);
    },

    _killStream: function () {
        // set current stream to none
        this.label.set_text("None");
        this.icon.icon_name = "";

        try {
            GLib.spawn_async(null, ["killall", "mplayer"], null, GLib.SpawnFlags.SEARCH_PATH, null);
        } catch (err) {
        }
    },

    _updateStreamList: function () {
        // streams list. TODO: load from file
        let streams = [
            ["Radio Paradise", "http://37.130.228.60:8012"]
        ];

        // clean the list before updating it
        this.menu.removeAll();

        // for each stream in our list
        for(i = 0; i < streams.length; i++) {
            let item = new PopupMenu.PopupMenuItem(streams[i][0]);
            let stream = streams[i];

            // play stream on activate
            item.connect('activate', Lang.bind(this, function() {
                this._playStream(stream);
            }));

            this.menu.addMenuItem(item);
        }

        // create an item to stop the current stream
        let item = new PopupMenu.PopupMenuItem("None");

        item.connect('activate', Lang.bind(this, function() {
            this._killStream();
        }));

        this.menu.addMenuItem(item);
    },

    _playStream: function (stream) {
        // make sure nothing is playing first
        this._killStream();

        // set the info in the ui
        this.label.set_text(stream[0]);
        this.icon.icon_name = 'emblem-music-symbolic';

        // start the stream
        try {
            GLib.spawn_async(null, ["mplayer", stream[1]], null, GLib.SpawnFlags.SEARCH_PATH, null);
        } catch (err) {
            this.label.set_text("None");
            this.icon.icon_name = "";
        }
    },

    destroy: function() {
        this.parent();
    }
});

let radioSubMenu = null;

function init() {
}

function enable() {
    if (radioSubMenu != null)
        return;
    radioSubMenu = new RadioSubMenu();

    let volMen = Main.panel.statusArea.aggregateMenu._volume._volumeMenu;
    let items = volMen._getMenuItems();
    let i = 0;
    while (i < items.length)
        if (items[i] === volMen._output.item)
            break;
        else
            i++;
    volMen.addMenuItem(radioSubMenu, i+1);
}

function disable() {
    radioSubMenu.destroy();
    radioSubMenu = null;
}
