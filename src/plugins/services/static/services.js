var table_events;
var table_summary;

function datatables_service_eventid_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "7045": "<span class=\"label label-primary\">추가</span>",
        "7036": "<span class=\"label label-default\">상태 변경</span>",
        "7040": "<span class=\"label label-success\">시작유형 변경</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function refresh_service_events() {
    axios({
        method: "get",
        url:"./ajax_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "render": datatables_service_eventid_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8,9]
                },
                {
                    "visible": false,
                    "targets": [0]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginOutput._ServiceName" },
                { data: "_PluginOutput._ServiceDisplayName" },
                { data: "_PluginOutput._ImagePath" },
                { data: "_PluginOutput._BeforeStatusName" },
                { data: "_PluginOutput._ChangedStatusName" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 10, "desc" ]],
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
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_source",
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
                column_number : 4,
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
                filter_default_label: "서비스 이름",
                filter_container_id: "id_filter_servicename",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "서비스 표시 이름",
                filter_container_id: "id_filter_servicedisplayname",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 7,
                filter_type: "text",
                filter_default_label: "경로",
                filter_container_id: "id_filter_imagepath",
                style_class: "form-control",
                filter_reset_button_text: false
            },
            {
                column_number: 10,
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

function refresh_service_summary() {
    axios({
        method: "get",
        url:"./ajax_summary",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_summary = $("#id_table_summary").DataTable({
            columnDefs: [
                {
                    "render": function(data, type, row){
                        return data||"-";
                    },
                    targets: [0,1,2,3,4]
                }
            ],
            columns: [
                { data: "computer_name" },
                { data: "service_name" },
                { data: "service_display_name" },
                { data: "created_at" },
                { data: "last_status_changed_at" }
            ],
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
    });
}

$(document).ready(function () {
    refresh_service_events();
    refresh_service_summary();
});