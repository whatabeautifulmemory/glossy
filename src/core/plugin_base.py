import os
import sys
from bottle import static_file, abort, TEMPLATE_PATH


class PluginBase(object):
    events = None
    _plugin_dir = None
    template_dir = None

    def __init__(self, *args, **kwargs):
        self._plugin_dir = kwargs.get("plugin_dir", None)

        if not self._plugin_dir:
            self._plugin_dir = os.path.dirname(sys.modules[self.__module__].__file__)

        if self.template_dir:
            self._setup_template_dir()

    def _setup_template_dir(self):
        current_template_dir = os.path.join(self._plugin_dir, self.template_dir)

        if current_template_dir not in TEMPLATE_PATH:
            TEMPLATE_PATH.append(current_template_dir)

    def index(self):
        raise NotImplementedError

    def process(self, path):
        if not path:
            return self.index()

        if "/" in path:
            command, variable = path.split("/", 1)

        else:
            command = path
            variable = None

        if ("process" != command) and (not command.startswith("_")):
            method_to_invoke = getattr(self, command, None)

            if method_to_invoke and variable:
                return method_to_invoke(variable)

            elif method_to_invoke:
                return method_to_invoke()

        else:
            abort(404, "method not found")

    def static(self, path=None):
        if not path:
            abort(404, "resource not found")

        static_directory = os.path.join(self._plugin_dir, "static/")
        return static_file(path, static_directory)
