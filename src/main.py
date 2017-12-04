# coding: utf-8
import os
import importlib.util
import json
import logging
import rapidjson

import shutil

import sys
from bottle import route, run, static_file, jinja2_view, TEMPLATE_PATH, request, install, response, abort, BaseTemplate, \
    redirect

from contrib import bottle_jsonrpc
from contrib.bottle_jstree import get_directories
from core.controller import GlossyCore
from core.default_settings import DEFAULT_SETTINGS
from core.rpc import GlossyRPC
from utils.filesystem_redirection_disabler import DisableFileSystemRedirection

try:
    if "nt" == os.name:
        import win32api

except ImportError as error:
    raise ImportError("win32api not found")

TEMPLATE_PATH[:] = ['./templates/']
PLUGINS = {}
SETTINGS = {}


glossy_core = GlossyCore()
rpc_client = GlossyRPC(glossy_core)


@route('/listing')
def listing():
    response.content_type = 'application/json'

    operation = request.GET.get("operation", None)
    path = request.GET.get("id", None)

    operation_map = {
        "list_directories": lambda: get_directories(path),
        "get_content": lambda: get_directories(path),
    }

    if operation not in operation_map:
        return False

    result = operation_map[operation]()

    return rapidjson.dumps(result)


@route('/static/<path:path>')
def serve_static(path):
    return static_file(path, "./templates/static/")


@route('/plugin/<plugin_name>/')
@route('/plugin/<plugin_name>/<path:path>')
def process_plugin(plugin_name, path=None):
    plugin_object = PLUGINS.get(plugin_name, None)

    if not plugin_object:
        abort(404, "no such plugin")

    plugin_object.events = glossy_core.events
    return plugin_object.process(path)


@route("/upload/", method="POST")
def upload():
    response.content_type = 'application/json'
    msg = ""

    relative_path = request.GET.get("filename", None)
    directory_name, file_name = os.path.split(relative_path)

    if not relative_path:
        response.status = 400
        msg = "relative_path not given"
        return json.dumps({'error': msg})

    if ".." in relative_path:
        response.status = 400
        msg = "invalid file upload"
        return json.dumps({'error': msg})

    # if not file_name.lower().endswith(".evtx"):
    #     response.status = 400
    #     msg = "invalid file upload"
    #     return json.dumps({'error': msg})

    temporary_directory_path = os.path.join(
        os.path.abspath(".")
        , SETTINGS.get("TEMP_DIR")
    )
    temporary_directory_path = os.path.normpath(temporary_directory_path)

    evtx_upload_directory = os.path.join(temporary_directory_path, directory_name)
    os.makedirs(evtx_upload_directory, exist_ok=True)

    # 사실 루프를 돌 필요는 없다
    for k, v in request.files.items():
        os.path.join(".")

        upload_to = os.path.join(evtx_upload_directory, file_name)
        upload_to = os.path.normpath(upload_to)

        v.save(upload_to)
        glossy_core.add_source([upload_to])

    return rapidjson.dumps({})


@route("/favicon.ico")
def favicon_redirector():
    redirect("/static/misc/favicon.ico")


@route('/')
@jinja2_view("index.html")
def index():
    retval = {
        # "sources": glossy_core.sources,
        # "events_count": glossy_core.events.__len__(),
    }

    return retval


def _load_plugins(seed_dict):
    return_value = {}

    for k, v in seed_dict.items():
        if isinstance(v, dict):
            return_value[k] = _load_plugins(v)
            continue

        if "plugin" != k:
            return_value[k] = v
            continue

        # plugin loading
        module_path, class_name = v.rsplit(":", 1)
        spec = importlib.util.spec_from_file_location(class_name, module_path)
        imported_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(imported_module)

        plugin_class = getattr(imported_module, class_name)
        try:
            plugin_object = plugin_class(
                plugin_dir=os.path.dirname(module_path)
            )
            return_value[k] = plugin_object
            PLUGINS[plugin_object.name] = plugin_object

        except KeyError:
            print("KeyError on _load_plugins #2")

    return return_value


def _load_settings(settings_path):
    return_value = {}

    if not os.path.exists(settings_path) and os.path.isfile(settings_path):
        return DEFAULT_SETTINGS

    with open(settings_path) as file_object:
        loaded_settings = json.load(file_object)

        for k, v in loaded_settings.items():
            return_value[k] = v

    return return_value


def main():
    global SETTINGS
    SETTINGS = _load_settings("./settings.json")

    loaded_plugins = _load_plugins(SETTINGS.get("ENABLED_PLUGINS", {}))

    glossy_core.settings = SETTINGS
    BaseTemplate.defaults['settings'] = SETTINGS
    BaseTemplate.defaults['plugins'] = loaded_plugins

    temporary_directory = SETTINGS.get("TEMP_DIR", "./temp/")
    shutil.rmtree(temporary_directory, ignore_errors=True)
    os.mkdir(temporary_directory)

    if SETTINGS.get("DEBUG", False):
        logging.basicConfig(
            filename=SETTINGS.get("DEBUG_LOG_FILENAME", "glossy.log")
            , level=SETTINGS.get("DEBUG_LOG_LEVEL", "DEBUG")
            , format='%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s'
            , datefmt='%Y-%m-%d-:%H:%M:%S'
        )

    else:
        logging.disable(sys.maxsize)

    bottle_jsonrpc.register('/api', rpc_client)
    run(
        host=SETTINGS.get("HOST", "127.0.0.1"),
        port=SETTINGS.get("PORT", "9494"),
        server="tornado",
        reloader=True,
        debug=SETTINGS.get("DEBUG", False)
    )


if "__main__" == __name__:
    try:
        with DisableFileSystemRedirection():
            main()

    except KeyboardInterrupt as error:
        print("Bye Bye!")
