# coding: utf-8
import os
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
import dateutil
import operator

class LogonPlugin(PluginBase):
    name = "logon"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    global dic_failReason

    dic_failReason = {"0xc0000064": "계정없음",
                      "0xc000006a": "잘못된 암호 ",
                      "0xc000006c": "계정잠김",
                      "0xc000006d": "사용자 이름 잘못됨",
                      "0xc000006e": "제한된 계정",
                      "0xc000006f": "계정 시간제한",
                      "0xc0000070": "제한된 계정",
                      "0xc0000071": "암호 만료",
                      "0xc0000072": "계정 비활성",
                      "0xc000009a": "시스템 리소스 부족",
                      "0xc0000193": "계정 만료",
                      "0xc0000224": "암호 변경 필요",
                      "0xc0000234": "계정 잠김"}

    def ajax_dashboard_events(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("4624", "4625", "4647","4672","4800")),
            self.events.values()
        ))
        data = []
        summary = []


        logon_local_date = ["logon_local_date"]
        logon_network_date = ["logon_network_date"]
        logon_remote_date = ["logon_remote_date"]
        logon_screenlock_date = ["logon_screenlock_date"]
        logoff_date = ["logoff_date"]
        logoff_screenlock_date = ["logoff_screenlock_date"]
        logon_fail_date = ["logon_fail_date"]

        logon_local_time = ["로컬_로그온"]
        logon_network_time = ["네트워크_로그온"]
        logon_screenlock_time = ["화면잠금_해제"]
        logon_remote_time = ["원격_로그온"]
        logoff_time = ["로그오프"]
        logoff_screenlock_time = ["화면잠금"]
        logon_fail_time = ["로그온_실패"]


        logon_local_count = 0
        logon_network_count = 0
        logon_screenlock_count = 0
        logon_remote_count = 0
        logoff_count = 0
        logoff_screenlock_count = 0
        logon_fail_count = 0

        logon_account_dict = {}


        for event in filtered:

            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)
            local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
            if not local_time:
                #print("exception!")
                continue

            parsed_date = dateutil.parser.parse(local_time)

            date_string = local_time[:10]
            # date_string = "%d%-%02d-%02d" % (parsed_date.year, parsed_date.month, parsed_date.day)
            time_string = "%d%02d" % (parsed_date.hour, parsed_date.minute)

            status = event.get("_PluginResult", {}).get("Etc", None)


            if EventID == "4624" :
                LogonType = event.get("EventData", {}).get("Data", [])[8].get("#text", None)
                TargetUserName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                LogonProcessName = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                IpPort = event.get("EventData", {}).get("Data", [])[19].get("#text", None)
                # 서비스나 불필요한 이벤트 발생 프로세스는 제외
                if LogonProcessName.find("User32") != -1 or LogonProcessName.find("NtLmSsp") != -1:

                    if LogonType == "2" :
                        logon_local_date.append(date_string)
                        logon_local_time.append(time_string)
                        logon_local_count += 1

                        try :
                            count =logon_account_dict[TargetUserName]
                        except :
                            count = 0
                        logon_account_dict[TargetUserName] = count + 1


                    elif LogonType == "3"  and TargetUserName != "ANONYMOUS LOGON" and IpPort != "-":
                        logon_network_date.append(date_string)
                        logon_network_time.append(time_string)
                        logon_network_count += 1
                        try :
                            count =logon_account_dict[TargetUserName]
                        except :
                            count = 0
                        logon_account_dict[TargetUserName] = count + 1
                    elif LogonType == "7"  :
                        logon_screenlock_date.append(date_string)
                        logon_screenlock_time.append(time_string)
                        logon_screenlock_count += 1
                        try:
                            count = logon_account_dict[TargetUserName]
                        except:
                            count = 0
                        logon_account_dict[TargetUserName] = count + 1

                    elif LogonType == "10":
                        logon_remote_date.append(date_string)
                        logon_remote_time.append(time_string)
                        logon_remote_count += 1
                        try:
                            count = logon_account_dict[TargetUserName]
                        except:
                            count = 0
                        logon_account_dict[TargetUserName] = count + 1


            if EventID == "4625" :
                TargetUserName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                LogonType = event.get("EventData", {}).get("Data", [])[10].get("#text", None)
                logon_fail_date.append(date_string)
                logon_fail_time.append(time_string)
                logon_fail_count += 1

                # 의미없는 시도 제외
                if LogonType in ("2", "3", "7", "10") :

                    try:
                        count = logon_account_dict[TargetUserName]
                    except:
                        count = 0
                    logon_account_dict[TargetUserName] = count + 1

            if EventID == "4647":
                logoff_date.append(date_string)
                logoff_time.append(time_string)
                logoff_count += 1

            if EventID == "4800":
                logoff_screenlock_date.append(date_string)
                logoff_screenlock_time.append(time_string)
                logoff_screenlock_count += 1


        graph_data = [logon_local_date,
                      logon_network_date,
                      logon_remote_date,
                      logon_screenlock_date,
                      logoff_date,
                      logoff_screenlock_date,
                      logon_fail_date,
                      logon_local_time,
                      logon_network_time,
                      logon_remote_time,
                      logon_screenlock_time,
                      logoff_time,
                      logoff_screenlock_time,
                      logon_fail_time
                      ]

        # 그래프용
        logon_type_graph_data = []

        if logon_local_count > 0 :
            logon_type_local = ["로컬_로그온"]
            logon_type_local.append(logon_local_count)
            logon_type_graph_data.append(logon_type_local)
        if logon_network_count > 0 :
            logon_type_network = ["네트워크_로그온"]
            logon_type_network.append(logon_network_count)
            logon_type_graph_data.append(logon_type_network)
        if logon_remote_count > 0 :
            logon_type_remote = ["원격_로그온"]
            logon_type_remote.append(logon_remote_count)
            logon_type_graph_data.append(logon_type_remote)
        if logon_screenlock_count > 0 :
            logon_type_screenlockoff = ["화면잠금_해제"]
            logon_type_screenlockoff.append(logon_screenlock_count)
            logon_type_graph_data.append(logon_type_screenlockoff)





        # 딕셔너리를 리스트 형태로 변환
        logon_account_graph_data = []
        for key, value in logon_account_dict.items():
            logon_account = []
            logon_account.append(key)
            logon_account.append(value)
            logon_account_graph_data.append(logon_account)

        # 로그인 계정은 상위 10개로 제한
        # 내림차순 정렬
        # logon_account_graph_data = sorted(logon_account_graph_data , key=operator.itemgetter(1), reverse=True)
        # top10_logon_account_graph_data = []
        # for i in range(0,10) :
        #     try :
        #         top10_logon_account_graph_data.append(logon_account_graph_data[i])
        #     except :
        #         pass

        # print (logon_account_graph_data)
        summary = [logon_local_count,
                   logon_network_count,
                   logon_remote_count,
                   logon_screenlock_count,
                   logoff_count,
                   logoff_screenlock_count,
                   logon_fail_count]


        # return_value = [graph_data, logon_type_graph_data, top10_logon_account_graph_data, summary]
        return_value = [graph_data, logon_type_graph_data, logon_account_graph_data, summary]

        # print (summary)
        # print ("chart!!!")

        return rapidjson.dumps(return_value)

    def ajax_events(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("4624", "4625", "4647","4672","4800")),
            self.events.values()
        ))
        data = []
        i = 0

        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            event["_PluginResult"] = {}
            for default_keys in ("Gubun", "Status", "TargetUserName", "Etc", "Address"):
                event["_PluginResult"][default_keys] = None

            # 로그인
            if EventID == "4624":
                # event["_PluginResult"] = {}
                LogonProcessName = event.get("EventData", {}).get("Data", [])[9].get("#text", None)

                # 서비스나 불필요한 이벤트 발생 프로세스는 제외
                if LogonProcessName.find("User32") != -1 or LogonProcessName.find("NtLmSsp") != -1 :
                    # Logon Type
                    # 2 : local
                    # 3 : iis, network
                    # 7 : lock 해제
                    # 10: 원격
                    LogonType = event.get("EventData", {}).get("Data", [])[8].get("#text", None)
                    TargetUserName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                    IpAddress = event.get("EventData", {}).get("Data", [])[18].get("#text", None)
                    IpPort = event.get("EventData", {}).get("Data", [])[19].get("#text", None)

                    # 4624 이벤트 이후에 4672 이벤트가 존재하면 관리자 권한 로그인
                    event["_PluginResult"]["isAdmin"] = "0"
                    try :
                        nextEvent = filtered[i + 1]
                        nextEventID = nextEvent.get("System", {}).get("EventID", {}).get("#text", None)
                        if nextEventID == "4672" :
                            event["_PluginResult"]["isAdmin"] = "1"
                    except :
                        # 인덱스번호 에러 안나도록
                        pass

                    event["_PluginResult"]["Gubun"] = "로그온"
                    event["_PluginResult"]["TargetUserName"] = TargetUserName
                    event["_PluginResult"]["LogonType"] = LogonType

                    if LogonType == "2" :
                        event["_PluginResult"]["Status"] = "로컬 로그온"
                        data.append(event)

                    # 네트워크 로그인은 포트번호가 있는 경우만
                    elif LogonType == "3"  and TargetUserName != "ANONYMOUS LOGON" and IpPort != "-":
                        event["_PluginResult"]["Status"] = "네트워크 로그온"
                        event["_PluginResult"]["Address"] = IpAddress
                        data.append(event)
                    elif LogonType == "7" :
                        event["_PluginResult"]["Status"] = "화면잠금 해제"
                        data.append(event)
                    elif LogonType == "10" :

                        event["_PluginResult"]["Status"] = "원격 로그온"
                        event["_PluginResult"]["Address"] = IpAddress
                        data.append(event)

            # 로그인 실패
            elif EventID == "4625":
                # event["_PluginResult"] = {}

                SubStatus = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                LogonType = event.get("EventData", {}).get("Data", [])[10].get("#text", None)
                TargetUserName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                IpAddress = event.get("EventData", {}).get("Data", [])[19].get("#text", None)

                failReason = dic_failReason.get(SubStatus.lower())


                event["_PluginResult"]["Gubun"] = "로그온 실패"
                event["_PluginResult"]["Etc"] = failReason
                event["_PluginResult"]["TargetUserName"] = TargetUserName
                event["_PluginResult"]["LogonType"] = LogonType

                if LogonType == "2":
                    event["_PluginResult"]["Status"] = "로컬 로그온"

                    data.append(event)
                elif LogonType == "3":
                    event["_PluginResult"]["Status"] = "네트워크 로그온"
                    event["_PluginResult"]["Address"] = IpAddress
                    data.append(event)
                elif LogonType == "7":
                    event["_PluginResult"]["Status"] = "화면잠금 해제"
                    data.append(event)
                elif LogonType == "10":
                    event["_PluginResult"]["Gubun"] = "로그온"
                    event["_PluginResult"]["Status"] = "원격 로그온"
                    event["_PluginResult"]["Address"] = IpAddress
                    data.append(event)


            # 로그오프(시작 - 로그오프)
            elif EventID == "4647" :
                # event["_PluginResult"] = {}

                TargetUserName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)
                event["_PluginResult"]["Gubun"] = "로그오프"
                event["_PluginResult"]["Status"] = "계정 로그오프"
                event["_PluginResult"]["TargetUserName"] = TargetUserName
                data.append(event)

            # 화면 잠금(윈도우+L, 화면보호기)
            elif EventID == "4800" :
                # event["_PluginResult"] = {}

                TargetUserName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)
                event["_PluginResult"]["Gubun"] = "로그오프"
                event["_PluginResult"]["Status"] = "화면잠금"
                event["_PluginResult"]["TargetUserName"] = TargetUserName
                data.append(event)

            i += 1


        return rapidjson.dumps(data)

    @jinja2_view("logon.html")
    def index(self):
        return {}
