# coding: utf-8
import os
import logging
import ntpath
import pyevtx

from re import compile
from io import StringIO, BytesIO
from lxml import etree, objectify


from utils.filesystem_redirection_disabler import DisableFileSystemRedirection


REGEXP_AMPERSAND_ENTITY_FIXER = compile("&(?!lt;|gt;|amp;|quot;|apos;)")


# https://stackoverflow.com/questions/18159221/remove-namespace-and-prefix-from-xml-in-python-using-lxml
def remove_namespace(xml_object):
    root = xml_object.getroot()

    for elem in root.getiterator():
        if not hasattr(elem.tag, 'find'): continue  # (1)
        i = elem.tag.find('}')
        if i >= 0:
            elem.tag = elem.tag[i + 1:]

    objectify.deannotate(root, cleanup_namespaces=True)


def evtx_record_elementtree_to_dict(elementtree):
    result = {}

    for idx, x in enumerate(elementtree.getchildren()):
        if (x.tag in result) and not isinstance(result[x.tag], list):
            original_duplicated = result[x.tag]
            result[x.tag] = []
            result[x.tag].append(original_duplicated)

        buffer = None

        if x.attrib or x.text:
            if x.getchildren():
                buffer = evtx_record_elementtree_to_dict(x)

            else:
                buffer = {}

            for k, v in x.attrib.items():
                buffer["@" + k] = v

            if x.text:
                buffer["#text"] = x.text.strip()

        if x.tag not in result:
            result[x.tag] = buffer

        elif (x.tag in result) and isinstance(result[x.tag], list):
            result[x.tag].append(buffer)

    return result


def evtx_file_to_dicts(path):
    result = []

    evtx_file = pyevtx.file()

    stream = BytesIO()

    with DisableFileSystemRedirection():
        with open(path, "rb") as file_object:
            stream.write(file_object.read())

        evtx_file.open_file_object(stream)

        idx = 0
        for idx in range(0, evtx_file.number_of_records):
            try:
                record = evtx_file.get_record(idx)

            except OSError as error:
                msg = "OSError - %d of %s (%s)" % (idx, path, error.__str__())
                logging.error(msg)
                continue

            finally:
                idx = idx + 1

            try:
                fixed_xml_string = REGEXP_AMPERSAND_ENTITY_FIXER.sub("&amp;", record.xml_string)
                fo = StringIO(fixed_xml_string)
                parsed_xml = etree.parse(fo)
                remove_namespace(parsed_xml)
                event_dict = evtx_record_elementtree_to_dict(parsed_xml.getroot())

                result.append(event_dict)

            except Exception as error:
                msg = "%s - processing %d of %s" % (error.__class__.__name__, idx - 1, path)
                logging.error(msg)
                # raise error

        evtx_file.close()

    return result
