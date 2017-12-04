import os
import IP2Location
from re import compile


i2l_object = None
# quick and dirty ipaddr format
REGEX_IP_ADDRESS = compile("\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}")


def _load_database():
    global i2l_object
    i2l_object = IP2Location.IP2Location()
    i2l_object.open(
        os.path.join("data", "ip2location_lite", "IP2LOCATION-LITE-DB1.BIN")
    )


def get_country_by_ip(ip_address):
    global i2l_object

    if not i2l_object:
        _load_database()

    if not REGEX_IP_ADDRESS.match(ip_address):
        return ""

    record = i2l_object.get_country_short(ip_address)
    return record.decode("ascii")
