# coding: utf-8
# filesystem redirector by zxw(https://code.activestate.com/recipes/578035-disable-file-system-redirector/)
import os
import ctypes


class DisableFileSystemRedirection:
    _disable = None
    _enable = None

    def __init__(self):
        if "nt" == os.name:
            self._disable = ctypes.windll.kernel32.Wow64DisableWow64FsRedirection
            self._enable = ctypes.windll.kernel32.Wow64RevertWow64FsRedirection

    def __enter__(self):
        if "nt" == os.name:
            self.old_value = ctypes.c_long()
            self.success = self._disable(ctypes.byref(self.old_value))

    def __exit__(self, type, value, traceback):
        if "nt" == os.name:
            if self.success:
                self._enable(self.old_value)
