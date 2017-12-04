var table_events;
var table_statistics;

function refresh_events(){
    axios({
        method: "get",
        url:"./ajax_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5,6,7,8,9,10]
                },
                {
                    "visible": false,
                    "targets": [0, 9]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginOutput.ProcessID_Numeric" },
                { data: "_PluginOutput.ProcessName" },
                { data: "_PluginOutput.ProcessPath" },
                { data: "_PluginOutput.ModuleName" },
                { data: "_PluginOutput.Offset" },
                { data: "_PluginOutput.Code" },

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
                filter_container_id: "id_filter_events_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_default_label: "이벤트 파일"
            },
            {
                column_number : 1,
                filter_type: "multi_select",
                filter_default_label: "Provider",
                filter_container_id: "id_filter_events_provider",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_events_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_events_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 5,
                filter_type: "multi_select",
                filter_default_label: "프로세스 이름",
                filter_container_id: "id_filter_events_processname",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 6,
                filter_type: "text",
                filter_default_label: "프로세스 경로",
                filter_container_id: "id_filter_events_processpath",
                style_class: "form-control",
                filter_reset_button_text: false
            },
            {
                column_number: 10,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_events_localtimecreated",
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
                        , "#id_filter_events_localtimecreated input"
                    );
                }
            }
        );
    });
}

function application_errors_text_to_filter(tag){
    var selected_process_path = $(tag).text();
    $("#id_filter_events_processpath input").val(selected_process_path);

    yadcf.exFilterExternallyTriggered(table_events);

    var text = "'" + selected_process_path + "' 이(가) 검색조건으로 반영되었습니다.";
    text = text + "<br>필터링 결과 : 총 " + table_events.rows({filter: 'applied'}).count() + " 개 이벤트";

    $.toast({
        heading: "검색조건 반영",
        text: text,
        stack: false,
        hideAfter: 10000,
        position: 'bottom-right',
        icon: 'info'
    });

    $("[href=\"#id_detail\"]").tab("show");
}

function datatables_application_errors_statistics_filter(data, type, row){
    return "<a href='#' onclick='application_errors_text_to_filter(this);return false;'>" + data + "</a>";
}

function refresh_statistics(){
    axios({
        method: "get",
        url:"./ajax_statistics",
        responseType: "json"
    }).then(function(response){
        var statistics = response.data;

        table_statistics = $("#id_table_statistics").DataTable({
            columnDefs: [
                {
                    "render": datatables_application_errors_statistics_filter,
                    "targets": [0]
                },
                {
                    "render": function (data, type, row){
                        return numeral(data).format("0,0");
                    },
                    "targets": [1]
                }
            ],
            columns: [
                { data: "ProcessPath" },
                { data: "Count" }
            ],
            order: [[ 1, "desc" ]],
            data: statistics,
            autoWidth: false,
            scrollX: false,
            deferRender: true,


            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],
            dom: 'frtipl',
            bDestroy: true
        });
    });
}

$(document).ready(function(){
    refresh_statistics();
    refresh_events();
});