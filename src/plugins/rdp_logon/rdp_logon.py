# coding: utf-8
import os
import rapidjson

from bottle import jinja2_view

from core.plugin_base import PluginBase
from utils.plugin_tools.convert_tag_list import convert_tag_list_using_name_property
from utils.plugin_tools.geoip import get_country_by_ip


class RDPLogonPlugin(PluginBase):
    name = "rdp_logon"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def ajax_rdp_directed_graph(self):
        return_value = []

        remote_host_finders = {
            "21": lambda x: x.get("UserData", {}).get("EventXML", {}).get("Address", {}).get("#text", None),
            "22": lambda x: x.get("UserData", {}).get("EventXML", {}).get("Address", {}).get("#text", None),
            "24": lambda x: x.get("UserData", {}).get("EventXML", {}).get("Address", {}).get("#text", None),
            "25": lambda x: x.get("UserData", {}).get("EventXML", {}).get("Address", {}).get("#text", None),

            "4624": lambda x: x.get("_PluginOutput", {}).get("IpAddress", None),
            "4625": lambda x: x.get("_PluginOutput", {}).get("IpAddress", None),

            "1149": lambda x: x.get("UserData", {}).get("EventXML", {}).get("Param3", {}).get("#text", None),
        }

        events = []
        rdp_security = self._get_security_auditing_rdp()
        rdp_local = list(filter(
            lambda x: "Microsoft-Windows-TerminalServices-LocalSessionManager" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("21", "22", "24", "25")  and "LOCAL" != x.get("UserData", {}).get("EventXML", {}).get("Address", {}).get("#text", None)
            , self.events.values()
        ))
        rdp_remote = list(filter(
            lambda x: "Microsoft-Windows-TerminalServices-RemoteConnectionManager" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) == "1149"
            , self.events.values()
        ))

        [events.append(x) for x in rdp_security]
        [events.append(x) for x in rdp_local]
        [events.append(x) for x in rdp_remote]

        for event in events:
            event_id = event.get("System", {}).get("EventID", {}).get("#text", "")
            computer_name = event.get("System", {}).get("Computer", {}).get("#text", None)
            remote_host = remote_host_finders[event_id](event)

            if not computer_name:
                continue

            if not remote_host:
                continue

            country_code = get_country_by_ip(remote_host)

            return_value.append({
                "data": {
                    "id": computer_name,
                    "type": "computer"
                }
            })
            return_value.append({
                "data": {
                    "id": remote_host,
                    "country": country_code,
                    "type": "remote"
                }
            })
            return_value.append({
                "data": {
                    "id": "%s to %s" % (remote_host, computer_name),
                    "source": remote_host,
                    "target": computer_name,
                }
            })

        return rapidjson.dumps(return_value)

    def _get_security_auditing_rdp(self):
        return_value = []

        filtered = list(filter(
            lambda x: "Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name",
                                                                                                           None) and x.get(
                "System", {}).get("EventID", {}).get("#text", None) in ("4624", "4625")
            , self.events.values()
        ))

        # LogonType '10' only
        for event in filtered:
            event["_PluginOutput"] = convert_tag_list_using_name_property(
                event.get("EventData", {}).get("Data", []), "Unknown"
            )
            if "10" == event.get("_PluginOutput", {}).get("LogonType", ""):
                return_value.append(event)

        return return_value

    def ajax_events_security_auditing(self):
        filtered = self._get_security_auditing_rdp()

        # ip to country
        for event in filtered:
            remote_addr = event.get("_PluginOutput", {}).get("IpAddress", None)

            if remote_addr:
                event["_PluginOutput"]["Country"] = get_country_by_ip(remote_addr)

        return rapidjson.dumps(filtered)

    def ajax_events_localsessionmanager(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-TerminalServices-LocalSessionManager" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("21", "22", "23", "24", "25") and "LOCAL" != x.get("UserData", {}).get("EventXML", {}).get("Address", {}).get("#text", None)
            , self.events.values()
        ))

        # IP to Country
        for event in filtered:
            remote_addr = event.get("UserData", {}).get("EventXML", {}).get("Address", {}).get("#text", None)

            if remote_addr:
                event["_PluginOutput"] = {}
                event["_PluginOutput"]["Country"] = get_country_by_ip(remote_addr)

        return rapidjson.dumps(filtered)

    def ajax_events_remoteconnectionmanager(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-TerminalServices-RemoteConnectionManager" == x.get("System", {}).get("Provider", {}).get("@Name", None) and x.get("System", {}).get("EventID", {}).get("#text", None) in ("1149", "261")
            , self.events.values()
        ))

        # IP to Country
        for event in filtered:
            remote_addr = event.get("UserData", {}).get("EventXML", {}).get("Param3", {}).get("#text", None)

            if remote_addr:
                event["_PluginOutput"] = {}
                event["_PluginOutput"]["Country"] = get_country_by_ip(remote_addr)

        return rapidjson.dumps(filtered)

    @jinja2_view("rdp_logon.html")
    def index(self):
        return {}
