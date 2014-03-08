/*
 * Copyright (C) 2014 Ivo Nunes <ivoavnunes@gmail.com>
 *
 * This software is licensed under the GNU General Public License
 * (version 3 or later). See the COPYING file in this distribution.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this software; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */

const Lang = imports.lang;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Gst = imports.gi.Gst;
const Gettext = imports.gettext;
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const RadioSubMenu = new Lang.Class({
    Name: 'RadioSubMenu',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init: function() {
        this.parent(_("Radio"), true);

        // get settings
        this.settings = Utils.getSettings();

        // initialize the player
        this._playing = false;
        this.player = Gst.ElementFactory.make("playbin", "player");
        this.bus = this.player.get_bus();
        this.bus.add_signal_watch();

        // connect the dbus events
        this.bus.connect("message::error", Lang.bind(this, function(bus, message) {
            this._killStream();
            return true;
        }));
        this.bus.connect("message::eos", Lang.bind(this, function(bus, message) {
            this._killStream();
        }));

        this.actor.show();

        this.menu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
            if (isOpen)
                this._updateStreamList();
        }));

        let item = new PopupMenu.PopupMenuItem(_("Radio"));
        this.menu.addMenuItem(item);
    },

    _killStream: function () {
        // set current stream to none
        this._playing = false;
        this.label.set_text(_("Radio"));
        this.icon.icon_name = "";

        this.player.set_state(Gst.State.NULL);
    },

    _updateStreamList: function () {
        var streams_settings = this.settings.get_string('streams');
        if (streams_settings.length > 0) var streams = JSON.parse(streams_settings);
        else var streams = [["Radio Paradise","http://stream-dc1.radioparadise.com/rp_192m.ogg"]];

        // clean the list before updating it
        this.menu.removeAll();

        if (this._playing) {
            // create an item to stop the current streams
            let item = new PopupMenu.PopupMenuItem(_("Stop"));

            item.connect('activate', Lang.bind(this, function() {
                this._killStream();
            }));

            this.menu.addMenuItem(item);
        }

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
    },

    _playStream: function (stream) {
        // make sure nothing is playing first
        this._killStream();
        this._playing = true;

        // set the info in the ui
        this.label.set_text(stream[0]);
        this.icon.icon_name = 'emblem-music-symbolic';

        this.player.set_property("uri", stream[1]);
        this.player.set_state(Gst.State.PLAYING);
    },

    destroy: function() {
        this._playing = false;
        this.player.set_state(Gst.State.NULL);
        this.parent();
    }
});

let radioSubMenu = null;

function init(meta) {
    Gst.init(null, 0);

    Gettext.textdomain("gradio@ivoavnunes.gmail.com");
    let localeDir = meta.dir.get_child('locale');
    Gettext.bindtextdomain("gradio@ivoavnunes.gmail.com", localeDir.get_path());
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
