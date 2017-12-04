# coding: utf-8
import rapidjson
from bottle import static_file, abort, request, jinja2_view, TEMPLATE_PATH, response
from core.plugin_base import PluginBase
import operator
import dateutil
from utils.plugin_tools.sort import sort_by_timecreated

class USBStoragePlugin(PluginBase):
    name = "usb_storage"
    template_dir = "templates/"

    def get_usbinfo(self, DeviceInstanceID):
        data = []
        MTP_VENDOR_LIST = {
            "04E8": [
                "Samsung", {
                    "6860": "Mobile",
                    "6865": "Mobile"
                }
            ],
            "043E": [
                "LG", {
                    "0000": "Mobile",
                    "0000": "Mobile"
                }
            ],
            "05AC": [
                "Apple", {
                    "0000": "Mobile",
                    "0000": "Mobile"
                }
            ]
        }

        vendor_name = ""
        product_name = ""
        serial = ""
        type = ""

        # if DeviceInstanceID[:14] == "WPDBUSENUMROOT":
        if DeviceInstanceID.startswith("WPDBUSENUMROOT") :
            ven_index = DeviceInstanceID.find("&VEN_") + 1
            prod_index = DeviceInstanceID.find("&PROD_") + 1
            rev_index = DeviceInstanceID.find("&REV")

            serial_index = DeviceInstanceID[rev_index:].find("#")

            serialend_index = DeviceInstanceID[rev_index + serial_index:].find("&")

            vendor_name = DeviceInstanceID[ven_index + 4:prod_index - 1]
            product_name = DeviceInstanceID[prod_index + 5:rev_index]
            product_name = product_name.replace("_", " ")
            serial = DeviceInstanceID[rev_index + serial_index + 1:rev_index + serial_index + serialend_index]
            type = "memory"


        elif  DeviceInstanceID.startswith("USBSTOR"):
            ven_index = DeviceInstanceID.find("&VEN_") + 1
            prod_index = DeviceInstanceID.find("&PROD_") + 1
            rev_index = DeviceInstanceID.find("&REV")

            serial_index = DeviceInstanceID[rev_index:].find("\\")

            serialend_index = DeviceInstanceID[rev_index + serial_index:].find("&")

            vendor_name = DeviceInstanceID[ven_index + 4:prod_index - 1]
            product_name = DeviceInstanceID[prod_index + 5:rev_index]
            product_name = product_name.replace("_", " ")
            serial = DeviceInstanceID[rev_index + serial_index + 1:rev_index + serial_index + serialend_index]
            type = "disk"


        elif DeviceInstanceID.startswith("USB"):
            columns = DeviceInstanceID.split("\\")
            vid_index = DeviceInstanceID.find("VID_") + 1
            pid_index = DeviceInstanceID.find("PID_") + 1
            vendor_code = DeviceInstanceID[vid_index + 3: vid_index + 3 + 4]
            product_code = DeviceInstanceID[pid_index + 3: pid_index + 3 + 4]
            serial = columns[2]
            vendor = MTP_VENDOR_LIST.get(vendor_code)

            if vendor == None :
                vendor_name = vendor_code
                product_name = product_code
            else :
                vendor_name = vendor[0]

                product_name = vendor[1].get(product_code)

                if product_name == None :
                    product_name = product_code

            type = "mobile"

        elif DeviceInstanceID.startswith("SWD"):
            # WIN10 Only


            if DeviceInstanceID.find("USBSTOR#") != -1:
                ven_index = DeviceInstanceID.find("&VEN_") + 1
                prod_index = DeviceInstanceID.find("&PROD_") + 1
                rev_index = DeviceInstanceID.find("&REV")

                serial_index = DeviceInstanceID[rev_index:].find("#")

                serialend_index = DeviceInstanceID[rev_index + serial_index:].find("&")

                vendor_name = DeviceInstanceID[ven_index + 4:prod_index - 1]
                product_name = DeviceInstanceID[prod_index + 5:rev_index]
                product_name = product_name.replace("_", " ")
                serial = DeviceInstanceID[rev_index + serial_index + 1:rev_index + serial_index + serialend_index]
                type = "memory"
            else :

                columns = DeviceInstanceID.split("\\")
                columns2 = columns[2].split("#")

                vendor_name = ""
                product_name = ""
                serial = columns2[0].replace("{", "").replace("}", "")
                type = "disk"



        data.append(vendor_name)
        data.append(product_name)
        data.append(serial)
        data.append(type)
        return data


    def convert_capacity(self, capacity):

        if capacity != "":
            disksize = float(capacity)

            disksize = int(disksize / 1024 / 1024)

            if disksize > 1000:
                disksize = disksize / 1024

                disksize = ("%.1f GB" )% (disksize)
            else:
                disksize = ("%.1f MB") % (disksize)
        else:
            disksize = ""


        return disksize


    def ajax_dashboard_events(self):
        filtered = list(filter(
            lambda x: ("Microsoft-Windows-UserPnp" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "20001"))
                    or ("Microsoft-Windows-DriverFrameworks-UserMode" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "10000"))
                    or ("Microsoft-Windows-DriverFrameworks-UserMode" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("2101", "2102"))
                    or ("Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) =="4624") and "User32" == x.get("EventData", {}).get("Data", [])[9].get("#text", None))
                    or ("Microsoft-Windows-Partition" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "1006")))
            , self.events.values()
        ))
        #####################################
        # 사용자 로그온 리스트
        #####################################
        user_logon_history = []
        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)
            if EventID == "4624" :
                user_data = []

                # time, Name
                local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
                TargetUserName = event.get("EventData", {}).get("Data", [])[5].get("#text", None)

                user_data.append(TargetUserName)
                user_data.append(local_time)

                user_logon_history.append(user_data)

        # 시간 내림차순으로정렬
        user_logon_history = sorted(user_logon_history, key=operator.itemgetter(1), reverse=True)


        #####################################
        # win10 파티션 정보 리스트
        #####################################
        # 중복제거용
        seen = set()
        partition_list = []
        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)
            if EventID == "1006":
                # usbinfo
                partition_data = []
                Capacity = event.get("EventData", {}).get("Data", [])[9].get("#text", None)

                if Capacity == "0" :
                    continue
                vendor = event.get("EventData", {}).get("Data", [])[11].get("#text", "")
                product = event.get("EventData", {}).get("Data", [])[12].get("#text", "")
                serial = event.get("EventData", {}).get("Data", [])[14].get("#text", None)

                registryid = event.get("EventData", {}).get("Data", [])[21].get("#text", None)
                registryid = registryid.replace("{", "").replace("}", "")

                if serial not in seen:
                    partition_data.append(Capacity)
                    partition_data.append(vendor)
                    partition_data.append(product)
                    partition_data.append(serial)
                    partition_data.append(registryid)
                    partition_list.append(partition_data)
                    seen.add(serial)


        #####################################
        # USB 연결 히스토리
        #####################################
        filtered = sort_by_timecreated(filtered, reverse=False)

        usb_connect_history = []
        # 중복제거용
        seen = set()
        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            if EventID == "2101" or EventID == "2102":
                # 날짜, 구분(연결/해제), 장치명, 시리얼번호, 사용자
                # 동일한 이벤트가 두세번씩 나오기때문에 리스트에 시간, 시리얼, 이벤트번호가 동일한 값이 있는 경우 스킵
                usb_connect = []
                DeviceInstanceID = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("@instance", None)
                if DeviceInstanceID == None :
                    DeviceInstanceID = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("InstanceId", {}).get("#text", None)

                if DeviceInstanceID.startswith("WPDBUSENUMROOT") or DeviceInstanceID.startswith("SWD") or DeviceInstanceID.startswith("USB"):

                    usb_local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
                    parsed_date = dateutil.parser.parse(usb_local_time)

                    minor = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("Request", {}).get("@minor", None)
                    if minor == None :
                        minor = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("RequestMinorCode", {}).get("#text",  None)


                    time_string = "%d-%02d-%02d %02d:%02d:%02d" % (parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute, parsed_date.second)

                    # minor 값을 확인하여 중복 방지
                    # 2101 : 20
                    # 2102 : 2

                    if EventID == "2101" and minor == "20":
                        usbinfo = self.get_usbinfo(DeviceInstanceID)
                        usb_connect.append(time_string)
                        usb_connect.append("<span class=\"label label-primary\">연결</span>")
                        usb_connect.append(EventID)

                        vendor = usbinfo[0]
                        product = usbinfo[1]
                        serial = usbinfo[2]
                        #(win10 해당됨) 시리얼과 파티션 테이블의 레지스트리 아이디가 같으면 해당 정보로 변경
                        for partition_data in partition_list :
                            if (serial == partition_data[3]) or (serial == partition_data[4]):
                                vendor = partition_data[1]
                                product = partition_data[2]
                                serial = partition_data[3]
                                break


                        usb_connect.append(vendor)
                        usb_connect.append(product)
                        usb_connect.append(serial)
                        usb_connect.append(usbinfo[3])

                        # USB 사용자 확인, user_logon_history 는 내림차순 정렬되어 있음
                        usb_user_name = "알수없음"
                        for history in user_logon_history:
                            user_name = history[0]
                            user_logon_time = history[1]
                            # 최근 사용자 확인
                            if user_logon_time < usb_local_time:
                                usb_user_name = user_name
                                break
                        usb_connect.append(usb_user_name)
                        usb_connect.append(False)  # 히스토리 참조여부
                        usb_connect_history.append(usb_connect)

                    elif EventID == "2102" and (minor == "2" or minor == "3"):
                        usbinfo = self.get_usbinfo(DeviceInstanceID)
                        usb_connect.append(time_string)
                        usb_connect.append("<span class=\"label label-danger\">해제</span>")
                        usb_connect.append(EventID)

                        vendor = usbinfo[0]
                        product = usbinfo[1]
                        serial = usbinfo[2]
                        # (win10 해당됨) 시리얼과 파티션 테이블의 레지스트리 아이디가 같으면 해당 정보로 변경
                        for partition_data in partition_list:
                            if (serial == partition_data[3]) or (serial == partition_data[4]):
                                vendor = partition_data[1]
                                product = partition_data[2]
                                serial = partition_data[3]
                                break

                        usb_connect.append(vendor)
                        usb_connect.append(product)
                        usb_connect.append(serial)

                        usb_connect.append(usbinfo[3])

                        # USB 사용자 확인, user_logon_history 는 내림차순 정렬되어 있음
                        usb_user_name = "알수없음"
                        for history in user_logon_history:
                            user_name = history[0]
                            user_logon_time = history[1]
                            # 최근 사용자 확인
                            if user_logon_time < usb_local_time:
                                usb_user_name = user_name
                                break
                        usb_connect.append(usb_user_name)
                        usb_connect.append(False)  # 히스토리 참조여부
                        usb_connect_history.append(usb_connect)



        # win 10 에서 2101, 2102 가 없는 경우 비활성화되어 히스토리가 수집이 안되있음
        # 그런경우 정확하진 않지만 차선으로 partition 에서 히스토리 수집
        if len(usb_connect_history) == 0 :
            for event in filtered:
                EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

                if EventID == "1006" :


                    usb_connect = []

                    Capacity = event.get("EventData", {}).get("Data", [])[9].get("#text", None)

                    usb_local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
                    parsed_date = dateutil.parser.parse(usb_local_time)

                    time_string = "%d-%02d-%02d %02d:%02d:%02d" % ( parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute, parsed_date.second)

                    # usbinfo
                    vendor = event.get("EventData", {}).get("Data", [])[11].get("#text", None)
                    product = event.get("EventData", {}).get("Data", [])[12].get("#text", None)
                    serial = event.get("EventData", {}).get("Data", [])[14].get("#text", None)


                    # 용량이 0 인경우 해제
                    if Capacity == "0" :
                        # disconnect

                        usb_connect.append(time_string)
                        usb_connect.append("<span class=\"label label-danger\">해제</span>")
                        usb_connect.append(EventID)
                        usb_connect.append(vendor)
                        usb_connect.append(product)
                        usb_connect.append(serial)
                        usb_connect.append("unknown")

                        # USB 사용자 확인, user_logon_history 는 내림차순 정렬되어 있음
                        usb_user_name = "알수없음"
                        for history in user_logon_history:
                            user_name = history[0]
                            user_logon_time = history[1]
                            # 최근 사용자 확인
                            if user_logon_time < usb_local_time:
                                usb_user_name = user_name
                                break
                        usb_connect.append(usb_user_name)
                        usb_connect.append(False)  # 히스토리 참조여부
                        usb_connect_history.append(usb_connect)
                    else :
                        # connect
                        usb_connect.append(time_string)
                        usb_connect.append("<span class=\"label label-primary\">연결</span>")
                        usb_connect.append(EventID)
                        usb_connect.append(vendor)
                        usb_connect.append(product)
                        usb_connect.append(serial)
                        usb_connect.append("unknown")

                        # USB 사용자 확인, user_logon_history 는 내림차순 정렬되어 있음
                        usb_user_name = "알수없음"
                        for history in user_logon_history:
                            user_name = history[0]
                            user_logon_time = history[1]
                            # 최근 사용자 확인
                            if user_logon_time < usb_local_time:
                                usb_user_name = user_name
                                break
                        usb_connect.append(usb_user_name)
                        usb_connect.append(False)  # 히스토리 참조여부
                        usb_connect_history.append(usb_connect)



        #####################################
        # MTP 장치 목록 가져오기
        #####################################
        mtp_list = []
        external_device_list = []
        for event in filtered:
            # DriverName == wpdmtp.inf
            # MTP 장치 구분
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            if EventID == "20001":
                DeviceInstanceID = event.get("UserData", {}).get("InstallDeviceID", {}).get("DeviceInstanceID", {}).get("#text", None)
                DriverName = event.get("UserData", {}).get("InstallDeviceID", {}).get("DriverName", {}).get("#text",None)

                # USB\VID_04E8&PID_6860\0B15038F14190B8E

                # mtp 드라이버만
                if DriverName.find("wpdmtp.inf") != -1:

                    usbinfo = self.get_usbinfo(DeviceInstanceID)

                    mtp_list.append(usbinfo[2])



        #####################################
        # 10000번 기반(최초사용) USB 리스트뷰 작성
        # Win10 에서 외장하드는 registryid 형태로 남기 때문에 partition 정보가 있는 경우 해당 테이블에서 시리얼 정보 참조
        #####################################
        usb_connect_info = []
        seen = set()
        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)

            if EventID == "10000" :

                DeviceInstanceID = event.get("UserData", {}).get("UMDFDeviceInstallBegin", {}).get("DeviceId", {}).get("#text", None)
                if DeviceInstanceID.startswith("WPDBUSENUMROOT") or DeviceInstanceID.startswith("SWD") or DeviceInstanceID.startswith("USB") :
                # WPDBUSENUMROOT\UMB\2&37C186B&0&STORAGE#VOLUME#_??_USBSTOR#DISK&VEN_BIZET&PROD_SECUYOUSB&REV_1100#650402230001179621
                # USB\VID_04E8&PID_6860\5210EFA66404B3F5

                    usbinfo = self.get_usbinfo(DeviceInstanceID)
                    vendor = usbinfo[0]
                    product = usbinfo[1]
                    serial = usbinfo[2]
                    type = usbinfo[3]
                    capacity = ""

                    # (win10 해당됨) 시리얼과 파티션 테이블의 레지스트리 아이디가 같으면 해당 정보로 변경
                    for partition_data in partition_list:
                        if serial == partition_data[3] or serial == partition_data[4]:
                            vendor = partition_data[1]
                            product = partition_data[2]
                            serial = partition_data[3]
                            capacity = self.convert_capacity(partition_data[0])
                            break


                    if serial not in seen:

                        usb_local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
                        parsed_date = dateutil.parser.parse(usb_local_time)
                        time_string = "%d-%02d-%02d %02d:%02d:%02d" % (parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute,parsed_date.second)

                        usb_connect = {}
                        usb_connect["FirstDate"] = time_string

                        usb_connect["Vendor"] = vendor
                        usb_connect["Product"] = product
                        usb_connect["Serial"] = serial
                        usb_connect["Type"] = type
                        usb_connect["Capacity"] = capacity
                        usb_connect["Etc"] = ""

                        # MTP 장치 여부 확인
                        for mtp in mtp_list :
                            if usbinfo[2] == mtp :

                                usb_connect["Etc"] = "MTP"


                        # USB 사용자 확인, user_logon_history 는 내림차순 정렬되어 있음
                        usb_user_name = "알수없음"
                        for history in user_logon_history:
                            user_name = history[0]
                            user_logon_time = history[1]
                            # 최근 사용자 확인
                            if user_logon_time < usb_local_time :
                                usb_user_name = user_name
                                break

                        usb_connect["User"] = usb_user_name

                        # 연결 히스토리 확인
                        sub_usb_connect = []

                        # 10000 번 이벤트 리스트에 없는 경우 따로 분류후 리스팅
                        last_date = ""
                        i = 0
                        for usb_connect_history_data in  usb_connect_history :
                            # 시리얼 번호가 같은경우

                            if usb_connect_history_data[5] == serial :


                                # 참조된것 체크, 참조안된건 따로 리스트업
                                usb_connect_history[i][8] = True

                                sub_usb_connect_data = {}
                                sub_usb_connect_data["Sub_Date"] = usb_connect_history_data[0]
                                sub_usb_connect_data["Sub_Gubun"] = usb_connect_history_data[1]
                                sub_usb_connect_data["Sub_EventID"] = usb_connect_history_data[2]
                                sub_usb_connect_data["Sub_Vendor"] = usb_connect_history_data[3]
                                sub_usb_connect_data["Sub_Product"] = usb_connect_history_data[4]
                                sub_usb_connect_data["Sub_Serial"] = usb_connect_history_data[5]
                                sub_usb_connect_data["Sub_User"] = usb_connect_history_data[7]

                                sub_usb_connect.append(sub_usb_connect_data)
                                last_date = usb_connect_history_data[0]
                            i += 1

                        usb_connect["LastDate"] = last_date


                        usb_connect["nested"] = sub_usb_connect
                        usb_connect_info.append(usb_connect)
                        seen.add(serial)

        #####################################
        # 외장디스크는 20001번만 발생하고 10000번은 발생하지 않음 (Win 7)
        # Win 10은 10000번, 20001번 구분 불필요
        #####################################
        for event in filtered:
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)
            if EventID == "20001" :
                DriverName = event.get("UserData", {}).get("InstallDeviceID", {}).get("DriverName", {}).get("#text",None)
                DeviceInstanceID = event.get("UserData", {}).get("InstallDeviceID", {}).get("DeviceInstanceID", {}).get("#text", None)

                # Win 7 Only
                if DriverName.find("disk.inf") != -1 and DeviceInstanceID[:7] == "USBSTOR":


                    usbinfo = self.get_usbinfo(DeviceInstanceID)

                    vendor = usbinfo[0]
                    product = usbinfo[1]
                    serial = usbinfo[2]
                    type = usbinfo[3]
                    capacity = ""
                    # (win10 해당됨) 시리얼과 파티션 테이블의 레지스트리 아이디가 같으면 해당 정보로 변경
                    for partition_data in partition_list:
                        if serial == partition_data[3] or serial == partition_data[4]:
                            vendor = partition_data[1]
                            product = partition_data[2]
                            serial = partition_data[3]
                            capacity = self.convert_capacity(partition_data[0])
                            break

                    # seen list 에 없으면 외장hdd 추정
                    if serial not in seen:
                        usb_local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)
                        parsed_date = dateutil.parser.parse(usb_local_time)
                        time_string = "%d-%02d-%02d %02d:%02d:%02d" % ( parsed_date.year, parsed_date.month, parsed_date.day, parsed_date.hour, parsed_date.minute, parsed_date.second)

                        usb_connect = {}
                        usb_connect["FirstDate"] = time_string

                        usb_connect["Vendor"] = vendor
                        usb_connect["Product"] = product
                        usb_connect["Serial"] = serial
                        usb_connect["Type"] = type
                        usb_connect["LastDate"] = "알수없음"
                        usb_connect["Capacity"] = capacity
                        usb_connect["Etc"] = ""
                        usb_connect["nested"] = []
                        # USB 사용자 확인, user_logon_history 는 내림차순 정렬되어 있음
                        usb_user_name = "알수없음"
                        for history in user_logon_history:
                            user_name = history[0]
                            user_logon_time = history[1]
                            # 최근 사용자 확인
                            if user_logon_time < usb_local_time:
                                usb_user_name = user_name
                                break

                        usb_connect["User"] = usb_user_name

                        usb_connect_info.append(usb_connect)


        ####################################################################
        # 10000 번 이벤트가 없어서 2101, 2012 연결정보가 참조 안된경우 따로 리스트업
        ####################################################################
        extra_usb_connect_info = []
        seen = set()
        for usb_connect_history_data in usb_connect_history:
            if usb_connect_history_data[8] == False:
                if usb_connect_history_data[5] not in seen:
                    usb_connect = {}
                    usb_connect["Date"] = ""

                    extra_usb_connect = []

                    extra_usb_connect.append(usb_connect_history_data[3])
                    extra_usb_connect.append(usb_connect_history_data[4])
                    extra_usb_connect.append(usb_connect_history_data[5])
                    extra_usb_connect.append(usb_connect_history_data[6])


                    # MTP 장치 여부 확인
                    is_mtp = ""
                    for mtp in mtp_list:
                        if usb_connect_history_data[5] == mtp:
                            is_mtp = "MTP"
                    extra_usb_connect.append(is_mtp)
                    extra_usb_connect_info.append(extra_usb_connect)
                    seen.add(usb_connect_history_data[5])

        for extra_usb_connect in extra_usb_connect_info:
            usb_connect = {}


            vendor = extra_usb_connect[0]
            product = extra_usb_connect[1]
            serial = extra_usb_connect[2]
            type = extra_usb_connect[3]

            # (win10 해당됨) 시리얼과 파티션 테이블의 레지스트리 아이디가 같으면 해당 정보로 변경
            capacity = ""
            for partition_data in partition_list:
                if extra_usb_connect[2] == partition_data[3] or extra_usb_connect[2] == partition_data[4]:
                    vendor = partition_data[1]
                    product = partition_data[2]
                    serial = partition_data[3]
                    capacity = self.convert_capacity(partition_data[0])
                    break

            usb_connect["FirstDate"] = "알수없음"

            usb_connect["Vendor"] = vendor
            usb_connect["Product"] = product
            usb_connect["Serial"] = serial
            usb_connect["Type"] = type
            usb_connect["Capacity"] = capacity
            usb_connect["Etc"] = extra_usb_connect[4]

            usb_user_name = "알수없음"


            usb_connect["User"] = usb_user_name

            sub_usb_connect = []
            for usb_connect_history_data in  usb_connect_history :
                # 시리얼 번호가 같은경우
                if usb_connect_history_data[5] == extra_usb_connect[2] :

                    sub_usb_connect_data = {}
                    sub_usb_connect_data["Sub_Date"] = usb_connect_history_data[0]
                    sub_usb_connect_data["Sub_Gubun"] = usb_connect_history_data[1]
                    sub_usb_connect_data["Sub_EventID"] = usb_connect_history_data[2]
                    sub_usb_connect_data["Sub_Vendor"] = usb_connect_history_data[3]
                    sub_usb_connect_data["Sub_Product"] = usb_connect_history_data[4]
                    sub_usb_connect_data["Sub_Serial"] = usb_connect_history_data[5]
                    sub_usb_connect_data["Sub_User"] = usb_connect_history_data[7]
                    sub_usb_connect.append(sub_usb_connect_data)

                    last_date = usb_connect_history_data[0]
            usb_connect["nested"] = sub_usb_connect

            usb_connect["LastDate"] = last_date

            usb_connect_info.append(usb_connect)

        return rapidjson.dumps(usb_connect_info)


    def ajax_detail_events(self):
        filtered = list(filter(
            lambda x: ("Microsoft-Windows-UserPnp" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "20001"))
                    or ("Microsoft-Windows-DriverFrameworks-UserMode" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "10000"))
                    or ("Microsoft-Windows-DriverFrameworks-UserMode" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) in ("2101", "2102"))
                    or ("Microsoft-Windows-Security-Auditing" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) =="4624") and "User32" == x.get("EventData", {}).get("Data", [])[9].get("#text", None))
                    or ("Microsoft-Windows-Partition" == x.get("System", {}).get("Provider", {}).get("@Name", None) and (x.get("System", {}).get("EventID", {}).get("#text", None) == "1006")))
            , self.events.values()
        ))

        data = []

        for event in filtered:
            event["_PluginResult"] = {}
            EventID = event.get("System", {}).get("EventID", {}).get("#text", None)
            Provider = event.get("System", {}).get("Provider", {}).get("@Name", None)

            local_time = event.get("_Metadata", {}).get("LocalTimeCreated", None)

            if EventID == "2101":

                DeviceInstanceID = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("@instance", None)
                if DeviceInstanceID == None :
                    DeviceInstanceID = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("InstanceId", {}).get("#text", None)

                if DeviceInstanceID.startswith("WPDBUSENUMROOT") or DeviceInstanceID.startswith("SWD") or DeviceInstanceID.startswith("USB"):
                    usbinfo = self.get_usbinfo(DeviceInstanceID)

                    event["_PluginResult"]["Status"] = "<span class=\"label label-primary\">연결</span>"
                    event["_PluginResult"]["Vendor"] = usbinfo[0]
                    event["_PluginResult"]["Product"] = usbinfo[1]
                    event["_PluginResult"]["Serial"] = usbinfo[2]
                    event["_PluginResult"]["Type"] = usbinfo[3]
                    event["_PluginResult"]["Time"] = local_time
                    event["_PluginResult"]["Etc"] = ""

                    data.append(event)

            if EventID == "2102":
                DeviceInstanceID = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("@instance", None)
                if DeviceInstanceID == None:
                    DeviceInstanceID = event.get("UserData", {}).get("UMDFHostDeviceRequest", {}).get("InstanceId", {}).get("#text", None)

                if DeviceInstanceID.startswith("WPDBUSENUMROOT") or DeviceInstanceID.startswith("SWD") or DeviceInstanceID.startswith("USB"):
                    usbinfo = self.get_usbinfo(DeviceInstanceID)

                    event["_PluginResult"]["Status"] = "<span class=\"label label-danger\">해제</span>"
                    event["_PluginResult"]["Vendor"] = usbinfo[0]
                    event["_PluginResult"]["Product"] = usbinfo[1]
                    event["_PluginResult"]["Serial"] = usbinfo[2]
                    event["_PluginResult"]["Type"] = usbinfo[3]
                    event["_PluginResult"]["Time"] = local_time
                    event["_PluginResult"]["Etc"] = ""

                    data.append(event)

            if EventID == "10000":
                DeviceInstanceID = event.get("UserData", {}).get("UMDFDeviceInstallBegin", {}).get("DeviceId", {}).get("#text", None)

                if DeviceInstanceID.startswith("WPDBUSENUMROOT") or DeviceInstanceID.startswith("SWD") or DeviceInstanceID.startswith("USB") :

                    usbinfo = self.get_usbinfo(DeviceInstanceID)

                    event["_PluginResult"]["Status"] = "<span class=\"label label-success\">드라이버 설치</span>"
                    event["_PluginResult"]["Vendor"] = usbinfo[0]
                    event["_PluginResult"]["Product"] = usbinfo[1]
                    event["_PluginResult"]["Serial"] = usbinfo[2]
                    event["_PluginResult"]["Type"] = usbinfo[3]
                    event["_PluginResult"]["Time"] = local_time
                    event["_PluginResult"]["Etc"] = ""

                    data.append(event)

            if EventID == "20001":
                DriverName = event.get("UserData", {}).get("InstallDeviceID", {}).get("DriverName", {}).get("#text",None)
                DeviceInstanceID = event.get("UserData", {}).get("InstallDeviceID", {}).get("DeviceInstanceID", {}).get("#text", None)

                usbinfo = self.get_usbinfo(DeviceInstanceID)

                if DeviceInstanceID.startswith("USB") or DeviceInstanceID.startswith("WPDBUSENUMROOT") :
                    columns = DriverName.split("\\")
                    module_name = columns[len(columns)-1]

                    event["_PluginResult"]["Status"] = "<span class=\"label label-success\">드라이버 설치</span>"
                    event["_PluginResult"]["Vendor"] = usbinfo[0]
                    event["_PluginResult"]["Product"] = usbinfo[1]
                    event["_PluginResult"]["Serial"] = usbinfo[2]
                    event["_PluginResult"]["Type"] = usbinfo[3]
                    event["_PluginResult"]["Time"] = local_time
                    event["_PluginResult"]["Etc"] = module_name

                    data.append(event)
            if EventID == "1006":

                Capacity = event.get("EventData", {}).get("Data", [])[9].get("#text", None)
                vendor = event.get("EventData", {}).get("Data", [])[11].get("#text", None)
                product = event.get("EventData", {}).get("Data", [])[12].get("#text", None)
                serial = event.get("EventData", {}).get("Data", [])[14].get("#text", None)
                serial = serial.replace("{", "").replace("}", "")

                event["_PluginResult"]["Status"] = "<span class=\"label label-default\">파티션 정보</span>"
                event["_PluginResult"]["Vendor"] = vendor
                event["_PluginResult"]["Product"] = product
                event["_PluginResult"]["Serial"] = serial
                event["_PluginResult"]["Type"] = "unknown"
                event["_PluginResult"]["Time"] = local_time
                event["_PluginResult"]["Etc"] = self.convert_capacity(Capacity)

                data.append(event)

        return rapidjson.dumps(data)

    @jinja2_view("usb_storage.html")
    def index(self):
        return {}
