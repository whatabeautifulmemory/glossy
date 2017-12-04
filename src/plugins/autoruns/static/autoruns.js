var table_scheduler;
var table_logon;
var table_bho;

function datatables_autoruns_logon_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "folder": "<img src='./static/images/autoruns_folder.png' width=20 height=20 />",
        "registry": "<img src='./static/images/autoruns_registry.png' width=20 height=20 />"
    };

    if (data in types){
        return_value = types[data];
    }
    return return_value;
}

function datatables_autoruns_scheduler_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "등록": "<span class=\"label label-primary\">"+data+"</span>",
        "변경": "<span class=\"label label-danger\">"+data+"</span>",
        "시작": "<span class=\"label label-success\">"+data+"</span>",
        "종료": "<span class=\"label label-warning\">"+data+"</span>",
        "삭제": "<span class=\"label label-danger\">"+data+"</span>"
    };

    if (data in types){
        return_value = types[data];
    }
    return return_value;
}

function refresh_autoruns_scheduler_events() {
    axios({
        method: "get",
        url:"./ajax_scheduler_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_scheduler = $("#id_table_scheduler").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0,1]
                },
                {
                    "render": datatables_autoruns_scheduler_type_renderer,
                    "targets": [4]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,5,6,7]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginResult.Status" },
                { data: "_PluginResult.TaskName" },
                { data: "_PluginResult.ActionName" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 7, "desc" ]],
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

        yadcf.init(table_scheduler,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_container_id: "id_filter_scheduler_source",
                style_class: "form-control chosen-select",
                filter_default_label: "이벤트 파일",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_scheduler_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_scheduler_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "상태",
                filter_container_id: "id_filter_scheduler_status",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "Task 이름",
                filter_container_id: "id_filter_scheduler_taskname",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 7,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_scheduler_localtimecreated",
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
                        "id_scheduler_summary_chart", table_scheduler, default_datetime_getter
                        , "#id_filter_scheduler_localtimecreated input"
                    );
                }
            }
        );
    });
}

function refresh_autoruns_logon_events() {
    axios({
        method: "get",
        url:"./ajax_logon_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_logon = $("#id_table_logon").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0,1]
                },
                {
                    "render": datatables_autoruns_logon_type_renderer,
                    "targets": [4]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,5,6,7,8,9]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginResult.Type" },
                { data: "_PluginResult.ObjectPath" },
                { data: "_PluginResult.ObjectName" },
                { data: "_PluginResult.ObjectValue" },
                { data: "_PluginResult.ProcessName" },
                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 9, "desc" ]],
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

        yadcf.init(table_logon,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_container_id: "id_filter_logon_source",
                style_class: "form-control chosen-select",
                filter_default_label: "이벤트 파일",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_logon_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_logon_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "타입",
                filter_container_id: "id_filter_logon_type",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 9,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_logon_localtimecreated",
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
                        "id_logon_summary_chart", table_logon, default_datetime_getter
                        , "#id_filter_logon_localtimecreated input"
                    );
                }
            }
        );
    });
}

function refresh_autoruns_bho_events() {
    axios({
        method: "get",
        url:"./ajax_bho_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_bho = $("#id_table_bho").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0,1]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5,6,7]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginResult.ObjectPath" },
                { data: "_PluginResult.ObjectName" },
                { data: "_PluginResult.ProcessName" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 7, "desc" ]],
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

        yadcf.init(table_bho,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_container_id: "id_filter_bho_source",
                style_class: "form-control chosen-select",
                filter_default_label: "이벤트 파일",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_bho_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_bho_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 7,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_bho_localtimecreated",
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
                        "id_bho_summary_chart", table_bho, default_datetime_getter
                        , "#id_filter_bho_localtimecreated input"
                    );
                }
            }
        );
    });
}

$(document).ready(function(){
    refresh_autoruns_scheduler_events();
    refresh_autoruns_logon_events();
    refresh_autoruns_bho_events();
});