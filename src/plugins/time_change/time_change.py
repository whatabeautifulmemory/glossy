# coding: utf-8
import os
import rapidjson
import operator
import dateutil.parser
import datetime
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
from utils.plugin_tools.sort import sort_by_timecreated
from utils.plugin_tools.sort import sort_by_eventrecordid


class TimeChangePlugin(PluginBase):
    name = "time_change"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def convert_time(self, seconds):

        # 1일보다 큰경우




        if seconds > 0 :
            sign = ""
            sign_image = "<img src='./static/images/up.png' width='32' height='32' />"
        else :
            sign = "-"
            sign_image = "<img src='./static/images/down.png' width='32' height='32' />"

        time = abs(seconds)


        if time >= 86400 :
            day = time / 86400
            time = time % 86400
            mydelta = datetime.timedelta(seconds=time)
            mytime = datetime.datetime.min + mydelta

            convert_time = "%s %s%d일 %d시간 %d분 %d초" % (sign_image, sign, day, mytime.hour, mytime.minute, mytime.second)
            return convert_time

        if time >= 3600 :

            mydelta = datetime.timedelta(seconds=time)
            mytime = datetime.datetime.min + mydelta

            convert_time = "%s %s%d시간 %d분 %d초" % (sign_image, sign, mytime.hour, mytime.minute, mytime.second)
            return convert_time

        if time >= 60 :
            mydelta = datetime.timedelta(seconds=time)
            mytime = datetime.datetime.min + mydelta

            convert_time = "%s %s%d분 %d초" % (sign_image, sign, mytime.minute, mytime.second)
            return convert_time

        convert_time = "%s %s%d초" % (sign_image, sign, time)
        return convert_time



    def ajax_dashboard_events(self):

        security_filtered = list(filter(
            lambda x: "Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and ("4616" == x.get("System", {}).get("EventID", {}).get("#text", None))

            , self.events.values()
        ))
        system_filtered = list(filter(
            lambda x:"Microsoft-Windows-Kernel-General" == x.get("System", {}).get("Provider", {}).get("@Name", None) and ("1" == x.get("System", {}).get("EventID", {}).get("#text", None))
            , self.events.values()
        ))

        security_filtered = sort_by_eventrecordid(security_filtered, reverse=False)
        system_filtered = sort_by_eventrecordid(system_filtered, reverse=False)


        eventid_4616 = ["x"]
        interval_4616 = ["Security"]
        eventid_1 = ["x"]
        interval_1 = ["System"]

        top_list_4616 = []

        for item in security_filtered:
            previous_time = item.get("EventData", {}).get("Data", [])[4].get("#text", None)
            new_time = item.get("EventData", {}).get("Data", [])[5].get("#text", None)
            process_id = item.get("EventData", {}).get("Data", [])[6].get("#text", None)
            process_name = item.get("EventData", {}).get("Data", [])[7].get("#text", None)


            if not all([previous_time, new_time, process_id, process_name]):
                # exception case
                continue

            local_timezone = item.get("_Metadata", {}).get("LocalTimeCreated", None)
            local_time_created_parsed = dateutil.parser.parse(local_timezone)
            local_time_created_timezone = local_time_created_parsed.tzinfo

            previous_time_parsed = dateutil.parser.parse(previous_time)
            new_time_parsed = dateutil.parser.parse(new_time)

            time_gap_seconds = (new_time_parsed - previous_time_parsed).total_seconds()

            # 변경값이 1초보다 작으면 제외
            if abs(time_gap_seconds) < 1 :
                continue


            previous_time_string = "%d-%02d-%02d %02d:%02d:%02d" % (previous_time_parsed.year, previous_time_parsed.month, previous_time_parsed.day, previous_time_parsed.hour, previous_time_parsed.minute, previous_time_parsed.second)
            new_time_string = "%d-%02d-%02d %02d:%02d:%02d" % ( new_time_parsed.year, new_time_parsed.month, new_time_parsed.day, new_time_parsed.hour,new_time_parsed.minute, new_time_parsed.second)

            eventid_4616.append( previous_time_string)
            interval_4616.append(time_gap_seconds)
            data = []
            data.append(previous_time_string)
            data.append(new_time_string)
            data.append(time_gap_seconds)
            data.append(abs(time_gap_seconds))
            top_list_4616.append(data)

        top_list_1 = []
        for item in system_filtered:
            new_time= item.get("EventData", {}).get("Data", [])[0].get("#text", None)
            previous_time = item.get("EventData", {}).get("Data", [])[1].get("#text", None)

            local_timezone = item.get("_Metadata", {}).get("LocalTimeCreated", None)
            local_time_created_parsed = dateutil.parser.parse(local_timezone)
            local_time_created_timezone = local_time_created_parsed.tzinfo

            previous_time_parsed = dateutil.parser.parse(previous_time)
            new_time_parsed = dateutil.parser.parse(new_time)

            time_gap_seconds = (new_time_parsed - previous_time_parsed).total_seconds()

            # 변경값이 1초보다 작으면 제외
            if abs(time_gap_seconds) < 1 :
                continue

            previous_time_string = "%d-%02d-%02d %02d:%02d:%02d" % (previous_time_parsed.year, previous_time_parsed.month, previous_time_parsed.day, previous_time_parsed.hour, previous_time_parsed.minute, previous_time_parsed.second)
            new_time_string = "%d-%02d-%02d %02d:%02d:%02d" % ( new_time_parsed.year, new_time_parsed.month, new_time_parsed.day, new_time_parsed.hour,new_time_parsed.minute, new_time_parsed.second)

            eventid_1.append( previous_time_string)
            interval_1.append(time_gap_seconds)
            data = []
            data.append(previous_time_string)
            data.append(new_time_string)
            data.append(time_gap_seconds)
            data.append(abs(time_gap_seconds))
            top_list_1.append(data)

        top_list_4616 = sorted(top_list_4616, key=operator.itemgetter(3), reverse=True)
        top_list_1 = sorted(top_list_1, key=operator.itemgetter(3), reverse=True)


        i = 0
        security_top_list = []
        for data in top_list_4616 :

            top_data = []
            top_data.append(data[0])
            top_data.append(data[1])
            top_data.append(self.convert_time(data[2]))
            security_top_list.append(top_data)
            i += 1
            if i  == 5 : break
        i = 0
        system_top_list = []
        for data in top_list_1 :
            top_data = []
            top_data.append(data[0])
            top_data.append(data[1])
            top_data.append(self.convert_time(data[2]))
            system_top_list.append(top_data)
            i += 1
            if i  == 5 : break

        security_event = [eventid_4616,interval_4616 ]
        system_event = [eventid_1,interval_1]

        return_value = [security_event,system_event, security_top_list, system_top_list ]



        return rapidjson.dumps(return_value)

    def ajax_events(self):
        filtered = list(filter(
            lambda x: ("Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and ("4616" == x.get("System", {}).get("EventID", {}).get("#text", None)))
                    or ("Microsoft-Windows-DateTimeControlPanel" == x.get("System", {}).get("Provider", {}).get("@Name", None) and ("20000" == x.get("System", {}).get("EventID", {}).get("#text", None)))
                      or ("Microsoft-Windows-Kernel-General" == x.get("System", {}).get("Provider", {}).get("@Name", None) and ("1" == x.get("System", {}).get("EventID", {}).get("#text", None)))
            , self.events.values()
        ))

        data = []

        for item in filtered:
            EventID = item.get("System", {}).get("EventID", {}).get("#text", None)

            if EventID == "4616" :

                previous_time = item.get("EventData", {}).get("Data", [])[4].get("#text", None)
                new_time = item.get("EventData", {}).get("Data", [])[5].get("#text", None)
                process_id = item.get("EventData", {}).get("Data", [])[6].get("#text", None)
                process_name = item.get("EventData", {}).get("Data", [])[7].get("#text", None)


                if not all([previous_time, new_time, process_id, process_name]):
                    # exception case
                    continue

                local_timezone = item.get("_Metadata", {}).get("LocalTimeCreated", None)
                local_time_created_parsed = dateutil.parser.parse(local_timezone)
                local_time_created_timezone = local_time_created_parsed.tzinfo

                previous_time_parsed = dateutil.parser.parse(previous_time)
                new_time_parsed = dateutil.parser.parse(new_time)
                time_gap_seconds = abs((previous_time_parsed - new_time_parsed).total_seconds())

                item["_PluginOutput"] = {}
                item["_PluginOutput"]["TimeGapSeconds"] = time_gap_seconds
                item["_PluginOutput"]["LocalPreviousTime"] = str(previous_time_parsed.astimezone(local_time_created_timezone))
                item["_PluginOutput"]["LocalNewTime"] = str(new_time_parsed.astimezone(local_time_created_timezone))
                item["_PluginOutput"]["UTCPreviousTime"] = str(previous_time_parsed)
                item["_PluginOutput"]["UTCNewTime"] = str(new_time_parsed)
                item["_PluginOutput"]["ProcessID"] = process_id
                item["_PluginOutput"]["ProcessName"] = process_name

                data.append(item)

            elif EventID == "1":
                new_time= item.get("EventData", {}).get("Data", [])[0].get("#text", None)
                previous_time = item.get("EventData", {}).get("Data", [])[1].get("#text", None)

                local_timezone = item.get("_Metadata", {}).get("LocalTimeCreated", None)
                local_time_created_parsed = dateutil.parser.parse(local_timezone)
                local_time_created_timezone = local_time_created_parsed.tzinfo

                previous_time_parsed = dateutil.parser.parse(previous_time)
                new_time_parsed = dateutil.parser.parse(new_time)
                time_gap_seconds = abs((previous_time_parsed - new_time_parsed).total_seconds())
                item["_PluginOutput"] = {}
                item["_PluginOutput"]["TimeGapSeconds"] = time_gap_seconds
                item["_PluginOutput"]["LocalPreviousTime"] = str(previous_time_parsed.astimezone(local_time_created_timezone))
                item["_PluginOutput"]["LocalNewTime"] = str(new_time_parsed.astimezone(local_time_created_timezone))

                data.append(item)

            elif EventID == "20000":
                local_timezone = item.get("_Metadata", {}).get("LocalTimeCreated", None)

                data.append(item)

        return rapidjson.dumps(data)

    @jinja2_view("time_change.html")
    def index(self):
        return {}
