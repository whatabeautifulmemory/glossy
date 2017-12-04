# coding: utf-8
import os
import rapidjson
from collections import Counter
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
from utils.plugin_tools.sort import sort_by_timecreated


class ShowAllPlugin(PluginBase):
    name = "show_all"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def ajax_statistics(self):
        return_value = []

        _buf = []
        for event in self.events.values():
            computer_name = event.get("System", {}).get("Computer", {}).get("#text", "")
            provider_name = event.get("System", {}).get("Provider", {}).get("@Name", "")
            event_id = event.get("System", {}).get("EventID", {}).get("#text", "")
            _buf.append(
                (computer_name, provider_name, event_id)
            )

        summarized = Counter(_buf)

        for k, v in summarized.items():
            return_value.append({
                "computer_name": k[0],
                "provider_name": k[1],
                "event_id": k[2],
                "count": v
            })

        _buf.clear()

        return rapidjson.dumps(return_value)

    def ajax_events(self):
        return_value = []

        filtered = self.events.values()

        for event in filtered:
            return_value.append({
                "_id": event.get("_id", None),
                "level": event.get("System", {}).get("Level", {}).get("#text", ""),
                "source": event.get("_Metadata", {}).get("Source", ""),
                "provider": event.get("System", {}).get("Provider", {}).get("@Name", ""),
                "event_id": event.get("System", {}).get("EventID", {}).get("#text", ""),
                "computer": event.get("System", {}).get("Computer", {}).get("#text", ""),
                "localtimecreated": event.get("_Metadata", {}).get("LocalTimeCreated", "")
            })

        return rapidjson.dumps(return_value)

    @jinja2_view("show_all.html")
    def index(self):
        return {}
