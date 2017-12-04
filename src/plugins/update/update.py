# coding: utf-8
import os
import rapidjson
from bottle import jinja2_view
from core.plugin_base import PluginBase
import dateutil
import csv


class UpdatePlugin(PluginBase):
    name = "update"
    template_dir = "templates/"
    security_updates = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if not self._load_security_updates():
            # todo : "Security Updates.csv" not exist
            pass

    def _load_security_updates(self):
        self.security_updates = []
        filename = os.path.join(
            os.path.dirname(__file__), "Security Updates.csv"
        )

        if not os.path.exists(filename):
            return False

        with open(filename, "r") as file_object:
            lines = csv.reader(file_object, delimiter=',')
            for line in lines:
                self.security_updates.append(line)

        return True

    def ajax_win7_events(self):
        filtered = list(filter(
            lambda x: ("Microsoft-Windows-WindowsUpdateClient" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "19"))
            , self.events.values()
        ))

        update_info = []

        for event in filtered:
            update = []

            updateTitle = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
            start_idx = updateTitle.find("(KB")
            if start_idx != -1 :

                article = updateTitle[start_idx+1:-1]

                usb_local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
                parsed_date = dateutil.parser.parse(usb_local_time)
                time_string = "%d-%02d-%02d %02d:%02d:%02d" % (parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute, parsed_date.second)

                update.append(time_string)
                update.append(article)

                update_info.append(update)

        update_list = []
        # 중복제거용
        seen = set()

        for data in self.security_updates:
            date = data[0]
            product = data[1]
            platform = data[3]
            article = data[4]
            article = "KB" + article
            download = data[5]
            impact = data[7]

            if platform == "" :
                platform = product
                product = "Windows"

            if platform.find("Windows 7 for") != -1 and impact == "Remote Code Execution":
                platform = "Windows 7"
                concat_string = "%s_%s_%s_%s" % (date, product, platform, article)

                if concat_string not in seen:

                    event = {"_PluginResult": {}}
                    columns = date.split("/")
                    date = "%s-%s-%s" % (columns[2], columns[0], columns[1])

                    # 업데이트 이벤트 존재 여부
                    for update in update_info:
                        if article == update[1]:
                            event["_PluginResult"]["UpdateDate"] = update[0]

                    event["_PluginResult"]["Date"] = date
                    event["_PluginResult"]["Product"] = product
                    event["_PluginResult"]["Platform"] = platform
                    event["_PluginResult"]["Article"] = article
                    event["_PluginResult"]["Download"] = download

                    update_list.append(event)
                    seen.add(concat_string)

        return rapidjson.dumps(update_list)

    def ajax_win10_events(self):
        filtered = list(filter(
            lambda x: ("Microsoft-Windows-WindowsUpdateClient" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "19"))
            , self.events.values()
        ))

        update_info = []

        for event in filtered:
            update = []

            updateTitle = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
            start_idx = updateTitle.find("(KB")
            if start_idx != -1:

                article = updateTitle[start_idx+1:-1]

                usb_local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
                parsed_date = dateutil.parser.parse(usb_local_time)
                time_string = "%d-%02d-%02d %02d:%02d:%02d" % (parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute, parsed_date.second)

                update.append(time_string)
                update.append(article)

                update_info.append(update)

        update_list = []
        # 중복제거용
        seen = set()

        for data in self.security_updates:
            date = data[0]
            product = data[1]
            platform = data[3]
            article = data[4]
            article = "KB" + article
            download = data[5]
            impact = data[7]

            if platform == "" :
                platform = product
                product = "Windows"

            if platform.find("Windows 10 for") != -1 and impact == "Remote Code Execution":
                platform = "Windows 10"
                concat_string = "%s_%s_%s_%s" % (date, product, platform, article)

                if concat_string not in seen:

                    event = {"_PluginResult": {}}
                    columns = date.split("/")
                    date = "%s-%s-%s" % (columns[2], columns[0], columns[1])

                    # 업데이트 이벤트 존재 여부
                    for update in update_info:
                        if article == update[1]:
                            event["_PluginResult"]["UpdateDate"] = update[0]

                    event["_PluginResult"]["Date"] = date
                    event["_PluginResult"]["Product"] = product
                    event["_PluginResult"]["Platform"] = platform
                    event["_PluginResult"]["Article"] = article
                    event["_PluginResult"]["Download"] = download

                    update_list.append(event)
                    seen.add(concat_string)

        return rapidjson.dumps(update_list)



    def ajax_update_detail_events(self):
        filtered = list(filter(
            lambda x: ("Microsoft-Windows-WindowsUpdateClient" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "19"))
            , self.events.values()
        ))

        data = []

        for event in filtered:


            updateTitle = event.get("EventData", {}).get("Data", [])[0].get("#text", None)
            start_idx = updateTitle.find("(KB")
            if start_idx != -1 :
                event["_PluginResult"] = {}



                event["_PluginResult"]["updateTitle"] = updateTitle

                data.append(event)



        return rapidjson.dumps(data)


    @jinja2_view("update.html")
    def index(self):
        return {}
