# coding: utf-8
import os
import dateutil.parser
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
import time
from utils.plugin_tools.sort import sort_by_timecreated


class WirelessPlugin(PluginBase):
    name = "wireless"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def ajax_wireless_dashboard_events(self):

        filtered = list(filter(
            lambda x: "Microsoft-Windows-WLAN-AutoConfig" == x.get("System", {}).get("Provider",{}).get("@Name", None) and ( x.get("System", {}).get("EventID", {}).get("#text", None) in ("8000", "8001", "8002", "8003"))
            , self.events.values()
        ))


        wireless_graph_dict = {}
        wireless_list_dict = {}

        # 정렬해야함
        filtered = sort_by_timecreated(filtered, reverse=False)


        for event in filtered:

            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)

            parsed_date = dateutil.parser.parse(local_time)

            time_string = "%d-%02d-%02d %02d:%02d:%02d" % ( parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute, parsed_date.second)


            if EventID == "8001":
                InterfaceGuid = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                SSID = event.get("EventData", {}).get("Data", [])[4].get("#text", None)
                BSSID = event.get("EventData", {}).get("Data", [])[6].get("#text", None)
                PHYType = event.get("EventData", {}).get("Data", [])[7].get("#text", None)
                AuthenticationAlgorithm = event.get("EventData", {}).get("Data", [])[8].get("#text", None)
                CipherAlgorithm = event.get("EventData", {}).get("Data", [])[9].get("#text", None)

                ap_name = "%s" % (SSID)



                try:
                    count = wireless_graph_dict[ap_name]
                    wireless = wireless_list_dict[InterfaceGuid]
                except:
                    count = 0
                    wireless = {}

                wireless_graph_dict[ap_name] = count + 1


                wireless["RecentDate"] = time_string
                wireless["SSID"] = SSID
                wireless["BSSID"] = BSSID
                wireless["EventID"] = EventID
                wireless["PHYType"] = PHYType
                wireless["AuthenticationAlgorithm"] = AuthenticationAlgorithm
                wireless["CipherAlgorithm"] = CipherAlgorithm


                wireless_list_dict[InterfaceGuid] = wireless

            elif EventID == "8002":
                InterfaceGuid = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                SSID = event.get("EventData", {}).get("Data", [])[4].get("#text", None)






                try :
                    wireless = wireless_list_dict[InterfaceGuid]
                except :
                    wireless = {}
                wireless["RecentDate"] = time_string
                wireless["SSID"] = SSID
                wireless["EventID"] = EventID


                wireless_list_dict[InterfaceGuid] = wireless


        wireless_graph_data = []
        for key, value in wireless_graph_dict.items():
            wireless = []
            wireless.append(key)
            wireless.append(value)
            wireless_graph_data.append(wireless)

        wireless_list_data = []
        for key, value in wireless_list_dict.items():
            wireless_list_data.append(value)

        wireless_data = []
        wireless_data.append(wireless_graph_data)
        wireless_data.append(wireless_list_data)

        return rapidjson.dumps(wireless_data)


    def ajax_wireless_detail_events(self):

        filtered = list(filter(
            lambda x: "Microsoft-Windows-WLAN-AutoConfig" == x.get("System", {}).get("Provider",{}).get("@Name", None) and ( x.get("System", {}).get("EventID", {}).get("#text", None) in ("8000", "8001", "8002", "8003"))
            , self.events.values()
        ))
        # 8000 서비스가 연결 시작
        # 8001 무선랜 연결 성공
        # 8002 무선랜 연결 실패
        # 8003 무선랜 연결 끊어짐
        # 11001 무선 네트워크 연결 성공

        # 10000 연결 시작
        # 11001 연결 성공
        # 11010 무선보안 시작
        # 11005 무선랜 보안 성공
        data = []

        # 정렬해야함
        filtered = sort_by_timecreated(filtered, reverse=False)


        for event in filtered:


            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            if EventID == "8000":

                InterfaceGuid = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                ProfileName = event.get("EventData", {}).get("Data", [])[3].get("#text", None)
                SSID = event.get("EventData", {}).get("Data", [])[4].get("#text", None)
                BSSType = event.get("EventData", {}).get("Data", [])[5].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["InterfaceGuid"] = InterfaceGuid
                event["_PluginResult"]["ProfileName"] = ProfileName
                event["_PluginResult"]["SSID"] = SSID
                event["_PluginResult"]["BSSType"] = BSSType
                
                data.append(event)

            elif EventID == "8001":
                InterfaceGuid = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                ProfileName = event.get("EventData", {}).get("Data", [])[3].get("#text", None)
                SSID = event.get("EventData", {}).get("Data", [])[4].get("#text", None)
                BSSType = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                BSSID = event.get("EventData", {}).get("Data", [])[6].get("#text", None)
                PHYType = event.get("EventData", {}).get("Data", [])[7].get("#text", None)
                AuthenticationAlgorithm = event.get("EventData", {}).get("Data", [])[8].get("#text", None)
                CipherAlgorithm = event.get("EventData", {}).get("Data", [])[9].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["InterfaceGuid"] = InterfaceGuid
                event["_PluginResult"]["ProfileName"] = ProfileName
                event["_PluginResult"]["SSID"] = SSID
                event["_PluginResult"]["BSSType"] = BSSType
                event["_PluginResult"]["BSSID"] = BSSID
                event["_PluginResult"]["PHYType"] = PHYType
                event["_PluginResult"]["AuthenticationAlgorithm"] = AuthenticationAlgorithm
                event["_PluginResult"]["CipherAlgorithm"] = CipherAlgorithm

                data.append(event)
            elif EventID == "8002":
                InterfaceGuid = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                ProfileName = event.get("EventData", {}).get("Data", [])[3].get("#text", None)
                SSID = event.get("EventData", {}).get("Data", [])[4].get("#text", None)
                BSSType = event.get("EventData", {}).get("Data", [])[5].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["InterfaceGuid"] = InterfaceGuid
                event["_PluginResult"]["ProfileName"] = ProfileName
                event["_PluginResult"]["SSID"] = SSID
                event["_PluginResult"]["BSSType"] = BSSType
                data.append(event)

            elif EventID == "8003":
                InterfaceGuid = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                ProfileName = event.get("EventData", {}).get("Data", [])[3].get("#text", None)
                SSID = event.get("EventData", {}).get("Data", [])[4].get("#text", None)
                BSSType = event.get("EventData", {}).get("Data", [])[5].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["InterfaceGuid"] = InterfaceGuid
                event["_PluginResult"]["ProfileName"] = ProfileName
                event["_PluginResult"]["SSID"] = SSID
                event["_PluginResult"]["BSSType"] = BSSType
                data.append(event)


        return rapidjson.dumps(data)

    @jinja2_view("wireless.html")
    def index(self):
        return {}
