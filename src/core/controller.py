import logging
import os

import shutil
from ZODB import DB
import BTrees.OOBTree
import transaction
from hashlib import md5
from core.indexer import EventIndexer, AVAILABLE_INDEXERS


class GlossyCore(object):
    sources = None
    events = None
    settings = None
    indexer = None

    status = None

    def __init__(self):
        self.zodb_backend = DB(None)
        self.connection = self.zodb_backend.open()
        self.root = self.connection.root()
        self.root["sources"] = BTrees.OOBTree.BTree()
        self.root["events"] = BTrees.OOBTree.BTree()
        self.sources = self.root["sources"]
        self.events = self.root["events"]

        self.status = {}

    def _add_source_file(self, path):
        """
            add specific source file into database

        :param path: path of source file
        :return: id of source file
        """

        name, ext = os.path.splitext(path)

        if ext not in AVAILABLE_INDEXERS:
            # @todo: log exception
            return False

        path_hash = md5(bytes(path, encoding="utf-8")).hexdigest()
        self.sources[path_hash] = dict(pk=path_hash, path=path)

        msg = "source %s has been added" % path
        logging.info(msg)

        return True

    def add_source(self, selected_paths):
        """
            add multiple source files

        :param selected_paths: list of path(file / directory)
        :return: count of added source files
        """
        msg = "[CONTROLLER] invoked 'add_source' with %d paths" % len(selected_paths)
        logging.debug(msg)

        indexed_count = 0
        for idx, selected_path in enumerate(selected_paths, start=1):
            msg = "trying index source '%s'... (%02d / %02d)" % (selected_path, idx, selected_paths.__len__())
            logging.debug(msg)

            if not os.path.exists(selected_path):
                msg = "path '%s' is not exist" % selected_path
                logging.error(msg)
                continue

            if os.path.isfile(selected_path):
                self._add_source_file(selected_path)
                indexed_count = indexed_count + 1

            if os.path.isdir(selected_path):
                for directory, subdirectories, filenames in os.walk(selected_path):
                    for filename in filenames:
                        path = os.path.join(directory, filename)
                        self._add_source_file(path)
                        indexed_count = indexed_count + 1

        transaction.commit()

        return indexed_count

    def truncate_collections(self, collection_names):
        msg = "[CONTROLLER] invoked 'truncate_collections'"
        logging.debug(msg)

        for collection_name in collection_names:
            self.root[collection_name].clear()

        transaction.commit()

        return True

    def list_source(self):
        """
            returns list of sources as dictionary

        :return: list of sources
        """
        msg = "[CONTROLLER] invoked 'list_source'"
        logging.debug(msg)

        return list(self.sources.values())

    def delete_sources(self, ids):
        temporary_directory_path = os.path.join(
            os.path.abspath(".")
            , self.settings.get("TEMP_DIR")
        )
        temporary_directory_path = os.path.normpath(temporary_directory_path)

        for pk in ids:
            item = self.sources.pop(pk)

            source_path = item.get("path", "")

            if source_path and source_path.startswith(temporary_directory_path):
                os.remove(source_path)

            del item

        return True

    def terminate_indexer(self):
        if self.indexer:
            if self.indexer.is_alive():
                self.indexer.terminate()
                self.indexer.join()

            del self.indexer

    def process_sources(self):
        """
            process all sources
        """

        self.terminate_indexer()

        sources = self.sources
        self.truncate_collections(["events", ])

        self.indexer = EventIndexer()
        self.indexer.files_to_index.clear()
        self.indexer.settings = self.settings
        self.indexer.on_source_processed = self.on_source_processed
        self.indexer.on_progress_changed = self.on_progress_changed

        for k, v in sources.items():
            source_path = v.get("path", "")
            name, ext = os.path.splitext(source_path)

            if ext not in AVAILABLE_INDEXERS:
                msg = "%s is invalid evtx file!" % source_path
                logging.warning(msg)
                continue

            self.indexer.files_to_index.append(source_path)

        self.indexer.start()

    def on_source_processed(self, events):
        for event in events:
            event_id = len(self.events)
            event["_id"] = event_id
            self.events[event_id] = event

        transaction.commit()

        self.status = {}

    def on_progress_changed(self, total: int, processed: int):
        self.status["total"] = total
        self.status["processed"] = processed

    def get_current_status(self):
        return_value = self.status
        return_value["count_events"] = len(self.events)
        return_value["count_sources"] = len(self.sources)

        return return_value

    def get_events(self, ids):
        filtered = list(filter(
            lambda x: (
                x.get("_id", None) in ids
            )
            , self.events.values()
        ))

        return filtered

    def reset_all(self):
        temporary_directory_path = os.path.join(
            os.path.abspath(".")
            , self.settings.get("TEMP_DIR")
        )
        temporary_directory_path = os.path.normpath(temporary_directory_path)

        shutil.rmtree(temporary_directory_path, ignore_errors=True)

        self.truncate_collections(["events", "sources"])
        self.status.clear()

        return True
