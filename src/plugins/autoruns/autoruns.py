# coding: utf-8
import rapidjson
from bottle import jinja2_view
from core.plugin_base import PluginBase
import dateutil


class AutorunsPlugin(PluginBase):
    name = "autoruns"
    template_dir = "templates/"

    global except_process
    except_process = ["Windows\\exp1lorer.exe",
                      "Windows\\re1gedit.exe"]


    def ajax_bho_events(self):

        filtered = list(filter(
            lambda x: ("Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "4657"))
            , self.events.values()
        ))



        target_reg_object = ["\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Browser Helper Objects",
                             "\\Software\\Microsoft\\Internet Explorer\\UrlSearchHooks",
                             "\\Software\\Microsoft\\Internet Explorer\\Toolbar",
                             "\\Software\\Microsoft\\Internet Explorer\\Extensions"
                            ]
        data = []

        for event in filtered:

            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            # 레지스트리
            if EventID == "4657":
                ObjectName = event.get("EventData", {}).get("Data", [])[4].get("#text", None)
                ObjectValueName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                OldValue = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                NewValue = event.get("EventData", {}).get("Data", [])[11].get("#text", None)
                ProcessName = event.get("EventData", {}).get("Data", [])[13].get("#text", None)

                if NewValue == None or NewValue == "-":
                    continue

                # # 제외 process
                # except_flag = False
                # for name in except_process:
                #     if ProcessName[3:] == name:
                #         except_flag = True
                # if except_flag == True:
                #     continue

                # 자동 실행 대상 object 만 추가
                target_flag = False

                for name in target_reg_object:

                    if ObjectName.lower().find(name.lower()) != -1:
                        target_flag = True
                if target_flag == False:
                    continue

                event["_PluginResult"] = {}
                event["_PluginResult"]["Type"] = "registry"
                #event["_PluginResult"]["TargetType"] = target_type

                event["_PluginResult"]["ObjectPath"] = ObjectName[1:]
                event["_PluginResult"]["ObjectName"] = ObjectValueName
                event["_PluginResult"]["ObjectValue"] = NewValue
                event["_PluginResult"]["ProcessName"] = ProcessName

            data.append(event)

        return rapidjson.dumps(data)


    def ajax_logon_events(self):

        filtered = list(filter(
            lambda x: ("Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("4663","4657")))
            , self.events.values()
        ))


        data = []





        target_reg_object = ["\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
                             "\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
                             "\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Userinit",
                             "\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Shell",
                             "\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\Wds\\rdpwd"
                            ]


        target_folder_object = ["\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup",
                                "\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"]

        for event in filtered:

            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            # 시작 폴더
            if EventID == "4663" :

                ObjectType = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                ObjectName = event.get("EventData", {}).get("Data", [])[6].get("#text", None)
                ProcessName = event.get("EventData", {}).get("Data", [])[11].get("#text", None)
                AccessMask = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                ObjectPath = ""

                # AccessMask
                # 0x2 : Write

                if AccessMask != "0x00000002" :
                    continue

                # # 제외 process
                # except_flag = False
                # for name in except_process :
                #     if ProcessName[3:] == name :
                #         except_flag = True
                # if except_flag == True :
                #     continue

                # 자동 실행 대상 object 만 추가
                target_flag = False
                for name in target_folder_object:

                    if ObjectName.find(name) != -1:
                        columns = ObjectName.split(name)

                        ObjectPath = columns[0][:3] + name
                        ObjectName = columns[1][1:]
                        target_flag = True
                if target_flag == False :
                    continue

                event["_PluginResult"] = {}
                event["_PluginResult"]["Type"] = "folder"

                event["_PluginResult"]["ObjectPath"] = ObjectPath
                event["_PluginResult"]["ObjectValue"] = ObjectName
                event["_PluginResult"]["ProcessName"] = ProcessName

            # 시작 레지스트리
            if EventID == "4657" :
                ObjectName = event.get("EventData", {}).get("Data", [])[4].get("#text", None)
                ObjectValueName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                OldValue = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                NewValue = event.get("EventData", {}).get("Data", [])[11].get("#text", None)
                ProcessName = event.get("EventData", {}).get("Data", [])[13].get("#text", None)


                if NewValue == None or NewValue == "-" :
                    continue

                # # 제외 process
                # except_flag = False
                # for name in except_process :
                #     if ProcessName[3:] == name :
                #         except_flag = True
                # if except_flag == True :
                #     continue

                # 자동 실행 대상 object 만 추가
                target_flag = False

                for name in target_reg_object:

                    if ObjectName.lower().find(name.lower()) != -1:

                        target_flag = True
                if target_flag == False :
                    continue

                event["_PluginResult"] = {}
                event["_PluginResult"]["Type"] = "registry"
                #event["_PluginResult"]["TargetType"] = target_type


                event["_PluginResult"]["ObjectPath"] = ObjectName[1:]
                event["_PluginResult"]["ObjectName"] = ObjectValueName
                event["_PluginResult"]["ObjectValue"] = NewValue
                event["_PluginResult"]["ProcessName"] = ProcessName



            data.append(event)

        return rapidjson.dumps(data)

    def ajax_scheduler_events(self):

        filtered = list(filter(
            lambda x: ("Microsoft-Windows-TaskScheduler" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ( "106","140","200","201","141")))
            , self.events.values()
        ))

        data = []

        for event in filtered:

            regist_scheduler = "등록"
            update_scheduler = "변경"
            start_scheduler = "시작"
            stop_scheduler = "종료"
            remove_scheduler = "삭제"

            event["_PluginResult"] = {}
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            task_name = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
            task_name = task_name[1:]
            event["_PluginResult"]["TaskName"] = task_name

            if EventID == "106" :
                event["_PluginResult"]["Status"] = regist_scheduler



            elif EventID == "140" :
                event["_PluginResult"]["Status"] = update_scheduler


            elif EventID == "200" :
                event["_PluginResult"]["Status"] = start_scheduler

                action_name = event.get("EventData", {}).get("Data", [])[1].get("#text", None)
                event["_PluginResult"]["ActionName"] = action_name

            elif EventID == "201" :
                event["_PluginResult"]["Status"] = stop_scheduler

                action_name = event.get("EventData", {}).get("Data", [])[2].get("#text", None)
                event["_PluginResult"]["ActionName"] = action_name

            elif EventID == "141" :
                event["_PluginResult"]["Status"] = remove_scheduler

            data.append(event)

        return rapidjson.dumps(data)

    @jinja2_view("autoruns.html")
    def index(self):
        return {}
