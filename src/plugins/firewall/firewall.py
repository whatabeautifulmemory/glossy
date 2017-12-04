# coding: utf-8
import os
import dateutil.parser
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
import time
from utils.plugin_tools.sort import sort_by_timecreated


class FirewallPlugin(PluginBase):
    name = "firewall"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"


    global dic_Direction
    global dic_Protocol
    global dic_Action
    global dic_Profile
    global dic_SettingValue

    dic_Direction = {"1": "인바운드",
                     "2": "아웃바운드"}
    dic_Protocol = {"6": "TCP",
                    "17": "UDP",
                    "256": "ALL"}
    dic_Action = {"1": "통과",
                     "2": "거부",
                     "3": "허용"}

    dic_Profile = {"1": "도메인",
                  "2": "개인",
                  "4": "공용",
                  "2147483649": "없음"}

    dic_SettingValue = {"01000000": "켜짐",
                     "00000000": "꺼짐"}


    def ajax_firewall_status_events(self):

        filtered = list(filter(
            lambda x: "Microsoft-Windows-Windows Firewall With Advanced Security" == x.get("System", {}).get("Provider",{}).get("@Name", None) and ( x.get("System", {}).get("EventID", {}).get("#text", None) in ("2003", "2010"))
            , self.events.values()
        ))

        # 방화벽 현재 상태 (온/오프)

        # 현재 프로필
        network_profile_dict = {}
        network_profile_dict["2"] = "Disconnected"
        network_profile_dict["4"] = "Disconnected"

        firewall_result = []



        firewall_private_status = ""
        firewall_public_status = ""
        firewall_domain_status = ""

        # 정렬해야함
        filtered = sort_by_timecreated(filtered, reverse=False)

        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)



            if EventID == "2003":
                SettingValue = event.get("EventData", {}).get("Data", [])[3].get("#text", None)
                Profile = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                if Profile == "1":
                    firewall_domain_status = SettingValue
                elif Profile == "2":
                    firewall_private_status = SettingValue
                elif Profile == "4":
                    firewall_public_status = SettingValue

            if EventID == "2010":
                OldProfile = event.get("EventData", {}).get("Data", [])[2].get("#text", None)
                NewProfile = event.get("EventData", {}).get("Data", [])[3].get("#text", None)
                InterfaceName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)

                if OldProfile == "2":
                    network_profile_dict["2"] = InterfaceName
                elif OldProfile == "4":
                    network_profile_dict["4"] = InterfaceName



        # print (network_profile_dict)

        # 현재 프로파일
        # firewall = {}
        # firewall["current_profile"] = current_profile
        # firewall["firewall_domain_status"] = firewall_domain_status
        # firewall["firewall_private_status"] = firewall_private_status
        # firewall["firewall_public_status"] = firewall_public_status
        #
        # firewall_result.append(firewall)
        # 딕셔너리를 리스트 형태로 변환하고 반환
        profile_list = []
        for key, value in network_profile_dict.items():
            profile_list.append(value)


        firewall_result.append(profile_list)
        firewall_result.append(firewall_domain_status)
        firewall_result.append(firewall_private_status)
        firewall_result.append(firewall_public_status)
        return rapidjson.dumps(firewall_result)

    def ajax_firewall_list_events(self):

        # 예외 포트 현재 상태
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Windows Firewall With Advanced Security" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("2004", "2005", "2006"))
            , self.events.values()
        ))


        firewall_dict = {}

        filtered = sort_by_timecreated(filtered, reverse=False)

        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            # 룰 생성, 변경
            if EventID == "2004" or EventID == "2005":
                RuleID = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                RuleName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)
                ApplicationPath = event.get("EventData", {}).get("Data", [])[3].get("#text", "*")
                Direction = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                Protocol = event.get("EventData", {}).get("Data", [])[6].get("#text", None)
                LocalPorts = event.get("EventData", {}).get("Data", [])[7].get("#text", "*")
                RemotePorts = event.get("EventData", {}).get("Data", [])[8].get("#text", "*")
                Action = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                LocalAddresses = event.get("EventData", {}).get("Data", [])[11].get("#text", "*")
                RemoteAddresses = event.get("EventData", {}).get("Data", [])[12].get("#text", "*")
                Active = event.get("EventData", {}).get("Data", [])[17].get("#text", None)
                ModifyingApplication = event.get("EventData", {}).get("Data", [])[22].get("#text", None)

                # 이름, 프로필, 작업, 방향, 프로그램, 로컬주소, 로컬포트, 원격주소, 원격포트
                rule = {}
                if dic_Action.get(Action) == "허용" :
                    if Active == "1" :
                        RuleName = "<img src='./static/images/Firewall_allow_enable.png' /> " + RuleName
                    else :
                        RuleName = "<img src='./static/images/Firewall_allow_disable.png' /> " + RuleName

                elif dic_Action.get(Action) == "거부":
                    if Active == "1" :
                        RuleName = "<img src='./static/images/Firewall_deny_enable.png' /> " + RuleName
                    else :
                        RuleName = "<img src='./static/images/Firewall_deny_disable.png' /> " + RuleName

                rule["RuleName"] = RuleName
                rule["ApplicationPath"] = ApplicationPath.replace("*", "모두")
                rule["Action"] = dic_Action.get(Action)
                rule["Direction"] = dic_Direction.get(Direction)
                rule["Protocol"] = dic_Protocol.get(Protocol)
                rule["LocalAddresses"] = LocalAddresses.replace("*", "모두")
                rule["RemoteAddresses"] = RemoteAddresses.replace("*", "모두")
                rule["LocalPorts"] = LocalPorts.replace("*", "모두")
                rule["RemotePorts"] = RemotePorts.replace("*", "모두")
                #rule.append(rule_data)
                firewall_dict[RuleID] = rule


            # 룰 삭제
            if EventID == "2006":
                RuleID = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                try :
                    del firewall_dict[RuleID]
                except :
                    # 기존 룰추가 로그가 지워져 사전에 없는경우 예외 발생
                    pass





        # 딕셔너리를 리스트 형태로 변환하고 반환
        firewall_list = []
        for key, value in firewall_dict.items():
            firewall_list.append(value)

        return rapidjson.dumps(firewall_list)



    def ajax_firewall_detail_events(self):

        filtered = list(filter(
            lambda x: "Microsoft-Windows-Windows Firewall With Advanced Security" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("2003", "2004", "2005", "2006"))
            , self.events.values()
        ))

        data = []

        # 전역변수 초기화
        # data.clear()
        
        for event in filtered:
            event["_PluginResult"] = {}

            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            # 방화벽 켜기/끄기
            if EventID == "2003" :
                Profiles = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                SettingValue = event.get("EventData", {}).get("Data", [])[3].get("#text", None)
                ModifyingApplication = event.get("EventData", {}).get("Data", [])[7].get("#text", None)
                # 켜기
                if SettingValue == "01000000" :
                    event["_PluginResult"]["Status"] = "켜기"
                else :
                    event["_PluginResult"]["Status"] = "끄기"

                event["_PluginResult"]["RuleName"] = RuleName
                event["_PluginResult"]["Action"] = dic_Action.get(Profiles)
                event["_PluginResult"]["ModifyingApplication"] = ModifyingApplication
                    
                
                data.append(event)

            # 방화벽 예외 추가 / 수정

             # <EventData>
             #  <Data Name="RuleId">{175AFF65-D4CD-47C3-93EA-747D0920451C}</Data>
             #  <Data Name="RuleName">Wizvera-Veraport-G3-out</Data>
             #  <Data Name="Origin">1</Data>
             #  <Data Name="ApplicationPath">C:\Program Files (x86)\Wizvera\Veraport20\veraport.exe</Data>
             #  <Data Name="ServiceName" />
             #  <Data Name="Direction">2</Data>
             #  <Data Name="Protocol">256</Data>
             #  <Data Name="LocalPorts" />
             #  <Data Name="RemotePorts" />
             #  <Data Name="Action">3</Data>
             #  <Data Name="Profiles">2147483647</Data>
             #  <Data Name="LocalAddresses">*</Data>
             #  <Data Name="RemoteAddresses">*</Data>
             #  <Data Name="RemoteMachineAuthorizationList" />
             #  <Data Name="RemoteUserAuthorizationList" />
             #  <Data Name="EmbeddedContext" />
             #  <Data Name="Flags">1</Data>
             #  <Data Name="Active">1</Data>
             #  <Data Name="EdgeTraversal">0</Data>
             #  <Data Name="LooseSourceMapped">0</Data>
             #  <Data Name="SecurityOptions">0</Data>
             #  <Data Name="ModifyingUser">S-1-5-21-1389356236-1730200243-462038765-1000</Data>
             #  <Data Name="ModifyingApplication">C:\Windows\SysWOW64\netsh.exe</Data>
             #  <Data Name="SchemaVersion">522</Data>
             #  <Data Name="RuleStatus">65536</Data>
             #  </EventData>

            elif EventID == "2004" or EventID == "2005" :
                RuleID = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                RuleName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)
                ApplicationPath = event.get("EventData", {}).get("Data", [])[3].get("#text", "*")
                Direction = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                Protocol = event.get("EventData", {}).get("Data", [])[6].get("#text", None)
                LocalPorts = event.get("EventData", {}).get("Data", [])[7].get("#text", "*")
                RemotePorts = event.get("EventData", {}).get("Data", [])[8].get("#text", "*")
                Action = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                LocalAddresses = event.get("EventData", {}).get("Data", [])[11].get("#text", "*")
                RemoteAddresses = event.get("EventData", {}).get("Data", [])[12].get("#text", "*")
                ModifyingApplication = event.get("EventData", {}).get("Data", [])[22].get("#text", None)

                
                if EventID == "2004" :
                    event["_PluginResult"]["Status"] = "추가"
                else :
                    event["_PluginResult"]["Status"] = "수정"

                event["_PluginResult"]["RuleID"] = RuleID
                event["_PluginResult"]["RuleName"] = RuleName
                event["_PluginResult"]["ApplicationPath"] = LocalAddresses.replace("*", "모두")
                event["_PluginResult"]["Action"] = dic_Action.get(Action)
                event["_PluginResult"]["Direction"] = dic_Direction.get(Direction)
                event["_PluginResult"]["Protocol"] = dic_Protocol.get(Protocol)
                event["_PluginResult"]["LocalAddresses"] = LocalAddresses.replace("*", "모두")
                event["_PluginResult"]["RemoteAddresses"] = RemoteAddresses.replace("*", "모두")
                event["_PluginResult"]["LocalPorts"] = LocalPorts.replace("*", "모두")
                event["_PluginResult"]["RemotePorts"] = RemotePorts.replace("*", "모두")
                event["_PluginResult"]["ModifyingApplication"] = ModifyingApplication

                data.append(event)


            # 방화벽 예외 삭제
            elif EventID == "2006":
                RuleID = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                RuleName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)

                ModifyingApplication = event.get("EventData", {}).get("Data", [])[3].get("#text", None)

                event["_PluginResult"]["Status"] = "삭제"
                event["_PluginResult"]["RuleID"] = RuleID
                event["_PluginResult"]["RuleName"] = RuleName
                event["_PluginResult"]["ModifyingApplication"] = ModifyingApplication

                data.append(event)


        return rapidjson.dumps(data)

    @jinja2_view("firewall.html")
    def index(self):
        return {}
