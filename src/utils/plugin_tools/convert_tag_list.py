def convert_tag_list_using_name_property(duplicated_name_tags, unknown_tag_prefix="Unknown"):
    return_value = dict()

    unknown_seen = 0

    for duplicated_name_tag in duplicated_name_tags:
        if not duplicated_name_tag:
            continue

        if "@Name" in duplicated_name_tag:
            return_value[duplicated_name_tag["@Name"]] = duplicated_name_tag.get("#text", "")

        else:
            return_value["%s_%d" % (unknown_tag_prefix, unknown_seen)] = "" or duplicated_name_tag.get("#text", "")
            unknown_seen = unknown_seen + 1

    return return_value
