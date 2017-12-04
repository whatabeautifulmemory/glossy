# coding: utf-8
import os
import dateutil.parser
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
import time
from utils.plugin_tools.sort import sort_by_timecreated


class AccountPlugin(PluginBase):
    name = "account"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"


    def ajax_account_list_events(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("4624", "4720", "4722", "4738", "4724","4732","4733","4733","4729","4726","4731","4735","4734"))
            , self.events.values()
        ))

        account_dict = {}

        filtered = sort_by_timecreated(filtered, reverse=False)

        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)

            parsed_date = dateutil.parser.parse(local_time)

            time_string = "%d-%02d-%02d %02d:%02d:%02d" % ( parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute, parsed_date.second)

            # 계정 생성
            if EventID == "4720" :
                TargetSid = event.get("EventData", {}).get("Data", [])[2].get("#text", None)
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                TargetDomainName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)

                # 이름, 프로필, 작업, 방향, 프로그램, 로컬주소, 로컬포트, 원격주소, 원격포트
                try:
                    account = account_dict[TargetSid]

                except :
                    account = {}
                    for default_key in ("CreateDate", "TargetUserName", "TargetDomainName", "PasswordChangeDate", "RecentLogonDate", "IsDeleted", "DeleteDate"):
                        account[default_key] = None

                account["CreateDate"] = time_string
                account["TargetUserName"] = TargetUserName
                account["TargetDomainName"] = TargetDomainName

                account_dict[TargetSid] = account
                # print (account_dict)

            # 계정 패스워드 변경
            elif EventID == "4724" :
                TargetSid = event.get("EventData", {}).get("Data", [])[2].get("#text", None)
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                TargetDomainName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)

                try :
                    account = account_dict[TargetSid]
                except :
                    account = {}
                    for default_key in ("CreateDate", "TargetUserName", "TargetDomainName", "PasswordChangeDate", "RecentLogonDate", "IsDeleted", "DeleteDate"):
                        account[default_key] = None

                account["PasswordChangeDate"] = time_string
                account["TargetUserName"] = TargetUserName
                account["TargetDomainName"] = TargetDomainName

                account_dict[TargetSid] = account


            # 계정 삭제
            elif EventID == "4726" :
                TargetSid = event.get("EventData", {}).get("Data", [])[2].get("#text", None)
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
                TargetDomainName = event.get("EventData", {}).get("Data", [])[1].get("#text", None)

                try :
                    account = account_dict[TargetSid]
                except :
                    account = {}
                    for default_key in ("CreateDate", "TargetUserName", "TargetDomainName", "PasswordChangeDate", "RecentLogonDate", "IsDeleted", "DeleteDate"):
                        account[default_key] = None

                account["TargetUserName"] = TargetUserName
                account["TargetDomainName"] = TargetDomainName
                account["IsDeleted"] = "O"
                account["DeleteDate"] = time_string

                account_dict[TargetSid] = account


            # 계정 로그인 일자
            elif EventID == "4624" :

                LogonProcessName = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                if LogonProcessName.find("User32") != -1 or LogonProcessName.find("NtLmSsp") != -1 :
                    TargetSid = event.get("EventData", {}).get("Data", [])[4].get("#text", None)


                    logon_type = event.get("EventData", {}).get("Data", [])[8].get("#text", None)

                    # 계정 생성 이벤트가 지워져서 없는 경우
                    try :
                        account = account_dict[TargetSid]
                    except :
                        TargetUserName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)
                        TargetDomainName = event.get("EventData", {}).get("Data", [])[6].get("#text", None)
                        account = {}
                        for default_key in ("CreateDate", "TargetUserName", "TargetDomainName", "PasswordChangeDate", "RecentLogonDate","IsDeleted", "DeleteDate"):
                            account[default_key] = None
                        account["TargetUserName"] = TargetUserName
                        account["TargetDomainName"] = TargetDomainName


                    if logon_type == "2" :
                        account["RecentLogonDate"] = time_string + "(로컬)"
                        account_dict[TargetSid] = account

                    elif logon_type == "3" and TargetUserName != "ANONYMOUS LOGON":
                        account["RecentLogonDate"] = time_string + "(네트워크)"
                        account_dict[TargetSid] = account

                    elif logon_type == "10":
                        account["RecentLogonDate"] = time_string + "(원격)"
                        account_dict[TargetSid] = account


        # 딕셔너리를 리스트 형태로 변환하고 반환
        account_list = []
        for key, value in account_dict.items():
            account_list.append(value)

        return rapidjson.dumps(account_list)


    def ajax_account_detail_events(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("4720", "4722", "4738", "4724","4732","4733","4733","4729","4726","4731","4735","4734"))
            , self.events.values()
        ))

        data = []

        # 전역변수 초기화
        # data.clear()
        
        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            # 계정 생성
            if EventID == "4720" :
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["Status"] = "계정 생성"
                event["_PluginResult"]["TargetUserName"] = TargetUserName
                
                data.append(event)
            # 계정 비밀번호 변경
            elif EventID == "4724":
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["Status"] = "계정비밀번호 변경"
                event["_PluginResult"]["TargetUserName"] = TargetUserName

                data.append(event)
            # 계정 삭제
            elif EventID == "4726":
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["Status"] = "계정 삭제"
                event["_PluginResult"]["TargetUserName"] = TargetUserName

                data.append(event)

            # 그룹 생성
            elif EventID == "4731":
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["Status"] = "그룹 생성"
                event["_PluginResult"]["TargetUserName"] = TargetUserName

                data.append(event)

            # 그룹 삭제
            elif EventID == "4734":
                TargetUserName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)

                event["_PluginResult"] = {}
                event["_PluginResult"]["Status"] = "그룹 삭제"
                event["_PluginResult"]["TargetUserName"] = TargetUserName

                data.append(event)

        return rapidjson.dumps(data)

    @jinja2_view("account.html")
    def index(self):
        return {}
