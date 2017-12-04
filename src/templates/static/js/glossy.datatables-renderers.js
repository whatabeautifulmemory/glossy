function datatables_level_renderer(data, type, row){
    var return_value = "-";

    var level_message_map = {
        "0": "<span class=\"label label-primary\">정보</span>",
        "1": "<span class=\"label label-danger\">위험</span>",
        "2": "<span class=\"label label-danger\">오류</span>",
        "3": "<span class=\"label label-warning\">경고</span>",
        "4": "<span class=\"label label-primary\">정보</span>",
        "5": "<span class=\"label label-primary\">추가 정보</span>"
    };

    // var security_level_message_map = {
    //
    // };

    var message_map = level_message_map;

    // if("Security" === row.System.Channel){
    //     message_map = security_level_message_map;
    // }

    if (data in message_map){
        return_value = message_map[data];
    }

    return return_value;
}

function datatables_detail_link_renderer(data, type, row){
    return "<a href='#' onclick='app_dialog_detail.get_event(" + row._id + ");return false;'>" + (data||"-") + "</a>";
}
