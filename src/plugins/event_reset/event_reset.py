# coding: utf-8
import os
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase


class EventResetPlugin(PluginBase):
    name = "event_reset"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def ajax_events(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Eventlog" == x.get("System", {}).get("Provider", {}).get("@Name", None) and
                      x.get("System", {}).get("EventID", {}).get("#text", None) in ("1102", "104"),
            self.events.values()
        ))

        for event in filtered:
            event_id = event.get("System", {}).get("EventID", {}).get("#text", None)
            cleared_event_log = ""

            if "1102" == event_id:
                cleared_event_log = "Security"

            elif "104" == event_id:
                cleared_event_log = event.get("UserData", {}).get("LogFileCleared", {}).get("Channel", {}).get("#text", "")

            event["_PluginOutput"] = {}
            event["_PluginOutput"]["ClearedEventLog"] = cleared_event_log

        return rapidjson.dumps(filtered)

    @jinja2_view("event_reset.html")
    def index(self):
        return {}
