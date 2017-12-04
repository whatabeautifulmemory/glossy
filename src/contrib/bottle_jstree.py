# coding: utf-8
from __future__ import print_function
import os
try:
    if "nt" == os.name:
        import win32api

except ImportError as error:
    raise ImportError("bottle-jstree requires win32api")


def has_children(path, filter_function=None):
    try:
        children = [os.path.join(path, entry) for entry in os.listdir(path)]

        if filter_function:
            return 0 < len(list(filter(filter_function, children)))

        else:
            return 0 < children.__len__()

    except PermissionError as error:
        return False


def filter_directory(path):
    return os.path.exists(path) and os.path.isdir(path)


def get_logical_drives():
    return win32api.GetLogicalDriveStrings().split('\000')[:-1]


def get_directories(path):
    return_value = []

    if path == "#":
        if "nt" == os.name:
            logical_drive_letters = get_logical_drives()

            for logical_drive_letter in logical_drive_letters:
                item = dict()
                item["id"] = logical_drive_letter
                item["text"] = logical_drive_letter
                item["children"] = has_children(logical_drive_letter)
                return_value.append(item)

        else:
            item = dict()
            item["id"] = "/"
            item["text"] = "/"
            item["children"] = has_children("/")
            return_value.append(item)

        return return_value

    for entry in os.listdir(path):
        full_path = os.path.join(path, entry)

        if os.path.isdir(full_path):
            item = dict()
            item["id"] = full_path
            item["text"] = entry
            item["children"] = has_children(full_path, filter_directory)
            return_value.append(item)

    return return_value
