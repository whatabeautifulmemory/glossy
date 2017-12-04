# coding: utf-8
import os
import rapidjson

from collections import Counter

from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
from utils.plugin_tools.sort import sort_by_timecreated
from utils.plugin_tools.convert_tag_list import convert_tag_list_using_name_property


WHITELIST_PROCESSES = [

]


class ProcessPlugin(PluginBase):
    name = "process"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def _get_application_experience_data(self):
        filtered = list(filter(
            lambda event: ("Microsoft-Windows-Application-Experience" == event.get("System", {}).get("Provider", {}).get("@Name", None) and (event.get("System", {}).get("EventID", {}).get("#text", None) in ("500", "505")))
            , self.events.values())
        )

        return filtered

    def _get_security_auditing_data(self):
        filtered = list(filter(
            lambda event: ("Microsoft-Windows-Security-Auditing" == event.get("System", {}).get("Provider", {}).get("@Name", None) and (event.get("System", {}).get("EventID", {}).get("#text", None) in ("4688", "4689")))
            , self.events.values())
        )
        filtered = sort_by_timecreated(filtered, reverse=False)

        _running_processes = dict()

        for event in filtered:
            event["_PluginOutput"] = {}

            event_id = event.get("System", {}).get("EventID", {}).get("#text", None)

            data_tags = event["EventData"]["Data"]

            unknown_seen = 0
            for data_tag in data_tags:
                if "@Name" in data_tag:
                    event["_PluginOutput"][data_tag["@Name"]] = data_tag.get("#text", "")

                else:
                    event["_PluginOutput"]["unknown_%d" % unknown_seen] = data_tag.get("#text", "")
                    unknown_seen = unknown_seen + 1

            for k in ("NewProcessId", "ProcessId", "SubjectLogonId", "TargetLogonId"):
                if k in event["_PluginOutput"]:
                    event["_PluginOutput"]["%s_Numeric" % k] = int(event["_PluginOutput"][k], 16)

            # 아래는 서로 다른 이벤트여도 같은 컬럼에 표시하기 위한 약간의 보정임.
            if "4689" == event_id:
                event["_PluginOutput"]["NewProcessName"] = event["_PluginOutput"]["ProcessName"]
                event["_PluginOutput"]["NewProcessId"] = event["_PluginOutput"]["ProcessId"]
                event["_PluginOutput"]["NewProcessId_Numeric"] = event["_PluginOutput"]["ProcessId_Numeric"]

            # 아래 프로세스는 윈도우 7 환경에서 프로세스 이름을 구하기 위한 코드 보정
            computer_name = event.get("System", {}).get("Computer", {}).get("#text", None)

            if ("4688" == event_id) and ("ParentProcessName" not in event["EventData"]["Data"]):
                created_process_id = event.get("_PluginOutput", {}).get("NewProcessId", None)
                created_process_key = (computer_name, created_process_id)

                parent_process_id = event.get("_PluginOutput", {}).get("ProcessId", None)
                parent_process_key = (computer_name, parent_process_id)

                _running_processes[created_process_key] = event
                event["_PluginOutput"]["ParentProcessName"] = _running_processes.get(parent_process_key, {}).get("_PluginOutput", {}).get("NewProcessName", None)

            elif "4689" == event_id:
                destroyed_process_id = event.get("_PluginOutput", {}).get("ProcessId", None)
                destroyed_process_key = (computer_name, destroyed_process_id)

                process_creation_event = None
                if destroyed_process_key in _running_processes:
                    process_creation_event = _running_processes.pop(destroyed_process_key)

                if process_creation_event and ("ParentProcessName" not in event["_PluginOutput"]):
                    event["_PluginOutput"]["ParentProcessName"] = process_creation_event.get("_PluginOutput", {}).get("ParentProcessName", None)

        return filtered

    def ajax_chart_security_auditing(self):
        process_events = list(filter(
            lambda event: ("Microsoft-Windows-Security-Auditing" == event.get("System", {}).get("Provider", {}).get("@Name",None) and (event.get("System", {}).get("EventID", {}).get("#text", None) in ("4688",)))
            , self.events.values())
        )

        process_names = []
        for process_event in process_events:
            process_names.append(
                process_event.get("_PluginOutput", {}).get("NewProcessName", None)
            )

        counted = Counter(process_names)
        counted_sorted = sorted(counted.items(), key=lambda x: x[1], reverse=True)

        return rapidjson.dumps(counted_sorted)

    def ajax_chart_application_experience(self):
        process_events = list(filter(
            lambda event: ("Microsoft-Windows-Application-Experience" == event.get("System", {}).get("Provider", {}).get("@Name", None) and (event.get("System", {}).get("EventID", {}).get("#text", None) in ("500", "505")))
            , self.events.values())
        )

        process_names = []
        for process_event in process_events:
            process_names.append(
                process_event.get("UserData", {}).get("CompatibilityFixEvent", {}).get("ExePath", {}).get("#text", None)
            )

        counted = Counter(process_names)
        counted_sorted = sorted(counted.items(), key=lambda x: x[1], reverse=True)

        return rapidjson.dumps(counted_sorted)

    def ajax_events_application_experience(self):
        return rapidjson.dumps(self._get_application_experience_data())

    def ajax_events_security_auditing(self):
        return rapidjson.dumps(self._get_security_auditing_data())

    @jinja2_view("process.html")
    def index(self):
        return {}
