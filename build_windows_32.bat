@echo off
echo ===============================
echo Glossy build script for Windows
echo ===============================

set PATH=%PATH%;.\build_tools\upx\

rmdir /S /Q dist
mkdir dist

cd src
rmdir /S /Q build
rmdir /S /Q dist
mkdir build
mkdir dist

C:\Python36-32\Scripts\pyinstaller.exe --clean main.spec
copy .\dist\glossy.exe ..\dist\
copy settings.json ..\dist\
xcopy plugins ..\dist\plugins\ /s /h /e /k /f /c > NUL
xcopy templates ..\dist\templates\ /s /h /e /k /f /c > NUL
xcopy data ..\dist\data\ /s /h /e /k /f /c > NUL
cd ..
copy .\resources\vcredist_x86.exe .\dist\
copy .\resources\vcredist_x64.exe .\dist\
copy .\docs\user_guide.pdf .\dist\

.\build_tools\verpatch\verpatch.exe .\dist\glossy.exe /va 0.0.0.1 ^
  /s CompanyName    " " ^
  /s LegalCopyright " " ^
  /s ProductName    "Glossy Event Log Forensics" ^
  /pv 0.0.0.1 ^
  /s Description    "Glossy Event Log Forensics : EVTX Analyzer"

.\build_tools\resource_hacker\ResourceHacker.exe -log CONSOLE -action addoverwrite -open .\dist\glossy.exe -save .\dist\glossy.exe, -resource .\resources\glossy.exe.manifest -mask 24,1,1033

start dist
