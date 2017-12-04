# coding: utf-8
import os
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase


class DocumentPrintingPlugin(PluginBase):
    name = "document_printing"
    static_dir = os.path.join(os.path.dirname(__file__), "static/")
    template_dir = "templates/"

    def ajax_default_printer_changes(self):
        return_value = []

        filtered = list(filter(
            lambda x: (
                "Microsoft-Windows-PrintService" == x.get("System", {}).get("Provider", {}).get("@Name", None) and
                ("823" == x.get("System", {}).get("EventID", {}).get("#text", None)))
            , self.events.values()
        ))

        for event in filtered:
            new_default_printer = event.get("UserData", {}).get("ChangingDefaultPrinter", {}).get("NewDefaultPrinter", {}).get("#text", "")

            if "," in new_default_printer:
                x, y, z = new_default_printer.rsplit(",", 2)

            else:
                x, y, z = new_default_printer, None, None

            event["_PluginOutput"] = {}
            event["_PluginOutput"]["NewDefaultPrinterNameOnly"] = x
            event["_PluginOutput"]["y"] = y
            event["_PluginOutput"]["z"] = z

            return_value.append(event)

        return rapidjson.dumps(return_value)

    def ajax_events_detailed(self):
        _buf = {}

        filtered = list(filter(
            lambda x: (
                "Microsoft-Windows-PrintService" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (
                x.get("System", {}).get("EventID", {}).get("#text", None) in ("801", "842", "812", "805", "307")))
            , self.events.values()
        ))

        return_value = []

        count_dup_seen = 0
        for idx, event in enumerate(filtered):
            event_id = event.get("System", {}).get("EventID", {}).get("#text", "")
            process_id = event.get("System", {}).get("Execution", {}).get("@ProcessID", "")
            thread_id = event.get("System", {}).get("Execution", {}).get("@ThreadID", "")
            computer_name = event.get("System", {}).get("Computer", {}).get("#text", "")

            if computer_name not in _buf:
                _buf[computer_name] = {}

            print_task_key = "%s_%s" % (process_id, thread_id)

            if print_task_key not in _buf[computer_name]:
                _buf[computer_name][print_task_key] = {}

            # 현재 이벤트 ID가 801인데, 801이 프로세스 ID / 스레드 ID에 이미 추가되어 있다면 우연하게도 이전에 동일한 조합으로 등록되었다는 뜻이므로 pop 해서 미리 빼놓는다
            if ("801" == event_id) and "801" in _buf[computer_name][print_task_key]:
                poped = _buf[computer_name].pop(print_task_key)
                return_value.append(poped)
                _buf[computer_name][print_task_key] = {}

            # 조금 느려질 수 있겠지만 그냥 이벤트 전부 반환해야 인쇄시점 등을 표시할 수 있다
            _buf[computer_name][print_task_key][event_id] = event

        for computer, tasks in _buf.items():
            for k, v in tasks.items():
                # 그냥 버리기에는 조금 아깝긴 한데, 307이 없으면 유의미한 정보가 거의 안나와서 307이 없으면 스킵
                if "307" in v:
                    return_value.append(v)

        return rapidjson.dumps(return_value)

    def ajax_events(self):
        filtered = list(filter(
            lambda x: "Microsoft-Windows-PrintService" == x.get("System", {}).get("Provider", {}).get("@Name", None)
            , self.events.values()
        ))

        return rapidjson.dumps(filtered)

    @jinja2_view("document_printing.html")
    def index(self):
        return {}
