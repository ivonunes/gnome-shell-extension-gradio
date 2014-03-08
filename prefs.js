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

const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Gio = imports.gi.Gio;

const Gettext = imports.gettext;
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

function init() {
    Gettext.textdomain("gradio@ivoavnunes.gmail.com");
    let localeDir = Me.dir.get_child('locale');
    Gettext.bindtextdomain("gradio@ivoavnunes.gmail.com", localeDir.get_path());
}

function buildPrefsWidget() {
    var settings = Utils.getSettings();

    let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                             border_width: 10});
    let main_box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                            margin: 20, margin_top: 10 });

     //first label
    var info1 = new Gtk.Label ({label: "<b>" + _("Insert a stream") + "</b>", xalign: 0, use_markup: true});
    main_box.pack_start (info1, false, false, 5);

     //"insert a stream" horizontal box
    var insert_box = new Gtk.Box ({orientation: Gtk.Orientation.HORIZONTAL, spacing: 5});
    main_box.pack_start (insert_box, false, false, 5);

     //Name field
    insert_box.pack_start (new Gtk.Label ({label: _("Name:")}), false, false, 5);
    this.name_entry = new Gtk.Entry ();
    insert_box.pack_start (this.name_entry, false, false, 5);

     //URL field
    insert_box.pack_start (new Gtk.Label ({label: _("URL:")}), false, false, 5);
    this.url_entry = new Gtk.Entry ({activates_default: true});
    insert_box.pack_start (this.url_entry, true, true, 5);

    //Insert button
    var insert_button = new Gtk.Button ({label: _("Add"), can_default: true});
    insert_button.connect ("clicked", Lang.bind (this, function () {
        this.streams.push([this.name_entry.text, this.url_entry.text]);

        this.list.insert(new Gtk.Label({label: this.name_entry.text}), this.list.get_children().length);
        this.name_entry.text = "";
        this.url_entry.text = "";
        this.list.show_all ();

        settings.set_string("streams", JSON.stringify(this.streams));
        settings.sync();
    }));
    insert_box.pack_start (insert_button, false, false, 5);
    insert_button.grab_default ();

    var info2 = new Gtk.Label ({label: "<b>" + _("Streams") + "</b>", xalign: 0, use_markup: true});
    main_box.pack_start (info2, false, false, 5);
    this.list = new Gtk.ListBox();

    var streams_settings = settings.get_string('streams');
    if (streams_settings.length > 0) this.streams = JSON.parse(streams_settings);
    else this.streams = [["Radio Paradise","http://37.130.228.60:8012"]];

    for (var i = 0; i < this.streams.length; i++) {
        this.list.insert(new Gtk.Label({label: this.streams[i][0]}), this.list.get_children().length);
    }

    var sw = new Gtk.ScrolledWindow ({shadow_type:Gtk.ShadowType.IN});
    sw.add (this.list);
    main_box.pack_start (sw, true, true, 5);

    // Remove button
    var remove_button = new Gtk.Button ({label: _("Remove"), can_default: true});
    remove_button.connect ("clicked", Lang.bind (this, function () {
        for (var i = 0; i < this.streams.length; i++) {
            if (this.list.get_selected_row().get_child().label == this.streams[i][0]) {
                this.streams.splice(i, 1);
                this.list.remove(this.list.get_selected_row());
                break;
            }
        }

        settings.set_string("streams", JSON.stringify(this.streams));
        settings.sync();
    }));
    main_box.pack_start (remove_button, true, true, 5);

    frame.add(main_box);
    frame.show_all();

    return frame;
}
