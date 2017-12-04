import logging
import threading
import time

import os

import dateutil
import pytz

from .converters.evtx import evtx_file_to_dicts


AVAILABLE_INDEXERS = {
    ".evtx": evtx_file_to_dicts,
}


class EventIndexer(threading.Thread):
    files_to_index = None
    processed_count = 0
    lock_object = None
    _is_terminate_requested = False
    settings = None

    def __init__(self, group=None, target=None, name=None, args=(), kwargs=None, *, daemon=None):
        super().__init__(group, target, name, args, kwargs, daemon=daemon)
        self.files_to_index = []
        self.lock_object = threading.Lock()

    def terminate(self):
        self._is_terminate_requested = True

    def index_source(self, source_path):
        name, ext = os.path.splitext(source_path)
        event_dicts = AVAILABLE_INDEXERS[ext](source_path)
        # events = []
        for idx, event_dict in enumerate(event_dicts):
            event_dict["_Metadata"] = {}

            # source path setting
            event_dict["_Metadata"]["Source"] = source_path

            # timezone convert
            parsed_timecreated = dateutil.parser.parse(event_dict["System"]["TimeCreated"]["@SystemTime"])
            recalculated_timecreated = parsed_timecreated.astimezone(pytz.timezone(self.settings.get("TIME_ZONE")))
            event_dict["_Metadata"]["LocalTimeCreated"] = str(recalculated_timecreated)

            # events.append(event_dict)

        msg = "source %s has been processed with %d items" % (source_path, event_dicts.__len__())
        logging.info(msg)

        return event_dicts

    def run(self):
        self.processed_count = 0
        for idx, file_to_index in enumerate(self.files_to_index):
            if self._is_terminate_requested:
                break

            results = self.index_source(file_to_index)

            self.processed_count = self.processed_count + 1
            self.on_source_processed(results)
            self.on_progress_changed(self.files_to_index.__len__(), self.processed_count)

            time.sleep(0)

    def on_source_processed(self, events):
        pass

    def on_progress_changed(self, total: int, remain: int):
        pass
