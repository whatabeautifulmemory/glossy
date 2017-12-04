# coding: utf-8
import rapidjson
from bottle import jinja2_view
from core.plugin_base import PluginBase
import dateutil
import datetime


class SystemOnOffPlugin(PluginBase):
    name = "system_on_off"
    template_dir = "templates/"

    def convert_powerofftime(self, timestamp):

        timestamp = int(timestamp[:17])

        delta = datetime.timedelta(microseconds=int(timestamp))

        datetimeobj = datetime.datetime(1601, 1, 1, 9) + delta

        time_string = "%d-%02d-%02d %02d:%02d:%02d" % (datetimeobj.year, datetimeobj.month, datetimeobj.day, datetimeobj.hour, datetimeobj.minute, datetimeobj.second)
        return time_string



    def filter_onoff_data(self, filtered):


        flag = ""
        prev_event_time = ""
        i = 0
        data = []

        for event in filtered:
            # 전원켜짐
            # 전원꺼짐

            system_on = "start"
            system_off = "stop"

            event["_PluginResult"] = {}
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)
            Provider = event.get("System", {}).get("Provider", {}).get("@Name", None)

            local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)

            if EventID == "12" and Provider == "Microsoft-Windows-Kernel-General":
                event["_PluginResult"]["Time"] = local_time
                event["_PluginResult"]["Status"] = system_on

                bootmode = event.get("EventData", {}).get("Data", [])[5].get("#text", None)

                if bootmode == "1":
                    event["_PluginResult"]["Etc"] = "안전모드"

                data.append(event)

                if flag == True:
                    # 강제종료 의심
                    # EventRecordID = event.get("System", {}).get("EventRecordID", {}).get("_value", None)

                    # 인덱스 0 인경우 skip
                    if i == 0: continue
                    prevEvent = filtered[i - 1]

                    prevEvent["_PluginResult"] = {}

                    prevEvent["_PluginResult"]["Status"] = system_off
                    prevEvent["_PluginResult"]["Etc"] = "강제종료"
                    local_time = prevEvent.get("_Metadata", {}).get("LocalTimeCreated", None)

                    # 41번 이벤트에서 시간값이 안찍히는 문제가 발생하기 때문에 대안용 시간값
                    prev_event_time = local_time

                flag = True

            elif EventID == "13" and Provider == "Microsoft-Windows-Kernel-General":
                event["_PluginResult"] = {}
                event["_PluginResult"]["Time"] = local_time
                event["_PluginResult"]["Status"] = system_off
                data.append(event)
                flag = False

            elif EventID == "41" and Provider == "Microsoft-Windows-Kernel-Power":

                event["_PluginResult"] = {}

                event["_PluginResult"]["Status"] = system_off
                event["_PluginResult"]["Etc"] = "강제종료"

                # 시간값이 없는 경우
                PowerButtonTimestamp = event.get("EventData", {}).get("Data", [])[6].get("#text", None)
                if PowerButtonTimestamp == "0":
                    PowerButtonTimestamp = prev_event_time
                else:
                    # 타임스탬프 -> 시간 변환
                    PowerButtonTimestamp = self.convert_powerofftime(PowerButtonTimestamp)

                event["_PluginResult"]["Time"] = PowerButtonTimestamp

                data.append(event)
                flag = False

            elif EventID == "42" and Provider == "Microsoft-Windows-Kernel-Power":
                event["_PluginResult"] = {}
                event["_PluginResult"]["Time"] = local_time
                event["_PluginResult"]["Status"] = system_off
                event["_PluginResult"]["Etc"] = "절전모드"
                data.append(event)
            elif EventID == "1" and Provider == "Microsoft-Windows-Power-Troubleshooter":
                event["_PluginResult"] = {}
                event["_PluginResult"]["Time"] = local_time
                event["_PluginResult"]["Status"] = system_on
                event["_PluginResult"]["Etc"] = "절전모드"
                data.append(event)
            # elif EventID == "1074":
            #     ProcessName = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
            #     if ProcessName.find("shutdown.exe") != -1:
            #         print (local_time)
            #         print (ProcessName)

            i += 1

        return data


    def ajax_scatter_plot_data(self):


        filtered = list(filter(
            lambda x: ("System" == x.get("System", {}).get("Channel", {}).get("#text", None)), self.events.values()
        ))

        summary = []
        data = []
        return_value = []

        systemon_date = ["systemon_date"]
        systemoff_date = ["systemoff_date"]
        systemon_time = ["PC_시작"]
        systemoff_time = ["PC_종료"]

        savingon_date = ["savingon_date"]
        savingoff_date = ["savingoff_date"]
        savingon_time = ["절전모드_시작"]
        savingoff_time = ["절전모드_종료"]

        systemon_count = 0
        systemoff_count = 0
        safemodeon_count = 0
        forcedoff_count = 0
        savingon_count = 0
        savingoff_count = 0
        reservedoff_count = 0


        data = self.filter_onoff_data(filtered)

        for event in data:


            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)
            local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
            if not local_time:

                continue

            parsed_date = dateutil.parser.parse(local_time)

            date_string = local_time[:10]
            #date_string = "%d%-%02d-%02d" % (parsed_date.year, parsed_date.month, parsed_date.day)
            time_string = "%d%02d" % (parsed_date.hour, parsed_date.minute)

            status = event.get("_PluginResult", {}).get("Etc", None)


            if EventID == "12" and status == None:
                systemon_date.append(date_string)
                systemon_time.append(time_string)
                systemon_count += 1


            if EventID == "13" and status == None:
                systemoff_date.append(date_string)
                systemoff_time.append(time_string)

                systemoff_count += 1
                

            if EventID == "1" and status == "절전모드":
                savingon_date.append(date_string)
                savingon_time.append(time_string)
                savingon_count += 1

            if EventID == "42" and status == "절전모드":
                savingoff_date.append(date_string)
                savingoff_time.append(time_string)
                savingoff_count += 1

            # 강제종료는 이벤트 아이디가 특정되지 않음
            if status == "강제종료": forcedoff_count += 1
            if status == "안전모드": safemodeon_count += 1
            
            
        graph_data = [systemon_date,systemoff_date,systemon_time,systemoff_time, savingon_date,savingoff_date,savingon_time,savingoff_time]

        summary = [systemon_count, systemoff_count, safemodeon_count, forcedoff_count, savingon_count, savingoff_count]


        return_value = [graph_data, summary]


        return rapidjson.dumps(return_value)

    def ajax_events(self):

        filtered = list(filter(
            lambda x: ("System" == x.get("System", {}).get("Channel", {}).get("#text", None)), self.events.values()
        ))

        data = []

        data = self.filter_onoff_data(filtered)

        return rapidjson.dumps(data)

    @jinja2_view("system_on_off.html")
    def index(self):
        return {}
