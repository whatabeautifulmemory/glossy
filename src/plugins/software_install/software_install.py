# coding: utf-8
import os
import dateutil.parser
import rapidjson
from collections import Counter
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
from utils.plugin_tools.convert_tag_list import convert_tag_list_using_name_property


class SoftwareInstallPlugin(PluginBase):
    name = "software_install"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def _get_heatmap_json(self, events):
        _buf = []
        for item in events:
            time_created = item.get("_Metadata", {}).get("LocalTimeCreated", None)

            if not time_created:
                continue

            date = dateutil.parser.parse(time_created).strftime("%Y-%m-%d")
            _buf.append(date)

        counted = list(Counter(_buf).items())

        return rapidjson.dumps(counted)

    def ajax_installation_heatmap_msi(self):
        filtered = list(filter(lambda x: "MsiInstaller" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("1033",), self.events.values()))

        return self._get_heatmap_json(filtered)

    def ajax_events_msi(self):
        filtered = list(filter(
            lambda x: "MsiInstaller" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("1033", "1034", "1035")
            , self.events.values()
        ))

        for event in filtered:
            data_tags = event["EventData"]["Data"]

            converted = convert_tag_list_using_name_property(data_tags)
            event["_PluginOutput"] = converted

        return rapidjson.dumps(filtered)

    def ajax_installation_heatmap_program_inventory(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Application-Experience" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("903", "904",)
            , self.events.values()
        ))

        return self._get_heatmap_json(filtered)

    def ajax_events_program_inventory(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Application-Experience" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("903", "904", "905", "906", "907", "908")
            , self.events.values()
        ))

        return rapidjson.dumps(filtered)

    def ajax_installation_heatmap_shell_core(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Shell-Core" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("28115",)
            , self.events.values()
        ))
        return self._get_heatmap_json(filtered)

    def ajax_events_shell_core(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Shell-Core" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("28115",)
            , self.events.values()
        ))

        for event in filtered:
            data_tags = event["EventData"]["Data"]

            converted = convert_tag_list_using_name_property(data_tags)
            event["_PluginOutput"] = converted

        return rapidjson.dumps(filtered)

    def _get_installation_registry_events(self):
        return_value = []

        filtered = list(filter(
            lambda x: "Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name",None) and ("4657" == x.get("System", {}).get("EventID", {}).get("#text", None))
            , self.events.values()
        ))

        for event in filtered:
            data_tags = event["EventData"]["Data"]

            converted = convert_tag_list_using_name_property(data_tags)
            event["_PluginOutput"] = converted

            for k in ("ProcessId", "HandleId"):
                if k in event["_PluginOutput"]:
                    event["_PluginOutput"]["%s_Numeric" % k] = int(event["_PluginOutput"][k], 16)

            if "\\registry\\machine\\software\\microsoft\\windows\\currentversion\\uninstall\\" in event["_PluginOutput"].get("ObjectName", "").lower():
                return_value.append(event)

        return return_value

    def ajax_installation_heatmap_registry(self):
        filtered = self._get_installation_registry_events()
        return self._get_heatmap_json(filtered)

    def ajax_events_registry(self):
        filtered = self._get_installation_registry_events()
        return rapidjson.dumps(filtered)

    @jinja2_view("software_install.html")
    def index(self):
        return {}
