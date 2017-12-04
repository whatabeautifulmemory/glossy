# coding: utf-8
import logging

import shutil

import os


class GlossyRPC(object):
    core = None

    def __init__(self, core):
        if not core:
            raise ValueError

        self.core = core

    def add_source(self, *selected_paths):
        msg = "[JSONRPC] invoked 'add_source' with %d paths" % len(selected_paths)
        logging.debug(msg)

        return self.core.add_source(selected_paths)

    def list_source(self):
        msg = "[JSONRPC] invoked 'list_source'"
        logging.debug(msg)

        sources_list = [
            dict(pk=source.get("pk"), path=source.get("path")) for source in self.core.list_source()
        ]

        return sources_list

    def process_sources(self):
        msg = "[JSONRPC] invoked 'process_sources'"
        logging.debug(msg)

        return self.core.process_sources()

    def reset_all(self):
        msg = "[JSONRPC] invoked 'reset_all'"
        logging.debug(msg)

        self.core.terminate_indexer()

        return self.core.reset_all()

    def get_current_status(self):
        msg = "[JSONRPC] invoked 'get_current_status'"
        logging.debug(msg)

        return self.core.get_current_status()

    def get_events(self, *ids):
        msg = "[JSONRPC] invoked 'get_events'"
        logging.debug(msg)

        return self.core.get_events(ids)

    def delete_sources(self, *ids):
        msg = "[JSONRPC] invoked 'delete_sources'"
        logging.debug(msg)

        return self.core.delete_sources(ids)
