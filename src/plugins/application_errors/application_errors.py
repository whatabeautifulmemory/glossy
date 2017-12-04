# coding: utf-8
import os
import itertools
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase


class ApplicationErrorsPlugin(PluginBase):
    name = "application_errors"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def get_default_data(self):
        filtered = list(filter(
            lambda x: "Application Error" == x.get("System", {}).get("Provider", {}).get("@Name", None) and "1000" == x.get("System", {}).get("EventID", {}).get("#text", None),
            self.events.values()
        ))

        for event in filtered:
            data_list = event.get("EventData", {}).get("Data", [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}])

            try:
                event["_PluginOutput"] = {}
                event["_PluginOutput"]["ProcessName"] = data_list[0].get("#text", None)
                event["_PluginOutput"]["ProcessVersion"] = data_list[1].get("#text", None)
                event["_PluginOutput"]["ProcessTimestamp"] = data_list[2].get("#text", None)
                event["_PluginOutput"]["ModuleName"] = data_list[3].get("#text", None)
                event["_PluginOutput"]["ModuleVersion"] = data_list[4].get("#text", None)
                event["_PluginOutput"]["ModuleTimestamp"] = data_list[5].get("#text", None)
                event["_PluginOutput"]["Code"] = data_list[6].get("#text", None)
                event["_PluginOutput"]["Offset"] = data_list[7].get("#text", None)
                event["_PluginOutput"]["ProcessID"] = data_list[8].get("#text", None)
                event["_PluginOutput"]["ProcessID_Numeric"] = int(data_list[8].get("#text", None), 16)
                event["_PluginOutput"]["ProcessStartedAt"] = data_list[9].get("#text", None)
                event["_PluginOutput"]["ProcessPath"] = data_list[10].get("#text", None)
                event["_PluginOutput"]["ModulePath"] = data_list[11].get("#text", None)
                event["_PluginOutput"]["ReportID"] = data_list[12].get("#text", None)

            except IndexError as error:
                # todo: print and logging
                pass

        return filtered

    def ajax_statistics(self):
        return_value = []

        filtered = self.get_default_data()

        buffer = {}
        for event in filtered:
            process_path = event["_PluginOutput"].get("ProcessPath", "").lower()

            if not process_path:
                continue

            if process_path not in buffer:
                buffer[process_path] = 1

            else:
                buffer[process_path] = buffer[process_path] + 1

        for k, v in buffer.items():
            return_value.append({
                "ProcessPath": k,
                "Count": v
            })

        return rapidjson.dumps(return_value)

    def ajax_events(self):
        return_value = self.get_default_data()

        return rapidjson.dumps(return_value)

    @jinja2_view("application_errors.html")
    def index(self):
        return {}
