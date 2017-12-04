var table_events;



function usb_type_formatter(value){
    var return_value = "-";

    var types = {
        "memory": "<img src='./static/images/memory.png' width='32' height='32'  />",
        "disk": "<img src='./static/images/disk.png' width='32' height='32' />",
        "mobile": "<img src='./static/images/mobile.png' width='32' height='32' />"
    };

    if (value in types){
        return_value = types[value];
    }

    return return_value
 }




function datatables_system_on_off_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "start": "<span class=\"label label-primary\">시작</span>",
        "stop": "<span class=\"label label-danger\">종료</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function render_usb_storage_dashboard_events(){

    var $table = $('#table');

     $.ajax({
        url: "./ajax_dashboard_events",
        success: function (data, status, xhr) {

            var json = JSON.parse(data);



            var i=0;
            var subtable = '';
            for (var key in json) {
                if (json.hasOwnProperty(key)) {

                    sub_json = json[key].nested

                    if (sub_json != "" ) {
                        $('#tab_logic').append('<tr bgcolor="#ECEFF1" class="clickable" data-toggle="collapse" data-target=".' + i + 'subtable" id="addr' + (i) + '"></tr>');


                        subtable = '<table class="table table-bordered table-hover">';
                        subtable += "<thead><th>날짜</th><th>구분</th><th>EventID</th><th>제조사</th><th>제품명</th><th>시리얼</th><th>사용자</th></thead>";
                        for (var sub_key in sub_json) {

                            if (sub_json.hasOwnProperty(sub_key)) {

                                subtable += "<tr>";
                                subtable += "<td>" + sub_json[sub_key].Sub_Date + "</td>";
                                if (sub_json[sub_key].Sub_EventID== "2101") subtable += "<td><font color='red'>" + sub_json[sub_key].Sub_Gubun + "</font></td>";
                                else subtable += "<td><font color='blue'>" + sub_json[sub_key].Sub_Gubun + "</font></td>";
                                subtable += "<td>" + sub_json[sub_key].Sub_EventID + "</td>";
                                subtable += "<td>" + sub_json[sub_key].Sub_Vendor + "</td>";
                                subtable += "<td>" + sub_json[sub_key].Sub_Product + "</td>";
                                subtable += "<td>" + sub_json[sub_key].Sub_Serial + "</td>";
                                subtable += "<td>" + sub_json[sub_key].Sub_User + "</td>";
                                subtable += "</tr>";
                            }
                        }
                        subtable += "</table>";

                        $('#tab_logic').append('<tr class="collapse out budgets '+i+'subtable"><td colspan="9">'+subtable+'</td></tr>');

                    }
                    else {
                        $('#tab_logic').append('<tr class="clickable" data-toggle="collapse" data-target=".' + i + 'subtable" id="addr'+(i)+'"></tr>');


                    }
                    $('#addr' + i).html("<td>" + json[key].FirstDate + "</td><td>" + json[key].LastDate + "</td><td>" + usb_type_formatter(json[key].Type) + "</td><td>" + json[key].Vendor + "</td><td>" + json[key].Product + "</td><td>" + json[key].Serial + "</td><td>" + json[key].Capacity + "</td><td>" + json[key].User + "</td><td>" + json[key].Etc + "</td>");

                  i+=1;
                }
            }


        }
    }
    );

}


function refresh_usb_storage_detail_events() {
    axios({
        method: "get",
        url:"./ajax_detail_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;


        table_events = $("#id_table_events").DataTable({

            columnDefs: [

                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6]
                },
                {
                "targets": [0],
                "visible": false
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },
                { data: "_Metadata.LocalTimeCreated" },
                { data: "_PluginResult.Status" },
                { data: "_PluginResult.Vendor" },
                { data: "_PluginResult.Product" },
                { data: "_PluginResult.Serial" },
                { data: "_PluginResult.Etc" }
            ],
            order: [[ 4, "desc" ]],
            data: events,
            colReorder: true,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],

            dom: 'Bfrtipl',
            buttons: [
                {
                    extend: 'colvis',
                    text: '<i class="fa fa-columns" aria-hidden="true"> 컬럼 표시/숨김</i>'
                },
                {
                    extend: 'copy',
                    text: '<i class="fa fa-clipboard" aria-hidden="true"> 클립보드에 복사</i>'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print" aria-hidden="true"> 인쇄하기</i>'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-floppy-o" aria-hidden="true"> CSV로 내보내기</i>'
                }
            ],
            bDestroy: true
        });

        yadcf.init(table_events,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_container_id: "id_filter_source",
                style_class: "form-control chosen-select",
                filter_default_label: "이벤트 파일",
                filter_reset_button_text: false
            },
            {
                column_number : 1,
                filter_type: "multi_select",
                filter_default_label: "Provider",
                filter_container_id: "id_filter_provider",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "상태",
                filter_container_id: "id_filter_status",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "제조사",
                filter_container_id: "id_filter_vendor",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "제품명",
                filter_container_id: "id_filter_product",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 4,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_localtimecreated",
                filter_plugin_options: {
                    showTodayButton: true,
                    showClear: true
                },
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });

                    create_summary_chart(
                        "id_summary_chart", table_events, default_datetime_getter
                        , "#id_filter_localtimecreated input"
                    );
                }
            }
        );
    });
}

$(document).ready(function(){
    render_usb_storage_dashboard_events();

    refresh_usb_storage_detail_events();

});