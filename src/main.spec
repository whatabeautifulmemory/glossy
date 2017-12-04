# -*- mode: python -*-

block_cipher = None


a = Analysis(["main.py"],
             pathex=["./src"],
             binaries=[],
             datas=[],
             hiddenimports=[
                 # python built-in
                 "csv",

                 # 3rd party
                 "IP2Location",
                 "dateutil",
                 "dateutil.parser",

                 # glossy internal
                 "contrib",
                 "core.plugin_base",
                 "utils.plugin_tools.convert_tag_list",
                 "utils.plugin_tools.geoip",
                 "utils.plugin_tools.sort"
             ],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name="glossy",
          icon="../resources/glossy.ico",
          debug=False,
          strip=False,
          upx=True,
          uac_admin=True,
          console=True )