# -*- coding: utf-8 -*-
"""
Very minimal implementation of JSON-RPC for Bottle.
"""
from __future__ import unicode_literals, print_function

import os
import sys
import traceback
import bottle

__author__ = 'Ole Martin Bjorndalen'
__email__ = 'ombdalen@gmail.com'
__url__ = 'http://github.com/olemb/bottle_jsonrpc/'
__license__ = 'MIT'
__version__ = '0.2.1'


def get_public_methods(obj):
    """Return a dictionary of all public callables in a namespace.

    This can be used for objects, classes and modules.
    """
    methods = {}

    for name in dir(obj):
        method = getattr(obj, name)
        if not name.startswith('_') and callable(method):
            methods[name] = method
        
    return methods


class NameSpace:
    def __init__(self, path, obj=None, app=None):
        self.path = path
        self.app = app or bottle.default_app()
        self.methods = {}

        if obj is not None:
            self.add_object(obj)

        self._make_handler()

    def add_object(self, obj):
        """Adds all public methods of the object."""
        self.methods.update(get_public_methods(obj))

    def _make_handler(self):
        """Sets up bottle request handler."""
        @self.app.post(self.path)
        def rpc():
            request = bottle.request.json
            
            try:
                name = request['method']
                func = self.methods[name]
                params = request.get('params', {})
                result = func(*params)

                return {
                    'id': request['id'],
                    'result': result,
                    'error': None,
                }                
            except:
                if not self.app.catchall:
                    raise
                traceback.print_exc(file=sys.stderr)
                response = { 
                    'id': request['id'],
                    'result': None,
                    'error': 'Internal server error',
                    }
                if bottle.debug:
                    response['traceback'] = traceback.format_exc()

                return response

    def __call__(self, func):
        """This is called when the mapper is used as a decorator."""
        self.methods[func.__name__] = func
        return func

register = NameSpace
