function create_default_printer_change_statistics_by_computer_name(events){
    var buf = {};

    for(var idx in events){
        var event = events[idx];

        buf[event.System.Computer["#text"]] = event;
    }

    var return_value = [];
    for(var idx_ in buf){
        return_value.push(buf[idx_]);
    }

    return return_value;
}

function get_statistics_prints_per_computer(events){
    var statistics_dict = {};

    for(var idx in events){
        var event = events[idx];

        console.log(event);

        if ("307" in event){
            var computer_name = event["307"].System.Computer["#text"];
            var pages = parseInt(event["307"].UserData.DocumentPrinted.Param8["#text"]);
            var copies = parseInt(event["805"].UserData.RenderJobDiag.Copies["#text"]);
            var paper_count = pages * copies;

            if(!statistics_dict.hasOwnProperty(computer_name)){
                statistics_dict[computer_name] = 0;
            }

            statistics_dict[computer_name] = statistics_dict[computer_name] + paper_count;
        }
    }

    return statistics_dict;
}

function get_statistics_prints_per_printer(events){
    var statistics_dict = {};

    for(var idx in events){
        var event = events[idx];

        var printer_name = event["307"].UserData.DocumentPrinted.Param5["#text"];
        var pages = parseInt(event["307"].UserData.DocumentPrinted.Param8["#text"]);
        var copies = parseInt(event["805"].UserData.RenderJobDiag.Copies["#text"]);
        var paper_count = pages * copies;

        if(!statistics_dict.hasOwnProperty(printer_name)){
            statistics_dict[printer_name] = 0;
        }

        statistics_dict[printer_name] = statistics_dict[printer_name] + paper_count;
    }

    return statistics_dict;
}

function render_print_statistics(chart_object_id, data){
    var chart_prints_per_printer = echarts.init(document.getElementById(chart_object_id));
    var option = {
        tooltip: {},
        legend: {
            data:['Prints']
        },
        xAxis: {
            data: Object.keys(data)
        },
        yAxis: {},
        series: [{
            name: 'Prints',
            type: 'bar',
            data: Object.values(data)
        }]
    };

    // use configuration item and data specified to show chart
    chart_prints_per_printer.setOption(option);
}


var table_all_events = null;

function refresh_events(){
    axios({
        method: "get",
        url:"./ajax_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_all_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5,6]
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
                { data: "System.Computer.#text" },
                { data: "System.Execution.@ProcessID" },
                { data: "System.Execution.@ThreadID" },
                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 6, "desc" ]],
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
            bDestroy: true,

            initComplete: function () {
                console.log("initComplete");
            }
        });

        var datepicker_defaults = {
            showTodayButton: true,
            showClear: true
        };

        yadcf.init(table_all_events,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_all_events_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_all_events_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_all_events_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 6,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_all_events_localtimecreated",
                filter_plugin_options: datepicker_defaults,
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });

                    create_summary_chart(
                        "id_all_events_summary_chart", table_all_events, default_datetime_getter
                        , "#id_filter_all_events_localtimecreated input"
                    );
                }
            }
        );
    });
}

var table_detailed = null;
function refresh_events_detailed(){
    axios({
        method: "get",
        url:"./ajax_events_detailed",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        // var statistics_print_per_computer = get_statistics_prints_per_computer(events);
        // render_print_statistics("id_chart_prints_per_computer", statistics_print_per_computer);
        //
        // var statistics_print_per_printer = get_statistics_prints_per_printer(events);
        // render_print_statistics("id_chart_prints_per_printer", statistics_print_per_printer);

        table_detailed = $("#id_table_detailed").DataTable({
            columnDefs: [
                {
                    "render": function(data, type, row){return data||"-"},
                    "targets": [0,1,2,3,4,5,6,7,8,9]
                },
                {
                    "visible": false,
                    "targets": [0]
                }
            ],
            columns: [
                { data: "307._Metadata.Source" },
                { data: "801.UserData.JobDiag.JobId.#text" },
                { data: "307.UserData.DocumentPrinted.Param4.#text" },
                { data: "307.UserData.DocumentPrinted.Param3.#text" },
                { data: "307.UserData.DocumentPrinted.Param1.#text" },
                { data: "307.UserData.DocumentPrinted.Param2.#text" },
                { data: "307.UserData.DocumentPrinted.Param5.#text" },
                { data: "307.UserData.DocumentPrinted.Param6.#text" },
                // { data: "307.UserData.DocumentPrinted.Param8.#text" },
                // { data: "805.UserData.RenderJobDiag.Copies.#text" },
                { data: "812.UserData.FileOpFailed.Source.#text" },
                { data: "307._Metadata.LocalTimeCreated" }
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
            bDestroy: true,

            initComplete: function () {
                console.log("initComplete");
            }
        });

        var datepicker_defaults = {
            showTodayButton: true,
            showClear: true
        };

        yadcf.init(table_detailed,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_detailed_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
                {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "위치",
                filter_container_id: "id_filter_detailed_position",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "사용자",
                filter_container_id: "id_filter_detailed_user",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 5,
                filter_type: "multi_select",
                filter_default_label: "문서이름",
                filter_container_id: "id_filter_detailed_document",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "프린터 이름",
                filter_container_id: "id_filter_detailed_printer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 9,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_detailed_localtimecreated",
                filter_plugin_options: datepicker_defaults,
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });

                    create_summary_chart(
                        "id_print_detail_summary_chart", table_detailed, function(row){ return row["307"]._Metadata.LocalTimeCreated; }
                        , "#id_filter_detailed_localtimecreated input"
                    );
                }
            }
        );
    });
}


var table_default_printer_changes = null;
var table_default_printer_statistics = null;

function refresh_default_printer_changes(){
    axios({
        method: "get",
        url:"./ajax_default_printer_changes",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        var statistics = create_default_printer_change_statistics_by_computer_name(events);

        table_default_printer_statistics = $("#id_table_default_printer_statistics").DataTable({
            columnDefs: [
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2]
                }
            ],
            columns: [
                { data: "System.Computer.#text" },
                { data: "_PluginOutput.NewDefaultPrinterNameOnly" },
                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 2, "desc" ]],

            data: statistics,
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
            bDestroy: true,

            initComplete: function () {
                console.log("initComplete");
            }
        });

        table_default_printer_changes = $("#id_table_default_printer_changes").DataTable({
            columnDefs: [
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5]
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
                { data: "System.Computer.#text" },
                { data: "_PluginOutput.NewDefaultPrinterNameOnly" },
                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 5, "desc" ]],
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
            bDestroy: true,

            initComplete: function () {
                console.log("initComplete");
            }
        });

        var datepicker_defaults = {
            showTodayButton: true,
            showClear: true
        };

        yadcf.init(table_default_printer_changes,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_default_printer_change_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_default_printer_change_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "새 기본 프린터",
                filter_container_id: "id_filter_default_printer_change_newdefaultprinter",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 5,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_default_printer_change_localtimecreated",
                filter_plugin_options: datepicker_defaults,
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });
                }
            }
        );
    });
}

$(document).ready(function(){
    refresh_default_printer_changes();
    refresh_events_detailed();
    refresh_events();
});