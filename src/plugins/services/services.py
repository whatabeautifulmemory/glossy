# coding: utf-8
import os
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
from utils.plugin_tools.sort import sort_by_timecreated
from utils.plugin_tools.convert_tag_list import convert_tag_list_using_name_property


class ServicesPlugin(PluginBase):
    name = "services"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def _get_default_data(self):
        filtered = list(filter(
            lambda x: ("Service Control Manager" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (
            x.get("System", {}).get("EventID", {}).get("#text", None) in ("7045", "7036", "7040")))
            , self.events.values()
        ))

        for event in filtered:
            data_tags = event["EventData"]["Data"]

            converted = convert_tag_list_using_name_property(data_tags)
            event["_PluginOutput"] = converted

            event_id = event.get("System", {}).get("EventID", {}).get("#text", "")

            if "7045" == event_id:
                event["_PluginOutput"]["_ServiceName"] = event["_PluginOutput"].get("ServiceName", "")
                event["_PluginOutput"]["_ImagePath"] = event["_PluginOutput"].get("ImagePath", "")
                event["_PluginOutput"]["_ServiceType"] = event["_PluginOutput"].get("ServiceType", "")
                event["_PluginOutput"]["_StartType"] = event["_PluginOutput"].get("StartType", "")

            elif "7036" == event_id:
                event["_PluginOutput"]["_ServiceDisplayName"] = event["_PluginOutput"].get("param1", "")
                event["_PluginOutput"]["_ChangedStatusName"] = event["_PluginOutput"].get("param3", "")

            elif "7040" == event_id:
                event["_PluginOutput"]["_ServiceDisplayName"] = event["_PluginOutput"].get("param1", "")
                event["_PluginOutput"]["_BeforeStatusName"] = event["_PluginOutput"].get("param2", "")
                event["_PluginOutput"]["_ChangedStatusName"] = event["_PluginOutput"].get("param3", "")
                event["_PluginOutput"]["_ServiceName"] = event["_PluginOutput"].get("param4", "")

        return filtered

    def ajax_summary(self):
        return_value = []

        service_events = self._get_default_data()
        service_events = sort_by_timecreated(service_events)

        _buf = dict()
        for service_event in service_events:
            if "7040" != service_event.get("System", {}).get("EventID", {}).get("#text", ""):
                continue

            expected_key = (
                service_event.get("System", {}).get("Computer", {}).get("#text", "")
                , service_event.get("_PluginOutput", {}).get("_ServiceName")
                , service_event.get("_PluginOutput", {}).get("_ServiceDisplayName")
            )

            if expected_key not in _buf.keys():
                _buf[expected_key] = {}
                _buf[expected_key]["created_at"] = None
                _buf[expected_key]["last_status_changed_at"] = None

        for service_event in service_events:
            if "7040" == service_event.get("System", {}).get("EventID", {}).get("#text", ""):
                continue

            computer_name = service_event.get("System", {}).get("Computer", {}).get("#text", "")

            if "7045" == service_event.get("System", {}).get("EventID", {}).get("#text", ""):
                service_name = service_event.get("_PluginOutput", {}).get("_ServiceName")

                found = False
                for k, v in _buf.items():
                    if computer_name == k[0] and service_name == k[1]:
                        v["created_at"] = service_event.get("_Metadata", {}).get("LocalTimeCreated")
                        found = True
                        break

                if not found:
                    _buf[(
                        service_event.get("System", {}).get("Computer", {}).get("#text", "")
                        , service_event.get("_PluginOutput", {}).get("_ServiceName")
                        , None
                    )] = {
                        "created_at": service_event.get("_Metadata", {}).get("LocalTimeCreated", None),
                        "last_status_changed_at": None
                    }

            elif "7036" == service_event.get("System", {}).get("EventID", {}).get("#text", ""):
                service_display_name = service_event.get("_PluginOutput", {}).get("_ServiceDisplayName")

                found = False
                for k, v in _buf.items():
                    if computer_name == k[0] and service_display_name == k[2]:
                        v["last_status_changed_at"] = service_event.get("_Metadata", {}).get("LocalTimeCreated", None)
                        found = True
                        break

                if not found:
                    _buf[(
                        service_event.get("System", {}).get("Computer", {}).get("#text", "")
                        , None
                        , service_event.get("_PluginOutput", {}).get("_ServiceDisplayName")
                    )] = {
                        "created_at": None,
                        "last_status_changed_at": service_event.get("_Metadata", {}).get("LocalTimeCreated", None)
                    }

        for k, v in _buf.items():
            return_value.append({
                "computer_name": k[0],
                "service_name": k[1],
                "service_display_name": k[2],

                "created_at": v.get("created_at", None),
                "last_status_changed_at": v.get("last_status_changed_at", None)
            })

        return rapidjson.dumps(return_value)

    def ajax_events(self):
        return rapidjson.dumps(self._get_default_data())

    @jinja2_view("services.html")
    def index(self):
        return {}
