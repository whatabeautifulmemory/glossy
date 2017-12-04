# coding: utf-8
import os
import dateutil.parser
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
import time
from utils.plugin_tools.sort import sort_by_timecreated


class CDRecordingPlugin(PluginBase):
    name = "cd_recording"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"





    def ajax_cd_recording_detail_events(self):

        filtered = list(filter(
            lambda x: "cdrom" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) =="133")
            , self.events.values()
        ))

        data = []

        # 정렬해야함
        filtered = sort_by_timecreated(filtered, reverse=False)
        
        for event in filtered:
            event["_PluginResult"] = {}

            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            # 방화벽 켜기/끄기
            if EventID == "133" :

                Device = event.get("EventData", {}).get("Data", []).get("#text", None)

                event["_PluginResult"]["Device"] = Device
                data.append(event)




        return rapidjson.dumps(data)

    @jinja2_view("cd_recording.html")
    def index(self):
        return {}
