import operator


def _sort_events_common(events, key_function, reverse):
    return sorted(
        events
        , key=key_function
        , reverse=reverse
    )


def sort_by_timecreated(events, reverse=False):
    return _sort_events_common(
        events
        , lambda k: k["System"]["TimeCreated"]["@SystemTime"]
        , reverse
    )


def sort_by_eventrecordid(events, reverse=False):
    return _sort_events_common(
        events
        , lambda k: int(k["System"]["EventRecordID"]["#text"])
        , reverse
    )


def sort_by_eventrecordid_string(events, reverse=False):
    return _sort_events_common(
        events
        , lambda k: k["System"]["EventRecordID"]["#text"]
        , reverse
    )
